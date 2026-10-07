"use client";

import { useDialog } from "@/components/dialog";
import { useState } from "react";
import { Check, CheckCircle2, Clock, Contrast, Copy, Download, MessageSquare, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import { Lightbox } from "@/components/lightbox";
import { useStore } from "@/lib/store";
import type { Gallery, GalleryClient, Photo } from "@/lib/types";
import { cn, deadlineLabel, extrasOf, fileBaseName, formatDate, formatMoney } from "@/lib/utils";

/** Lista separada por vírgula: cola direto no filtro de texto do Lightroom. */
async function copyNames(photos: Photo[]) {
  await navigator.clipboard.writeText(photos.map((p) => fileBaseName(p.name)).join(", "));
}

function downloadList(photos: Photo[], comments: Record<string, string>, bwIds: string[], filename: string) {
  const lines = photos.map((p) => {
    const name = bwIds.includes(p.id) ? `${p.name} [P&B]` : p.name;
    return comments[p.id] ? `${name} — ${comments[p.id]}` : name;
  });
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function SelectionTab({ gallery }: { gallery: Gallery }) {
  const multi = gallery.clients.length > 1;
  // "todos" mostra a soma das seleções (só aparece com mais de um cliente).
  const [clientId, setClientId] = useState<string>(multi ? "todos" : gallery.clients[0]?.id);

  if (gallery.status === "rascunho") {
    return <Empty>A galeria ainda não foi enviada para o cliente.</Empty>;
  }

  const client = gallery.clients.find((c) => c.id === clientId);

  return (
    <div className="space-y-6">
      {multi && (
        <div className="flex flex-wrap gap-1.5">
          <ClientChip active={clientId === "todos"} onClick={() => setClientId("todos")}>
            Todos
          </ClientChip>
          {gallery.clients.map((c) => (
            <ClientChip key={c.id} active={clientId === c.id} onClick={() => setClientId(c.id)}>
              {c.finalizedAt ? <CheckCircle2 size={14} className="text-success" /> : <Clock size={14} className="opacity-60" />}
              {c.name}
              <span className="text-xs opacity-60">{c.selection.photoIds.length}</span>
            </ClientChip>
          ))}
        </div>
      )}

      {client ? <ClientSelectionView gallery={gallery} client={client} /> : <CombinedView gallery={gallery} />}
    </div>
  );
}

function ClientSelectionView({ gallery, client }: { gallery: Gallery; client: GalleryClient }) {
  const { reopenSelection } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const [grayscale, setGrayscale] = useState(false);
  const [copied, setCopied] = useState<"todas" | "pb" | null>(null);
  const selected = gallery.photos.filter((p) => client.selection.photoIds.includes(p.id));
  const bwIds = client.selection.bwIds;
  const bwPhotos = selected.filter((p) => bwIds.includes(p.id));
  const [dialog, dialogElement] = useDialog();
  const extras = extrasOf(gallery, client);
  const comments = client.selection.comments;

  return (
    <div className="space-y-6">
      {dialogElement}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Selecionadas" value={`${selected.length} / ${gallery.includedPhotos}`} />
        <Stat label="Extras" value={extras > 0 ? `${extras} · ${formatMoney(extras * gallery.extraPrice)}` : "Nenhuma"} />
        <Stat
          label={client.finalizedAt ? "Finalizada em" : "Prazo"}
          value={client.finalizedAt ? formatDate(client.finalizedAt) : deadlineLabel(gallery.deadline)}
        />
      </div>

      {!client.finalizedAt && gallery.status === "selecao" && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {client.name} ainda está escolhendo. Você acompanha aqui em tempo real.
        </p>
      )}

      {selected.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                await copyNames(selected);
                setCopied("todas");
                setTimeout(() => setCopied(null), 2000);
              }}
            >
              {copied === "todas" ? <Check size={16} /> : <Copy size={16} />}
              {copied === "todas" ? "Copiado!" : "Copiar nomes (Lightroom)"}
            </Button>
            {bwPhotos.length > 0 && (
              <Button
                variant="secondary"
                onClick={async () => {
                  await copyNames(bwPhotos);
                  setCopied("pb");
                  setTimeout(() => setCopied(null), 2000);
                }}
              >
                {copied === "pb" ? <Check size={16} /> : <Contrast size={16} />}
                {copied === "pb" ? "Copiado!" : `Copiar as ${bwPhotos.length} em P&B`}
              </Button>
            )}
            <Button variant="secondary" onClick={() => downloadList(selected, comments, bwIds, `selecao-${gallery.id}-${client.id}.txt`)}>
              <Download size={16} /> Baixar lista .txt
            </Button>
            {client.finalizedAt && gallery.status !== "entregue" && (
              <Button
                variant="ghost"
                onClick={async () =>
                  (await dialog.confirm({ title: `Reabrir a seleção para ${client.name} alterar?`, confirmLabel: "Reabrir" })) &&
                  reopenSelection(gallery.id, client.id)
                }
              >
                <RotateCcw size={16} /> Reabrir seleção
              </Button>
            )}
          </div>

          <PhotoGrid photos={selected} comments={comments} bwIds={bwIds} onOpen={setOpen} />
        </>
      ) : (
        <Empty>Nenhuma foto selecionada ainda.</Empty>
      )}

      {open !== null && (
        <Lightbox
          photos={selected}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          grayscale={grayscale}
          onGrayscale={setGrayscale}
          footer={(p) => (
            <div className="mx-auto max-w-2xl space-y-1 text-center text-sm text-white/80">
              {bwIds.includes(p.id) && (
                <p>
                  <Contrast size={14} className="mr-1 inline" /> Pediu em preto e branco
                </p>
              )}
              {comments[p.id] && (
                <p>
                  <MessageSquare size={14} className="mr-1 inline" /> {comments[p.id]}
                </p>
              )}
            </div>
          )}
        />
      )}
    </div>
  );
}

