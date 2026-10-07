"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Account, Client } from "node-appwrite";
import { PHOTOGRAPHER_LABEL, SESSION_COOKIE, admin } from "@/lib/appwrite/server";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Entra com e-mail e senha da conta do Appwrite. Só contas com o rótulo "fotografa" acessam o painel. */
export async function login(email: string, password: string): Promise<{ error: string } | undefined> {
  const { account, users } = admin();
  let session;
  try {
    session = await account.createEmailPasswordSession({ email: email.trim(), password });
  } catch {
    await wait(600);
    return { error: "E-mail ou senha incorretos." };
  }

  const user = await users.get({ userId: session.userId });
  if (!user.labels.includes(PHOTOGRAPHER_LABEL)) {
    await users.deleteSession({ userId: session.userId, sessionId: session.$id }).catch(() => {});
    return { error: "Esta conta não tem acesso ao painel." };
  }

  (await cookies()).set(SESSION_COOKIE, session.secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expire),
  });
  redirect("/painel");
}

export async function logout() {
  const store = await cookies();
  const secret = store.get(SESSION_COOKIE)?.value;
  if (secret) {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setSession(secret);
    await new Account(client).deleteSession({ sessionId: "current" }).catch(() => {});
  }
  store.delete(SESSION_COOKIE);
  redirect("/entrar");
}
