// Cria banco, tabelas e bucket do Aos Olhos no Appwrite. Pode rodar de novo: o que já existe é mantido.
// Uso: node --env-file=.env.local scripts/appwrite-setup.mjs

import { Client, Permission, Role, Storage, TablesDB } from "node-appwrite";

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY } = process.env;
for (const [name, value] of Object.entries({ APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY })) {
  if (!value) throw new Error(`Falta ${name} no .env.local`);
}

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);
const db = new TablesDB(client);
const storage = new Storage(client);

// Mesmos ids usados em src/lib/appwrite/config.ts
const DATABASE = "aosolhos";
const BUCKET = "fotos";
/** Rótulo da conta da fotógrafa: só ela envia fotos direto do navegador. */
const PHOTOGRAPHER = Role.label("fotografa");

const varchar = (key, size, extra = {}) => ({ key, type: "varchar", size, required: false, ...extra });
const text = (key) => ({ key, type: "text", required: false });
const int = (key, extra = {}) => ({ key, type: "integer", required: false, ...extra });
const bool = (key, xdefault) => ({ key, type: "boolean", required: false, default: xdefault });
const date = (key) => ({ key, type: "datetime", required: false });

// Tabelas: só o servidor (chave de API) lê e grava. Nenhuma permissão pública.
const tables = [
  {
    tableId: "galleries",
    name: "Galerias",
    columns: [
      varchar("title", 200, { required: true }),
      varchar("eventDate", 10),
      varchar("clientName", 200),
      varchar("category", 100),
      int("includedPhotos"),
      bool("allowExtras", true),
      { key: "extraPrice", type: "double", required: false },
      varchar("deadline", 10),
      varchar("expiresAt", 10),
      bool("archived", false),
      text("message"),
      { key: "status", type: "enum", elements: ["rascunho", "selecao", "finalizada", "entregue"], required: true },
      date("sentAt"),
      date("deliveredAt"),
      varchar("coverPhotoId", 64),
      text("folders"), // JSON: Folder[]
      text("favoriteIds"), // JSON: string[]
      text("design"), // JSON: GalleryDesign
      bool("watermark", true),
      bool("allowShare", true),
      int("sameDayCount"),
      date("sameDayReleasedAt"),
    ],
    indexes: [],
  },
  {
    tableId: "photos",
    name: "Fotos",
    columns: [
      varchar("galleryId", 64, { required: true }),
      { key: "kind", type: "enum", elements: ["selecao", "entrega", "dia"], required: true },
      varchar("name", 255),
      int("width"),
      int("height"),
      varchar("folderId", 64),
      int("position"),
      /** Versão reduzida (até 1600 px) que aparece nas galerias. */
      varchar("fileId", 64, { required: true }),
      /** Arquivo original em alta, quando houver (fotos entregues). */
      varchar("originalFileId", 64),
    ],
    indexes: [{ key: "por_galeria", type: "key", attributes: ["galleryId", "kind", "position"] }],
  },
  {
    tableId: "clients",
    name: "Clientes",
    columns: [
      varchar("galleryId", 64, { required: true }),
      varchar("name", 200),
      varchar("email", 320),
      varchar("accessCode", 6, { required: true }),
      text("photoIds"), // JSON: string[]
      text("comments"), // JSON: Record<string, string>
      text("bwIds"), // JSON: string[]
      date("finalizedAt"),
    ],
    indexes: [{ key: "codigo_por_galeria", type: "unique", attributes: ["galleryId", "accessCode"] }],
  },
  {
    tableId: "studio",
    name: "Estúdio",
    columns: [varchar("name", 200), varchar("logoFileId", 64), text("watermark"), { key: "logo", type: "mediumtext", required: false }],
    indexes: [],
  },
];

async function exists(fn) {
  try {
    await fn();
    return true;
  } catch (err) {
    if (err.code === 404) return false;
    throw err;
  }
}

if (await exists(() => db.get({ databaseId: DATABASE }))) {
  console.log(`= banco "${DATABASE}" já existe`);
} else {
  await db.create({ databaseId: DATABASE, name: "Aos Olhos" });
  console.log(`+ banco "${DATABASE}"`);
}

for (const t of tables) {
  if (await exists(() => db.getTable({ databaseId: DATABASE, tableId: t.tableId }))) {
    // Tabela já existe: cria só as colunas novas.
    const { columns } = await db.getTable({ databaseId: DATABASE, tableId: t.tableId });
    const missing = t.columns.filter((c) => !columns.some((existing) => existing.key === c.key));
    for (const c of missing) {
      if (c.type !== "mediumtext") throw new Error(`Coluna nova ${t.tableId}.${c.key} (${c.type}): adicione o tipo neste script`);
      await db.createMediumtextColumn({ databaseId: DATABASE, tableId: t.tableId, key: c.key, required: c.required });
      console.log(`+ coluna ${t.tableId}.${c.key}`);
    }
    if (!missing.length) console.log(`= tabela "${t.tableId}" já existe`);
    continue;
  }
  await db.createTable({ databaseId: DATABASE, tableId: t.tableId, name: t.name, permissions: [], rowSecurity: false, ...t });
  console.log(`+ tabela "${t.tableId}" (${t.columns.length} colunas, ${t.indexes.length} índice(s))`);
}

if (await exists(() => storage.getBucket({ bucketId: BUCKET }))) {
  console.log(`= bucket "${BUCKET}" já existe`);
} else {
  await storage.createBucket({
    bucketId: BUCKET,
    name: "Fotos",
    permissions: [
      Permission.create(PHOTOGRAPHER),
      Permission.read(PHOTOGRAPHER),
      Permission.update(PHOTOGRAPHER),
      Permission.delete(PHOTOGRAPHER),
    ],
    fileSecurity: false,
    allowedFileExtensions: ["jpg", "jpeg", "png", "webp"],
    compression: "none", // JPEG já é comprimido
  });
  console.log(`+ bucket "${BUCKET}" (privado; só a fotógrafa envia)`);
}

// As colunas são criadas em segundo plano; confere se ficaram prontas.
for (const t of tables) {
  const { columns } = await db.getTable({ databaseId: DATABASE, tableId: t.tableId });
  const pending = columns.filter((c) => c.status !== "available").map((c) => `${c.key}:${c.status}`);
  console.log(`  ${t.tableId}: ${pending.length ? `aguardando ${pending.join(", ")}` : "todas as colunas prontas"}`);
}
