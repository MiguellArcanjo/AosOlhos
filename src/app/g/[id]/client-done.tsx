"use client";

import { CheckCircle2 } from "lucide-react";
import { ProtectedImage } from "@/components/protected-image";
import { StudioLogo } from "@/components/studio-logo";
import type { Gallery, GalleryClient } from "@/lib/types";
import { extrasOf, formatDate, formatMoney } from "@/lib/utils";

export function ClientDone({ gallery, client }: { gallery: Gallery; client: GalleryClient }) {
  const selected = gallery.photos.filter((p) => client.selection.photoIds.includes(p.id));
  const extras = extrasOf(gallery, client);

  return (
    <main className="protected mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6" onContextMenu={(e) => e.preventDefault()}>
      <div className="mx-auto max-w-md space-y-4 text-center">
        <StudioLogo className="text-sm text-muted" imageClassName="mx-auto" />
        <CheckCircle2 size={48} className="mx-auto text-success" strokeWidth={1.5} />
        <h1 className="font-serif text-4xl">Seleção enviada!</h1>
        <p className="text-muted">
          Obrigada, {client.name}! Recebemos suas {selected.length} fotos em {formatDate(client.finalizedAt)}. Agora é com a
          gente: você será avisado quando as fotos editadas estiverem prontas.
        </p>
        {extras > 0 && (
          <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm">
            {extras} foto{extras > 1 ? "s" : ""} extra{extras > 1 ? "s" : ""} · {formatMoney(extras * gallery.extraPrice)}
          </p>
        )}
      </div>

      <div className="mt-12 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {selected.map((p) => (
          <div key={p.id} className="aspect-square overflow-hidden rounded-lg bg-accent-soft">
            <ProtectedImage photo={p} enabled={gallery.watermark} loading="lazy" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </main>
  );
}
