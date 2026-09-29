# Aos Olhos

Sistema de seleção e entrega de fotos (inspirado no Selpics). Next.js 16, hospedagem na Vercel.

## Fase atual: só visual

Os dados ficam no navegador (IndexedDB) em [`src/lib/store.tsx`](src/lib/store.tsx), com galerias de exemplo
(fotos do picsum.photos, nunca fotos reais de clientes). O botão ↺ no painel restaura os dados de exemplo.
Depois, a mesma camada passa a usar o Appwrite.

```bash
npm install
npm run dev
```

## Telas

| Rota | Quem usa | O que faz |
| --- | --- | --- |
| `/entrar` | Fotógrafa | Login (visual) |
| `/painel` | Fotógrafa | Lista de galerias com status e progresso |
| `/painel/galerias/nova` | Fotógrafa | Criar galeria (cliente, pacote, extras, prazo, aparência, expiração) |
| `/painel/galerias/[id]` | Fotógrafa | Fotos e pastas, clientes, seleção por cliente, entrega, configurações/arquivar |
| `/painel/estudio` | Fotógrafa | Nome, logo e marca d'água (texto ou logo, posição, transparência) |
| `/g/[id]` | Cliente | Código de acesso → seleção (com pastas) → confirmação → download, slideshow, compartilhar |

Códigos das galerias de exemplo:

| Galeria | Situação | Código(s) |
| --- | --- | --- |
| Ana e Pedro | seleção em andamento | `482913` |
| Formatura 3º ano B | 3 clientes, com pastas | Lucas `250311` (finalizou), Beatriz `250312`, Gabriel `250313` |
| Júlia e Rafael | seleção recebida, com pastas | `730155` |
| Família Souza | entregue | `115820` |
| Helena | arquivada/expirada | `661204` (acesso bloqueado) |

## Marca d'água

Gravada nos pixels ([`src/lib/watermark.ts`](src/lib/watermark.ts)) — a tela de seleção nunca recebe a foto
original. Hoje o desenho roda no navegador; com o Appwrite ele vai para o servidor, e o original deixa de sair de lá.

## Próximos passos

- Appwrite: login, banco, bucket das fotos, acesso do cliente pelo servidor
- Envio automático de e-mail (link, lembretes de prazo, aviso de seleção finalizada)
- Backup diário para o Azure
