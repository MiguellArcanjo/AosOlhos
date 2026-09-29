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
| `/painel/galerias/nova` | Fotógrafa | Criar galeria (cliente, pacote, extras, prazo) |
| `/painel/galerias/[id]` | Fotógrafa | Fotos, seleção do cliente, entrega, configurações, enviar link |
| `/g/[id]` | Cliente | Código de acesso → seleção → confirmação → download das fotos finais |

Códigos das galerias de exemplo: Ana e Pedro `482913`, Júlia e Rafael `730155`, Família Souza `115820`.

## Próximos passos

- Appwrite: login, banco, bucket das fotos, acesso do cliente pelo servidor
- Envio automático de e-mail (link, lembretes de prazo, aviso de seleção finalizada)
- Backup diário para o Azure
