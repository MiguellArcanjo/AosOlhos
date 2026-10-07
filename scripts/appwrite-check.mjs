// Testa a conexão com o Appwrite sem criar nada.
// Uso: node --env-file=.env.local scripts/appwrite-check.mjs

import { Client, Storage, TablesDB, Users } from "node-appwrite";

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY } = process.env;
for (const [name, value] of Object.entries({ APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY })) {
  if (!value) throw new Error(`Falta ${name} no .env.local`);
}

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);

const checks = {
  "Banco (databases.read)": () => new TablesDB(client).list().then((r) => `${r.total} banco(s): ${r.databases.map((d) => d.$id).join(", ") || "nenhum"}`),
  "Arquivos (buckets.read)": () => new Storage(client).listBuckets().then((r) => `${r.total} bucket(s): ${r.buckets.map((b) => b.$id).join(", ") || "nenhum"}`),
  "Usuários (users.read)": () => new Users(client).list().then((r) => `${r.total} usuário(s)`),
};

for (const [label, run] of Object.entries(checks)) {
  try {
    console.log(`✓ ${label}: ${await run()}`);
  } catch (err) {
    console.log(`✗ ${label}: ${err.code ?? ""} ${err.type ?? ""} ${err.message}`);
  }
}
