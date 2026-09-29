"use client";

import { useDialog } from "@/components/dialog";
import { Gift, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { Dropzone } from "@/components/dropzone";
import { useStore } from "@/lib/store";
import type { Gallery } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function DeliveryTab({ gallery, onShare }: { gallery: Gallery; onShare: () => void }) {
  const { addDeliveryPhotos, removeDeliveryPhoto, deliver } = useStore();
  const delivered = gallery.status === "entregue";
  const [dialog, dialogElement] = useDialog();

  return (
    <div className="space-y-6">
      {dialogElement}
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
            <Button variant="secondary" onClick={onShare}>
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
