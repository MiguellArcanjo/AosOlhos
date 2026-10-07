// Dá acesso ao painel para uma conta já criada no Appwrite (Auth → Users), colocando o rótulo "fotografa".
// Uso: node --env-file=.env.local scripts/appwrite-fotografa.mjs email@exemplo.com

import { Client, Query, Users } from "node-appwrite";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) throw new Error("Informe o e-mail: node --env-file=.env.local scripts/appwrite-fotografa.mjs email@exemplo.com");

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY } = process.env;
const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);
const users = new Users(client);

const { users: found } = await users.list({ queries: [Query.equal("email", email)] });
const user = found[0];
if (!user) throw new Error(`Nenhuma conta com o e-mail ${email}. Crie em Auth → Users no Appwrite.`);

if (user.labels.includes("fotografa")) {
  console.log(`= ${email} já tem acesso ao painel`);
} else {
  await users.updateLabels({ userId: user.$id, labels: [...user.labels, "fotografa"] });
  console.log(`+ ${email} agora tem acesso ao painel`);
}
