"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Send } from "lucide-react";
import { Button, Spinner, StatusBadge, buttonClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";
import { PhotosTab } from "./photos-tab";
import { SelectionTab } from "./selection-tab";
import { DeliveryTab } from "./delivery-tab";
import { SettingsTab } from "./settings-tab";
import { ShareModal } from "./share-modal";

const tabs = [
  { id: "fotos", label: "Fotos" },
  { id: "selecao", label: "Seleção do cliente" },
  { id: "entrega", label: "Entrega" },
  { id: "config", label: "Configurações" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function GaleriaPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, getGallery } = useStore();
  const gallery = getGallery(id);
  const [tab, setTab] = useState<TabId | null>(null);
  const [sharing, setSharing] = useState(false);

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

  return (
    <div className="space-y-6">
      <Link href="/painel" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Galerias
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <StatusBadge status={gallery.status} />
          <h1 className="font-serif text-4xl leading-tight">{gallery.clientName}</h1>
          <p className="text-muted">
            {gallery.title} · {formatDate(gallery.eventDate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/g/${gallery.id}`} target="_blank" className={buttonClass("secondary")}>
            <ExternalLink size={16} /> Ver como cliente
          </Link>
          <Button onClick={() => setSharing(true)} disabled={gallery.photos.length === 0}>
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
            {t.id === "selecao" && gallery.selection.photoIds.length > 0 && (
              <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-xs">{gallery.selection.photoIds.length}</span>
            )}
          </button>
        ))}
      </div>

      {current === "fotos" && <PhotosTab gallery={gallery} />}
      {current === "selecao" && <SelectionTab gallery={gallery} />}
      {current === "entrega" && <DeliveryTab gallery={gallery} onShare={() => setSharing(true)} />}
      {current === "config" && <SettingsTab gallery={gallery} />}

      <ShareModal gallery={gallery} open={sharing} onClose={() => setSharing(false)} />
    </div>
  );
}