/** Visão somada: quais fotos alguém escolheu e quantas pessoas escolheram cada uma. */
function CombinedView({ gallery }: { gallery: Gallery }) {
  const [copied, setCopied] = useState(false);
  const votes = new Map<string, string[]>();
  for (const c of gallery.clients) for (const id of c.selection.photoIds) votes.set(id, [...(votes.get(id) ?? []), c.name]);
  const bwAsked = new Set(gallery.clients.flatMap((c) => c.selection.bwIds));
  const selected = gallery.photos.filter((p) => votes.has(p.id));
  const done = gallery.clients.filter((c) => c.finalizedAt).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Clientes que finalizaram" value={`${done} / ${gallery.clients.length}`} />
        <Stat label="Fotos para editar" value={String(selected.length)} />
        <Stat label="Prazo" value={deadlineLabel(gallery.deadline)} />
      </div>
      {selected.length > 0 ? (
        <>
          <Button
            variant="secondary"
            onClick={async () => {
              await copyNames(selected);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copiado!" : "Copiar nomes de todas (Lightroom)"}
          </Button>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {selected.map((p) => (
              <div key={p.id} className="relative overflow-hidden rounded-xl border border-line bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.name} loading="lazy" className="aspect-square w-full object-cover" />
                {bwAsked.has(p.id) && <BwBadge />}
                <div className="p-2 text-xs">
                  <p className="font-medium">{p.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-muted" title={votes.get(p.id)!.join(", ")}>
                    {votes.get(p.id)!.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Empty>Nenhum cliente escolheu fotos ainda.</Empty>
      )}
    </div>
  );
}

function PhotoGrid({
  photos,
  comments,
  bwIds,
  onOpen,
}: {
  photos: Photo[];
  comments: Record<string, string>;
  bwIds: string[];
  onOpen: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {photos.map((p, i) => (
        <button key={p.id} type="button" onClick={() => onOpen(i)} className="group overflow-hidden rounded-xl border border-line bg-surface text-left">
          <div className="relative aspect-square bg-accent-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
            {comments[p.id] && (
              <span className="absolute right-2 top-2 rounded-full bg-white p-1.5 shadow">
                <MessageSquare size={14} className="text-accent-strong" />
              </span>
            )}
            {bwIds.includes(p.id) && <BwBadge />}
          </div>
          <div className="p-2 text-xs">
            <p className="font-medium">{p.name}</p>
            {comments[p.id] && <p className="mt-0.5 line-clamp-2 text-muted">“{comments[p.id]}”</p>}
          </div>
        </button>
      ))}
    </div>
  );
}

function BwBadge() {
  return (
    <span className="absolute left-2 top-2 rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-semibold text-white shadow" title="Cliente pediu em preto e branco">
      P&amp;B
    </span>
  );
}

function ClientChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition",
        active ? "bg-foreground text-background" : "border border-line bg-surface hover:bg-accent-soft",
      )}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-lg">{value}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">{children}</div>;
}
