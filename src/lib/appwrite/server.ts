import "server-only";

// Acesso ao Appwrite pelo servidor. A chave de API só existe aqui (variáveis de ambiente),
// nunca chega ao navegador.

import { cache } from "react";
import { cookies } from "next/headers";
import { Account, Client, Query, Storage, TablesDB, Users, type Models } from "node-appwrite";

export const DATABASE = "aosolhos";
export const BUCKET = "fotos";
export const TABLES = { galleries: "galleries", photos: "photos", clients: "clients", studio: "studio" } as const;
/** Rótulo que identifica a conta da fotógrafa no Appwrite. */
export const PHOTOGRAPHER_LABEL = "fotografa";
export const SESSION_COOKIE = "aos-sessao";
/** O estúdio é uma linha só, com este id. */
export const STUDIO_ROW = "estudio";
/** Cookie por galeria com "idDoCliente.código", conferido no banco a cada acesso. */
export const clientCookie = (galleryId: string) => `aos-g-${galleryId}`;

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} no .env.local`);
  return value;
}

function baseClient() {
  return new Client().setEndpoint(env("APPWRITE_ENDPOINT")).setProject(env("APPWRITE_PROJECT_ID"));
}

/** Cliente com a chave de API: acesso total. Use só depois de conferir quem está pedindo. */
export function admin() {
  const client = baseClient().setKey(env("APPWRITE_API_KEY"));
  return { account: new Account(client), db: new TablesDB(client), storage: new Storage(client), users: new Users(client) };
}

/** Conta da fotógrafa logada nesta requisição, ou null. */
export const getPhotographer = cache(async (): Promise<Models.User | null> => {
  const secret = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!secret) return null;
  try {
    const user = await new Account(baseClient().setSession(secret)).get();
    return user.labels.includes(PHOTOGRAPHER_LABEL) ? user : null;
  } catch {
    return null;
  }
});

export async function requirePhotographer() {
  const user = await getPhotographer();
  if (!user) throw new Error("Sessão expirada. Entre de novo.");
  return user;
}

/** Lista todas as linhas de uma tabela, de página em página. */
export async function listAll<T extends Models.Row>(tableId: string, queries: string[] = []): Promise<T[]> {
  const { db } = admin();
  const rows: T[] = [];
  for (;;) {
    const last = rows.at(-1);
    const page = await db.listRows<T>({
      databaseId: DATABASE,
      tableId,
      queries: [...queries, Query.limit(500), ...(last ? [Query.cursorAfter(last.$id)] : [])],
    });
    rows.push(...page.rows);
    if (page.rows.length < 500) return rows;
  }
}
