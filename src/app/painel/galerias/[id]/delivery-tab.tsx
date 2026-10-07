"use client";

import { useDialog } from "@/components/dialog";
import { useState } from "react";
import { Gift, Sun, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { Dropzone } from "@/components/dropzone";
import { useStore } from "@/lib/store";
import type { Gallery, Photo } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function DeliveryTab({
  gallery,
  onShare,
}: {
  gallery: Gallery;
  onShare: (opts?: { sameDay?: boolean }) => void;
}) {
  const { addDeliveryPhotos, removeDeliveryPhoto, deliver } = useStore();
  const delivered = gallery.status === "entregue";
  const [dialog, dialogElement] = useDialog();

  return (
    <div className="space-y-6">
      {dialogElement}
      {gallery.sameDayCount > 0 && !delivered && <SameDayCard gallery={gallery} onShare={() => onShare({ sameDay: true })} />}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl">Fotos finais</h2>
            <p className="text-sm text-muted">
              {delivered
                ? `Entregue em ${formatDate(gallery.deliveredAt)} · o cliente pode baixar as ${gallery.deliveryPhotos.length} fotos.`
                : "Envie as fotos editadas. Quando terminar, libere para o cliente baixar."}
            </p>
          </div>
          {delivered ? (
            <Button variant="secondary" onClick={() => onShare()}>
              Compartilhar link
            </Button>
          ) : (
            <Button
              disabled={gallery.deliveryPhotos.length === 0}
              onClick={async () => {
                const ok = await dialog.confirm({
                  title: `Liberar ${gallery.deliveryPhotos.length} fotos?`,
                  message: `${gallery.clientName} poderá baixar as fotos finais.`,
                  confirmLabel: "Liberar entrega",
                });
                if (ok) {
                  deliver(gallery.id);
                  onShare();
                }
              }}
            >
              <Gift size={16} /> Liberar entrega
            </Button>
          )}
        </div>
      </div>

      <Dropzone
        compact={gallery.deliveryPhotos.length > 0}
        label="Arraste aqui as fotos editadas"
        onPhotos={(photos) => addDeliveryPhotos(gallery.id, photos)}
      />

      {gallery.deliveryPhotos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {gallery.deliveryPhotos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-accent-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
              <button
                type="button"
                title="Remover"
                onClick={() => removeDeliveryPhoto(gallery.id, p.id)}
                className="absolute right-2 top-2 rounded-full bg-white/85 p-1.5 opacity-0 shadow transition hover:bg-white group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Algumas fotos editadas liberadas no mesmo dia do evento, antes da seleção. */
function SameDayCard({ gallery, onShare }: { gallery: Gallery; onShare: () => void }) {
  const { addSameDayPhotos, removeSameDayPhoto, releaseSameDay } = useStore();
  const [dialog, dialogElement] = useDialog();
  const [notice, setNotice] = useState<string | null>(null);
  const photos = gallery.sameDayPhotos;
  const remaining = gallery.sameDayCount - photos.length;
  const released = !!gallery.sameDayReleasedAt;

  function add(list: Photo[]) {
    if (list.length > remaining) {
      setNotice(`Cabem só mais ${remaining}; ${list.length - remaining} ficaram de fora. Aumente a quantidade em Configurações se precisar.`);
      setTimeout(() => setNotice(null), 5000);
    }
    addSameDayPhotos(gallery.id, list);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      {dialogElement}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl">
            <Sun size={20} className="text-accent" /> Entrega no dia
          </h2>
          <p className="text-sm text-muted">
            {released
              ? `Liberadas em ${formatDate(gallery.sameDayReleasedAt)} · ${gallery.clientName} já pode ver e baixar ${photos.length} foto${photos.length === 1 ? "" : "s"}.`
              : `Escolha até ${gallery.sameDayCount} fotos editadas para o cliente receber hoje. A seleção completa continua normalmente.`}
          </p>
        </div>
        {released ? (
          <Button variant="secondary" onClick={onShare}>
            Compartilhar link
          </Button>
        ) : (
          <Button
            disabled={photos.length === 0}
            onClick={async () => {
              const ok = await dialog.confirm({
                title: `Liberar ${photos.length} foto${photos.length === 1 ? "" : "s"} do dia?`,
                message: `${gallery.clientName} poderá ver e baixar estas fotos pelo link da galeria.`,
                confirmLabel: "Liberar",
              });
              if (ok) {
                releaseSameDay(gallery.id);
                onShare();
              }
            }}
          >
            <Gift size={16} /> Liberar fotos do dia
          </Button>
        )}
      </div>

      <p className="text-sm">
        <strong>{photos.length}</strong> de {gallery.sameDayCount} fotos
      </p>

      {remaining > 0 && (
        <Dropzone compact label={`Arraste até ${remaining} foto${remaining === 1 ? "" : "s"} do dia`} onPhotos={add} />
      )}
      {notice && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{notice}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg bg-accent-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
              <button
                type="button"
                title="Remover"
                aria-label={`Remover ${p.name}`}
                onClick={() => removeSameDayPhoto(gallery.id, p.id)}
                className="absolute right-1.5 top-1.5 rounded-full bg-white/85 p-1.5 opacity-0 shadow transition hover:bg-white group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
