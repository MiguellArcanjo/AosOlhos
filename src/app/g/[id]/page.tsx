"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui";
import { StudioLogo } from "@/components/studio-logo";
import { designStyle } from "@/lib/design";
import { useStore } from "@/lib/store";
import { formatDate, isExpired } from "@/lib/utils";
import { AccessGate } from "./access-gate";
import { ClientSelection } from "./client-selection";
import { ClientDone } from "./client-done";
import { ClientDelivery } from "./client-delivery";

const accessKey = (id: string) => `aos-olhos:acesso:${id}`;

/** Id do cliente que já digitou o código nesta aba. */
function savedClient(id: string) {
  try {
    return typeof window === "undefined" ? null : sessionStorage.getItem(accessKey(id));
  } catch {
    return null;
  }
}

export default function ClientGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, getGallery, studio } = useStore();
  const gallery = getGallery(id);
  // O servidor sempre mostra o carregamento (store ainda não pronta), então ler aqui não causa divergência.
  const [clientId, setClientId] = useState(() => savedClient(id));

  if (!ready) return <Spinner />;

  if (!gallery || gallery.status === "rascunho" || gallery.archived || isExpired(gallery)) {
    const expired = gallery && (gallery.archived || isExpired(gallery));
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
    <AccessGate
      gallery={gallery}
      onUnlock={(cid) => {
        try {
          sessionStorage.setItem(accessKey(id), cid);
        } catch {}
        setClientId(cid);
      }}
    />
  ) : gallery.status === "entregue" ? (
    <ClientDelivery gallery={gallery} />
  ) : gallery.status === "selecao" && !client.finalizedAt ? (
    <ClientSelection gallery={gallery} client={client} />
  ) : (
    <ClientDone gallery={gallery} client={client} />
  );

  return (
    <div className="flex flex-1 flex-col" style={designStyle(gallery.design)}>
      {content}
    </div>
  );
}
