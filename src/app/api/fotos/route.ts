import { Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { BUCKET, DATABASE, TABLES, admin, getPhotographer } from "@/lib/appwrite/server";
import { createRow, findGalleryRow } from "@/lib/appwrite/queries";
import { type PhotoKind, type PhotoRow, galleryToRow, rowToPhoto } from "@/lib/appwrite/rows";

// Recebe uma foto por vez (já reduzida no navegador) e guarda no Appwrite.

const kinds: PhotoKind[] = ["selecao", "entrega", "dia"];
const MAX_BYTES = 4 * 1024 * 1024; // abaixo do limite de 4,5 MB por requisição da Vercel

const error = (message: string, status = 400) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  if (!(await getPhotographer())) return error("Sessão expirada. Entre de novo.", 401);

  const form = await request.formData();
  const file = form.get("file");
  const id = String(form.get("id") ?? "");
  const galleryId = String(form.get("galleryId") ?? "");
  const kind = String(form.get("kind") ?? "") as PhotoKind;
  const folderId = String(form.get("folderId") ?? "") || null;

  if (!(file instanceof File) || !file.type.startsWith("image/")) return error("Arquivo de imagem ausente.");
  if (file.size > MAX_BYTES) return error("Foto grande demais para enviar.");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(id)) return error("Id inválido.");
  if (!kinds.includes(kind)) return error("Tipo inválido.");

  const gallery = await findGalleryRow(galleryId);
  if (!gallery) return error("Galeria não encontrada.", 404);

  const { db, storage } = admin();
  const last = await db.listRows<PhotoRow>({
    databaseId: DATABASE,
    tableId: TABLES.photos,
    queries: [Query.equal("galleryId", galleryId), Query.equal("kind", kind), Query.orderDesc("position"), Query.limit(1)],
  });
  if (kind === "dia" && last.total >= (gallery.sameDayCount ?? 0)) return error("Limite de fotos do dia atingido.");

  await storage.createFile({
    bucketId: BUCKET,
    fileId: id,
    file: InputFile.fromBuffer(new Uint8Array(await file.arrayBuffer()), file.name || `${id}.jpg`),
  });
  const row = await createRow<PhotoRow>(TABLES.photos, id, {
    galleryId,
    kind,
    fileId: id,
    name: String(form.get("name") ?? file.name).slice(0, 255),
    width: Number(form.get("width")) || null,
    height: Number(form.get("height")) || null,
    folderId: kind === "selecao" ? folderId : null,
    position: (last.rows[0]?.position ?? 0) + 1,
  });

  // Primeira foto vira a capa.
  if (kind === "selecao" && !gallery.coverPhotoId) {
    await db.updateRow({ databaseId: DATABASE, tableId: TABLES.galleries, rowId: galleryId, data: galleryToRow({ coverPhotoId: id }) });
  }
  return Response.json(rowToPhoto(row));
}
