"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Archive, ArrowLeft, ExternalLink, Send } from "lucide-react";
import { Button, Spinner, StatusBadge, buttonClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn, expiryLabel, formatDate } from "@/lib/utils";
import { PhotosTab } from "./photos-tab";
import { ClientsTab } from "./clients-tab";
import { SelectionTab } from "./selection-tab";
import { DeliveryTab } from "./delivery-tab";
import { SettingsTab } from "./settings-tab";
import { ShareModal } from "./share-modal";

const tabs = [
  { id: "fotos", label: "Fotos" },
  { id: "clientes", label: "Clientes" },
  { id: "selecao", label: "Seleção" },
  { id: "entrega", label: "Entrega" },
  { id: "config", label: "Configurações" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function GaleriaPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, getGallery } = useStore();
  const gallery = getGallery(id);
  const [tab, setTab] = useState<TabId | null>(null);
  const [sharing, setSharing] = useState<{ clientId?: string } | null>(null);

  if (!ready) return <Spinner />;
  if (!gallery) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted">Galeria não encontrada.</p>
        <Link href="/painel" className="mt-4 inline-block text-accent-strong underline">
          Voltar ao painel
        </Link>
      </div>
    );
  }

  // Abre direto na aba que faz sentido para o momento da galeria.
  const current: TabId =
    tab ?? (gallery.status === "finalizada" ? "selecao" : gallery.status === "entregue" ? "entrega" : "fotos");
  const selectedTotal = gallery.clients.reduce((n, c) => n + c.selection.photoIds.length, 0);
  const expiry = expiryLabel(gallery);

  const badge = (id: TabId) => {
    if (id === "selecao" && selectedTotal > 0) return selectedTotal;
    if (id === "clientes" && gallery.clients.length > 1) return gallery.clients.length;
    return null;
  };

  return (
    <div className="space-y-6">
      <Link href="/painel" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Galerias
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={gallery.status} />
            {gallery.archived && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
                <Archive size={12} /> Arquivada
              </span>
            )}
            {expiry && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs text-danger">{expiry}</span>}
          </div>
          <h1 className="font-serif text-4xl leading-tight">{gallery.clientName}</h1>
          <p className="text-muted">
            {gallery.title} · {formatDate(gallery.eventDate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/g/${gallery.id}`} target="_blank" className={buttonClass("secondary")}>
            <ExternalLink size={16} /> Ver como cliente
          </Link>
          <Button onClick={() => setSharing({})} disabled={gallery.photos.length === 0}>
            <Send size={16} />
            {gallery.status === "rascunho" ? "Enviar para o cliente" : "Compartilhar"}
          </Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition",
              current === t.id ? "border-foreground font-medium" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {t.label}
            {badge(t.id) !== null && <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-xs">{badge(t.id)}</span>}
          </button>
        ))}
      </div>

      {current === "fotos" && <PhotosTab gallery={gallery} />}
      {current === "clientes" && <ClientsTab gallery={gallery} onShare={(clientId) => setSharing({ clientId })} />}
      {current === "selecao" && <SelectionTab gallery={gallery} />}
      {current === "entrega" && <DeliveryTab gallery={gallery} onShare={() => setSharing({})} />}
      {current === "config" && <SettingsTab gallery={gallery} />}

      <ShareModal
        key={sharing?.clientId ?? "todos"}
        gallery={gallery}
        clientId={sharing?.clientId}
        open={sharing !== null}
        onClose={() => setSharing(null)}
      />
    </div>
  );
}
