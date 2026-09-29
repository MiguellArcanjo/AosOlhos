"use client";

import { useState } from "react";
import { Check, Copy, Download, MessageSquare, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import { Lightbox } from "@/components/lightbox";
import { useStore } from "@/lib/store";
import type { Gallery } from "@/lib/types";
import { deadlineLabel, extrasOf, fileBaseName, formatDate, formatMoney } from "@/lib/utils";

export function SelectionTab({ gallery }: { gallery: Gallery }) {
  const { reopenSelection } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = gallery.photos.filter((p) => gallery.selection.photoIds.includes(p.id));
  const extras = extrasOf(gallery);
  const comments = gallery.selection.comments;

  if (gallery.status === "rascunho") {
    return <Empty>A galeria ainda não foi enviada para o cliente.</Empty>;
  }

  const names = selected.map((p) => fileBaseName(p.name));

  async function copyNames() {
    // Lista separada por vírgula: cola direto no filtro de texto do Lightroom.
    await navigator.clipboard.writeText(names.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadList() {
    const lines = selected.map((p) => (comments[p.id] ? `${p.name} — ${comments[p.id]}` : p.name));
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `selecao-${gallery.id}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Selecionadas" value={`${selected.length} / ${gallery.includedPhotos}`} />
        <Stat
          label="Extras"
          value={extras > 0 ? `${extras} · ${formatMoney(extras * gallery.extraPrice)}` : "Nenhuma"}
        />
        <Stat
          label={gallery.status === "selecao" ? "Prazo" : "Finalizada em"}
          value={gallery.status === "selecao" ? deadlineLabel(gallery.deadline) : formatDate(gallery.finalizedAt)}
        />
      </div>

      {gallery.status === "selecao" && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          O cliente ainda está escolhendo. Você acompanha aqui em tempo real.
        </p>
      )}

      {selected.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={copyNames}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado!" : "Copiar nomes (Lightroom)"}
            </Button>
            <Button variant="secondary" onClick={downloadList}>
              <Download size={16} /> Baixar lista .txt
            </Button>
            {gallery.status === "finalizada" && (
              <Button
                variant="ghost"
                onClick={() => confirm("Reabrir a seleção para o cliente alterar?") && reopenSelection(gallery.id)}
              >
                <RotateCcw size={16} /> Reabrir seleção
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {selected.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setOpen(i)}
                className="group overflow-hidden rounded-xl border border-line bg-surface text-left"
              >
                <div className="relative aspect-square bg-accent-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                  {comments[p.id] && (
                    <span className="absolute right-2 top-2 rounded-full bg-white p-1.5 shadow">
                      <MessageSquare size={14} className="text-accent-strong" />
                    </span>
                  )}
                </div>
                <div className="p-2 text-xs">
                  <p className="font-medium">{p.name}</p>
                  {comments[p.id] && <p className="mt-0.5 line-clamp-2 text-muted">“{comments[p.id]}”</p>}
                </div>
              </button>
            ))}
          </div>
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
          footer={(p) =>
            comments[p.id] ? (
              <p className="mx-auto max-w-2xl text-center text-sm text-white/80">
                <MessageSquare size={14} className="mr-1 inline" /> {comments[p.id]}
              </p>
            ) : null
          }
        />
      )}
    </div>
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
