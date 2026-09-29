"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Logo, Spinner } from "@/components/ui";
import { useStore } from "@/lib/store";
import { AccessGate } from "./access-gate";
import { ClientSelection } from "./client-selection";
import { ClientDone } from "./client-done";
import { ClientDelivery } from "./client-delivery";

const accessKey = (id: string) => `aos-olhos:acesso:${id}`;

function hasAccess(id: string) {
  try {
    return typeof window !== "undefined" && sessionStorage.getItem(accessKey(id)) === "1";
  } catch {
    return false;
  }
}

export default function ClientGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, getGallery } = useStore();
  const gallery = getGallery(id);
  // O servidor sempre mostra o carregamento (store ainda não pronta), então ler aqui não causa divergência.
  const [unlocked, setUnlocked] = useState(() => hasAccess(id));

  if (!ready) return <Spinner />;

  if (!gallery || gallery.status === "rascunho") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Logo />
        <p className="text-muted">Esta galeria ainda não está disponível.</p>
      </main>
    );
  }

  if (!unlocked) {
    return (
      <AccessGate
        gallery={gallery}
        onUnlock={() => {
          try {
            sessionStorage.setItem(accessKey(id), "1");
          } catch {}
          setUnlocked(true);
        }}
      />
    );
  }

  if (gallery.status === "selecao") return <ClientSelection gallery={gallery} />;
  if (gallery.status === "finalizada") return <ClientDone gallery={gallery} />;
  return <ClientDelivery gallery={gallery} />;
}
