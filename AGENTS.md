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
- **Nunca usar fotos reais de clientes** em testes/demos. Use `picsum.photos` (já é o padrão do mock).
- **Commit e push só quando o usuário pedir.** Mensagem de commit em português.
- Pedir autorização antes de alterar qualquer recurso do Azure/VM (há um chat separado para infraestrutura).
- **Ignore a branch `codex/redesign-galerias`** (trabalho de outro agente, GPT/Codex). Não considere, não junte, não resolva conflitos com ela, a menos que o usuário peça.

## Estado atual (02/10/2026)

**Fase 1: só visual.** Não há backend: os dados ficam no navegador (IndexedDB). Login é de mentira.

| Branch | Conteúdo | Onde |
| --- | --- | --- |
| `main` | Primeira versão visual | GitHub `MiguellArcanjo/AosOlhos` |
| `claude/galerias-avancadas` | `main` + pastas, vários clientes, aparência por galeria, Estúdio, marca d'água gravada, slideshow, compartilhar, expiração/arquivamento, diálogos próprios | GitHub (enviada), **ainda não juntada na `main`** |

Pastas no computador do usuário (Windows):
- `C:\Users\conta\Desktop\aosOlhos-claude` → worktree da branch `claude/galerias-avancadas` (**trabalhe aqui**).
- `C:\Users\conta\Desktop\aosOlhos` → pasta original, hoje em uso pela branch do GPT. **Não edite arquivos lá.**

Repositório: https://github.com/MiguellArcanjo/AosOlhos (público).

## Stack

- **Next.js 16.3** (App Router, Turbopack), **React 19.2**, **TypeScript**, **Tailwind CSS v4** (`@theme inline` em `globals.css`).
- `lucide-react` (ícones), `idb-keyval` (IndexedDB), `jszip` (baixar todas).
- Hospedagem planejada: **Vercel** (ainda não publicado). Backend planejado: **Appwrite Cloud** (projeto ainda não existe).
- Backup planejado: VM Azure `apart-voz` copia Appwrite → Azure Blob diariamente às 03:00 (tratado em outro chat; não faz parte deste repo).

## Rodar

```bash
cd C:\Users\conta\Desktop\aosOlhos-claude
npm install
npx next dev -p 3001      # 3001 para não colidir com a pasta original na 3000
npx tsc --noEmit && npx eslint src && npx next build   # checagens antes de entregar
```

Cada porta/origem tem seu próprio IndexedDB. O botão ↺ (Restaurar demonstração) no painel recria os dados de exemplo.

## Mapa do código

```
src/
  lib/
    types.ts        Modelo: Gallery, GalleryClient, Photo, Folder, GalleryDesign, StudioSettings
    store.tsx       StoreProvider + useStore(): TODA leitura/escrita passa aqui (IndexedDB, chave "aos-olhos:v2")
    mock-data.ts    Galerias de exemplo (seedGalleries) e defaultStudio
    utils.ts        Formatação (datas pt-BR, BRL), status, extras, expiração, filesToPhotos (reduz no navegador)
    design.ts       Temas por galeria (5 paletas, fonte, capa) via variáveis CSS — designStyle()
    watermark.ts    Grava marca d'água nos pixels (canvas) com cache por foto+configuração
  components/
    ui.tsx          Button/buttonClass, Modal, Field, inputClass, StatusBadge, Logo, Spinner
    dialog.tsx      useDialog(): confirm/prompt próprios (os nativos são bloqueados no navegador do app)
    lightbox.tsx    Visualizador tela cheia (teclado, swipe, renderImage, actions, footer)
    slideshow.tsx   Apresentação automática
    justified-grid.tsx  Grade estilo Google Fotos (mantém a ordem esquerda→direita)
    protected-image.tsx Foto com marca d'água gravada (nunca mostra a original)
    gallery-form.tsx    Formulário de galeria (criar e editar)
    dropzone.tsx, studio-logo.tsx
  app/
    entrar/                 Login (visual)
    painel/                 Área da fotógrafa (layout + painel-nav)
      page.tsx              Lista de galerias, filtros (incl. Arquivadas), busca
      estudio/              Nome, logo, marca d'água com prévia
      galerias/nova/        Criar galeria
      galerias/[id]/        Abas: Fotos (pastas) · Clientes · Seleção (por cliente/Todos) · Entrega · Configurações; share-modal
    g/[id]/                 Área do cliente: access-gate → client-selection → client-done → client-delivery
```

### Modelo de dados (resumo)

