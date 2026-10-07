"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui";
import { StudioLogo } from "@/components/studio-logo";
import { designStyle } from "@/lib/design";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { AccessGate } from "./access-gate";
import { ClientSelection } from "./client-selection";
import { ClientDone } from "./client-done";
import { ClientDelivery } from "./client-delivery";

export default function ClientGalleryPage() {
  const { id } = useParams<{ id: string }>();
  // O servidor só devolve a galeria se ela estiver aberta, e só os dados do cliente que digitou o código.
  const { ready, getGallery, studio, clientId, closed, unlock } = useStore();
  const gallery = getGallery(id);
  const [viewSameDay, setViewSameDay] = useState(false);

  if (!ready) return <Spinner />;

  // Fotos do dia liberadas abrem a galeria mesmo antes de ela ir para seleção.
  const sameDay = !!gallery?.sameDayReleasedAt && gallery.sameDayPhotos.length > 0;

  if (!gallery || closed) {
    const expired = gallery && closed === "expirada";
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <StudioLogo />
        <p className="max-w-sm text-muted">
          {expired
            ? `Esta galeria ficou disponível até ${formatDate(gallery.expiresAt ?? gallery.deliveredAt)}. Para acessar de novo, fale com ${studio.name}.`
            : "Esta galeria ainda não está disponível."}
        </p>
      </main>
    );
  }

  const client = gallery.clients.find((c) => c.id === clientId);

  const content = !client ? (
    <AccessGate gallery={gallery} onUnlock={unlock} />
  ) : gallery.status === "entregue" ? (
    <ClientDelivery gallery={gallery} />
  ) : gallery.status === "rascunho" || viewSameDay ? (
    <ClientDelivery
      gallery={gallery}
      sameDay
      onBack={gallery.status === "rascunho" ? undefined : () => setViewSameDay(false)}
    />
  ) : gallery.status === "selecao" && !client.finalizedAt ? (
    <ClientSelection gallery={gallery} client={client} onSameDay={sameDay ? () => setViewSameDay(true) : undefined} />
  ) : (
    <ClientDone gallery={gallery} client={client} onSameDay={sameDay ? () => setViewSameDay(true) : undefined} />
  );

  return (
    <div className="flex flex-1 flex-col" style={designStyle(gallery.design)}>
      {content}
    </div>
  );
}
