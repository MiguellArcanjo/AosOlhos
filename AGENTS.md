<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Aos Olhos — guia para continuar o trabalho

Documento de passagem para o próximo agente. Leia inteiro antes de mexer no código.

## O que é

Sistema de **seleção e entrega de fotos** para uma fotógrafa (noiva do usuário), marca **"Aos Olhos"**.
Objetivo: ela parar de pagar **Selpics** e **Google Fotos**. O Selpics (selpics.com) é a referência de produto.

Fluxo: fotógrafa cria galeria e sobe fotos → envia link + código ao cliente → cliente escolhe as fotos
(limite do pacote, extras pagas, prazo, comentários) → fotógrafa recebe a seleção (lista para o Lightroom)
→ sobe as fotos editadas → cliente baixa (zip), vê slideshow, compartilha.

Filosofia do usuário: **começar simples e crescer conforme a fotógrafa pedir.** Não antecipe recursos grandes sem ele pedir.

## Regras do usuário (obrigatórias)

- Responder ao usuário em **português do Brasil**. Toda a interface e os comentários do código também são em português.
- **Nunca** colocar chaves, tokens ou senhas no chat, em commits ou em `src/`. Segredos só em `.env*` (já no `.gitignore`).
- **Nunca usar fotos reais de clientes** em testes/demos. Use `picsum.photos`.
- **Commit e push só quando o usuário pedir.** Mensagem de commit em português.
- Pedir autorização antes de alterar qualquer recurso do Azure/VM (há um chat separado para infraestrutura).
- **Ignore a branch `codex/redesign-galerias`** (trabalho de outro agente, GPT/Codex). Não considere, não junte, não resolva conflitos com ela, a menos que o usuário peça.

## Estado atual (07/10/2026)

**Fase 2: Appwrite.** Dados no Appwrite Cloud (região `nyc`), login real da fotógrafa, acesso do cliente conferido no servidor.
Não há mais dados de demonstração: o banco começa vazio.

| Branch | Conteúdo | Onde |
| --- | --- | --- |
| `main` | Primeira versão visual | GitHub `MiguellArcanjo/AosOlhos` |
| `claude/galerias-avancadas` | `main` + pastas, vários clientes, aparência, Estúdio, marca d'água, slideshow, compartilhar, expiração, P&B, entrega no dia, pastas de galerias, **Appwrite** | GitHub, **ainda não juntada na `main`** |

Pastas no computador do usuário (Windows):
- `C:\Users\conta\Desktop\aosOlhos-claude` → worktree da branch `claude/galerias-avancadas` (**trabalhe aqui**).
- `C:\Users\conta\Desktop\aosOlhos` → pasta original, hoje na branch do GPT. **Não edite arquivos lá.**

Repositório: https://github.com/MiguellArcanjo/AosOlhos (público).

## Stack

- **Next.js 16.3** (App Router, Turbopack, `proxy.ts` no lugar de middleware), **React 19.2**, **TypeScript**, **Tailwind CSS v4**.
- **Appwrite Cloud** via `node-appwrite` 29, só no servidor. API nova de tabelas (`TablesDB`, linhas, colunas). `InputFile` vem de `node-appwrite/file`.
- `lucide-react` (ícones), `jszip` (baixar todas).
- Hospedagem planejada: **Vercel** (ainda não publicado).
- Backup planejado: VM Azure `apart-voz` copia Appwrite → Azure Blob diariamente às 03:00 (tratado em outro chat).

## Rodar

```bash
cd C:\Users\conta\Desktop\aosOlhos-claude
npm install
# .env.local (fora do git): APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY — nunca peça os valores no chat
node --env-file=.env.local scripts/appwrite-check.mjs           # testa a conexão (só leitura)
node --env-file=.env.local scripts/appwrite-setup.mjs           # cria banco, tabelas e bucket (pode rodar de novo)
node --env-file=.env.local scripts/appwrite-fotografa.mjs EMAIL # dá acesso ao painel a uma conta já criada
npx next dev -p 3001
npx tsc --noEmit && npx eslint src && npx next build   # checagens antes de entregar
```