- `Gallery.status`: `rascunho` → `selecao` → `finalizada` → `entregue`. `finalizada` é **derivado**: vira automaticamente quando **todos** os `clients` têm `finalizedAt` (ver `withDerivedStatus` em `store.tsx`).
- `Gallery.clients[]`: cada cliente tem `accessCode` (6 dígitos, único na galeria) e a própria `selection { photoIds, comments }`. O código digitado no acesso identifica o cliente (id salvo em `sessionStorage`).
- `Photo.folderId` opcional → pastas por momento (`Gallery.folders`).
- `expiresAt` / `archived` bloqueiam o acesso do cliente.
- `StudioSettings` (global): nome, logo (data URL), configuração da marca d'água.
- `Gallery.category`: pasta do painel (Formaturas, Aniversários…); vazio = sem pasta. `renameCategory` renomeia em todas.
- `Selection.bwIds`: fotos escolhidas que o cliente pediu em preto e branco (o botão P&B em si é só prévia, filtro CSS).
- Entrega no dia: `sameDayCount` (0 = desligado), `sameDayPhotos`, `sameDayReleasedAt`. Liberadas, abrem a galeria
  para o cliente mesmo em `rascunho` (ver `g/[id]/page.tsx`).
- `normalize()` em `store.tsx` completa campos novos em dados salvos por versões antigas.

### Códigos de demonstração

| Galeria | Situação | Código |
| --- | --- | --- |
| Ana e Pedro | seleção em andamento, 1 pedido P&B | `482913` |
| Theo (Aniversários) | fotos do dia liberadas + seleção | `550918` |
| Formatura 3º ano B | 3 clientes, pastas, tema Noite | Lucas `250311` (finalizou), Beatriz `250312`, Gabriel `250313` |
| Júlia e Rafael | seleção recebida, pastas | `730155` |
| Família Souza | entregue | `115820` |
| Helena | arquivada/expirada | `661204` (bloqueada) |

## Armadilhas conhecidas (aprendidas na prática)

- **Não use `prompt()`, `confirm()` nem `alert()`**: o navegador embutido do app do usuário bloqueia (dá erro "prompt() is not supported"). Use `useDialog()` de `components/dialog.tsx` ou um aviso na tela.
- **Conflito de classes no Tailwind**: duas classes da mesma propriedade (ex.: `bg-foreground` vir do `buttonClass` e `bg-white` passado em `className`) não se resolvem pela ordem no HTML. Já causou botão branco em fundo branco. Use outra `variant` em vez de sobrescrever cor.
- **Cores precisam funcionar em todos os temas** (inclusive o escuro "Noite"): prefira `text-background`/`bg-foreground` a `text-white`. O botão `primary` já é `bg-foreground text-background`.
- Lint do React 19 (`react-hooks/set-state-in-effect`) proíbe `setState` síncrono dentro de `useEffect`. Use estado inicial preguiçoso (`useState(() => ...)`) ou setState em callback assíncrono.
- Componentes de página são `"use client"` e leem a store; o servidor renderiza só o `Spinner` até `ready`, por isso ler `sessionStorage` em `useState(() => ...)` não gera divergência de hidratação.
- `params` de rota dinâmica: nas páginas client usamos `useParams()`. Tipos globais `PageProps`/`LayoutProps` são gerados por `next typegen`/`next dev`.
- Imagens usam `<img>` simples (com `eslint-disable-next-line @next/next/no-img-element`), não `next/image`, porque as fotos são data URLs/blob URLs.
- Fim de linha: Git avisa LF→CRLF no Windows; é inofensivo.

## Limitações atuais (honestas)

- Dados só no navegador de quem usa: o link **não funciona em outro aparelho** até existir backend.
- Fotos enviadas são reduzidas para 1600 px no navegador (sem original em alta).
- Marca d'água é gravada **no navegador**: impede tirá-la pela página, mas a original ainda passa pelo aparelho do cliente. No backend, gerar a versão marcada no servidor.
- Envio de e-mail não existe: compartilhamento é por link/código (copiar, WhatsApp `wa.me`, `mailto:`).
- Domínio próprio (ex.: `fotos.aosolhos.com.br`) depende só de registrar e configurar na Vercel.

## Próximos passos (ordem combinada com o usuário)

1. **Appwrite**: login real da fotógrafa, banco, bucket com originais + miniaturas, acesso do cliente validado no servidor (código de acesso), marca d'água gerada no servidor. Trocar a implementação de `lib/store.tsx` mantendo a mesma interface de ações. A chave de API fica só em `.env.local`/Vercel, nunca no chat.
2. **E-mails automáticos** (link, lembrete de prazo, aviso de seleção finalizada, fotos prontas). Provedor ainda **não decidido** (Resend recomendado; precisa de domínio).
3. **PIX para fotos extras** (QR Code / copia-e-cola com baixa manual; depois Mercado Pago).
4. **Modelos de galeria** (presets: ensaio, casamento, só entrega).
5. Depois, conforme a fotógrafa pedir: aprovação de álbum folheável, cadastro de clientes, portfólio público, reconhecimento facial, venda de impressões.

Atenção ao custo: armazenamento no Appwrite é o principal gasto ao substituir o Google Fotos; conferir limites do plano antes e usar expiração/arquivamento.