A conta da fotógrafa é criada pelo usuário no console do Appwrite (Auth → Users). Só contas com o rótulo `fotografa` entram no painel.

## Arquitetura Appwrite

- **Banco `aosolhos`**: `galleries` (id = slug do link), `photos` (id = id do arquivo; `kind` = `selecao` | `entrega` | `dia`),
  `clients` (código único por galeria; seleção em JSON), `studio` (linha única `estudio`; logo em data URL).
  Listas e objetos (pastas, favoritas, design, seleção) ficam como JSON em colunas `text`. Esquema em `scripts/appwrite-setup.mjs`.
- **Bucket `fotos`**, privado. Permissões só para `label:fotografa` (reservado para upload direto no futuro).
- **A chave de API só existe no servidor** (`src/lib/appwrite/server.ts`, com `import "server-only"`). Tabelas sem permissão pública.
- Ações do servidor: `src/app/actions/painel.ts` (toda função começa com `requirePhotographer()`), `cliente.ts` (acesso pelo
  cookie `aos-g-<galeria>` = `idCliente.código`, conferido no banco a cada ação), `auth.ts` (sessão em cookie httpOnly `aos-sessao`).
- **Fotos**: `GET /api/fotos/[id]` entrega o arquivo só para a fotógrafa ou para o cliente com código, conforme o momento da
  galeria (`clientCanSee` em `lib/appwrite/queries.ts`); a capa aparece antes do código. `POST /api/fotos` recebe uma foto
  por vez, já reduzida no navegador (1600 px seleção, 2560 px entrega), abaixo do limite de 4,5 MB da Vercel.
- `lib/store.tsx`: mesma interface `useStore()` de antes. Atualiza a tela na hora e grava no servidor (`persist`); se falhar,
  mostra aviso e recarrega. `StoreProvider` fica em `painel/layout.tsx` (modo painel) e `g/[id]/layout.tsx` (modo cliente).
- Regras puras compartilhadas entre navegador e servidor: `lib/gallery-logic.ts`.
- `src/proxy.ts`: sem cookie de sessão, `/painel` redireciona para `/entrar` (a checagem de verdade é no servidor).

## Mapa do código

```
src/
  proxy.ts            Redireciona /painel sem sessão
  lib/
    types.ts          Modelo: Gallery, GalleryClient, Photo, Folder, GalleryDesign, StudioSettings
    store.tsx         StoreProvider + useStore(): toda leitura/escrita das telas passa aqui
    gallery-logic.ts  Regras do fluxo (status derivado, limite do pacote, P&B, comentários) e defaultStudio
    appwrite/         server.ts (clientes, sessão), rows.ts (linha ↔ modelo), queries.ts (consultas e regras de acesso)
    utils.ts          Formatação (datas pt-BR, BRL), status, extras, expiração, filesToPhotos (reduz no navegador)
    design.ts         Temas por galeria (5 paletas, fonte, capa) via variáveis CSS — designStyle()
    watermark.ts      Grava marca d'água nos pixels (canvas) com cache por foto+configuração
  components/         ui, dialog (confirm/prompt próprios), lightbox (com P&B), slideshow, justified-grid,
                      protected-image, gallery-form, dropzone, studio-logo
  app/
    actions/          painel.ts, cliente.ts, auth.ts (Server Functions)
    api/fotos/        Upload (POST) e entrega das fotos (GET [id])
    entrar/           Login
    painel/           Área da fotógrafa: lista com pastas, estudio/, galerias/nova, galerias/[id] (abas)
    g/[id]/           Área do cliente: access-gate → client-selection → client-done → client-delivery
```

### Modelo de dados (resumo)

- `Gallery.status`: `rascunho` → `selecao` → `finalizada` → `entregue`. `finalizada` é **derivado** de todos os `clients` terem `finalizedAt` (`derivedStatus`; no servidor, `refreshStatus`).
- `Gallery.clients[]`: cada cliente tem `accessCode` (6 dígitos, único na galeria) e a própria `selection { photoIds, comments, bwIds }`.
  Na área do cliente, os outros clientes chegam sem nome, código ou seleção.
- `Photo.folderId` opcional → pastas por momento (`Gallery.folders`).
- `expiresAt` / `archived` bloqueiam o acesso do cliente (no servidor).
- `Gallery.category`: pasta do painel (Formaturas, Aniversários…); vazio = sem pasta.
- `Selection.bwIds`: fotos que o cliente pediu em preto e branco (o botão P&B em si é só prévia, filtro CSS).
- Entrega no dia: `sameDayCount` (0 = desligado), `sameDayPhotos`, `sameDayReleasedAt`. Liberadas, abrem a galeria
  para o cliente mesmo em `rascunho`.

## Armadilhas conhecidas (aprendidas na prática)

- **Não use `prompt()`, `confirm()` nem `alert()`**: o navegador embutido do app do usuário bloqueia. Use `useDialog()`.
- **Conflito de classes no Tailwind**: duas classes da mesma propriedade não se resolvem pela ordem no HTML. Use outra `variant`.
- **Cores precisam funcionar em todos os temas** (inclusive "Noite"): prefira `text-background`/`bg-foreground` a `text-white`.
- Lint do React 19 (`react-hooks/set-state-in-effect`) proíbe `setState` síncrono em `useEffect`: faça o setState no `.then`.
- `components/ui.tsx` é `"use client"`: componentes de servidor não podem chamar `buttonClass()`.
- `createRow<T>` do `node-appwrite` exige todas as colunas no tipo: use o helper `createRow` de `lib/appwrite/queries.ts`.
- Ids do Appwrite têm até 36 caracteres (`galleryIdFor` corta o slug).
- Toda função exportada de arquivo `"use server"` é um endereço público: confira o acesso dentro dela.
- `next dev` lê o `.env.local` ao iniciar: reinicie depois de mudar o arquivo. Ao parar o `npx next dev` em segundo plano,
  o processo do Next pode continuar vivo segurando a porta.
- Imagens usam `<img>` simples, não `next/image`.
- Fim de linha: Git avisa LF→CRLF no Windows; é inofensivo.

## Limitações atuais (honestas)

- Fotos são reduzidas no navegador (1600 px seleção, 2560 px entrega); não há original em alta resolução. Para originais,
  enviar direto do navegador ao Appwrite (o bucket já aceita `label:fotografa`; falta JWT e cadastrar a plataforma Web no console).
- Marca d'água é gravada **no navegador**: a versão sem marca passa pelo aparelho do cliente. Ideal: gerar no servidor.
- Código errado só tem atraso de 0,8 s; não há bloqueio por número de tentativas.
- As fotos passam pelo servidor do Next (`/api/fotos`): conta banda da Vercel e do Appwrite.
- Envio de e-mail não existe: compartilhamento é por link/código (copiar, WhatsApp `wa.me`, `mailto:`).

## Próximos passos (ordem combinada com o usuário)

1. Publicar na **Vercel** (variáveis de ambiente no painel da Vercel, nunca no chat).
2. **E-mails automáticos** (link, lembrete de prazo, seleção finalizada, fotos prontas). Provedor **não decidido** (Resend recomendado; precisa de domínio).
3. **PIX para fotos extras** (QR Code / copia-e-cola com baixa manual; depois Mercado Pago).
4. **Modelos de galeria** (presets: ensaio, casamento, só entrega).
5. Depois, conforme a fotógrafa pedir: originais em alta, marca d'água no servidor, álbum folheável, portfólio público.

Atenção ao custo: armazenamento e banda no Appwrite são o principal gasto ao substituir o Google Fotos; conferir os limites do plano e usar expiração/arquivamento.
