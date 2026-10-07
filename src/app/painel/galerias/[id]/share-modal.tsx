"use client";

import { useState } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { Modal, buttonClass, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Gallery, GalleryClient } from "@/lib/types";
import { cn, formatDate, galleryLink } from "@/lib/utils";

function shareText(g: Gallery, c: GalleryClient, studioName: string, sameDay: boolean) {
  const link = galleryLink(g);
  if (sameDay) {
    const next = g.status === "rascunho" ? "As demais fotos chegam em breve" : `No mesmo link você escolhe as ${g.includedPhotos} fotos do pacote`;
    return `Oi, ${c.name}! As primeiras fotos já estão prontas 🎈

Acesse ${link} com o código ${c.accessCode} para ver e baixar.
${next}.

Com carinho, ${studioName}`;
  }
  if (g.status === "entregue") {
    return `Oi, ${c.name}! Suas fotos estão prontas 💛\n\nÉ só acessar ${link} com o código ${c.accessCode} para baixar.\n\nCom carinho, ${studioName}`;
  }
  return `Oi, ${c.name}! Suas fotos já estão disponíveis para seleção 📸\n\nAcesse ${link} e use o código ${c.accessCode}.\nVocê pode escolher ${g.includedPhotos} fotos até ${formatDate(g.deadline)}.\n\nCom carinho, ${studioName}`;
}

export function ShareModal({
  gallery,
  clientId,
  open,
  onClose,
  sameDay = false,
}: {
  gallery: Gallery;
  clientId?: string;
  /** Compartilhar as fotos do dia (não envia a galeria para seleção). */
  sameDay?: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const { sendToClient, studio } = useStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const client = gallery.clients.find((c) => c.id === (chosen ?? clientId)) ?? gallery.clients[0];
  if (!client) return null;

  const text = shareText(gallery, client, studio.name, sameDay);
  const link = galleryLink(gallery);

  // Enquanto o envio de e-mail não existe, compartilhar = marcar como enviada.
  function markSent() {
    if (!sameDay) sendToClient(gallery.id);
  }

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    markSent();
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setChosen(undefined);
        onClose();
      }}
      title={sameDay ? "Enviar fotos do dia" : gallery.status === "entregue" ? "Enviar fotos finais" : "Enviar para seleção"}
    >
      <div className="space-y-5">
        {gallery.clients.length > 1 && (
          <select className={inputClass} value={client.id} onChange={(e) => setChosen(e.target.value)} aria-label="Cliente">
            {gallery.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input readOnly value={link} className={cn(inputClass, "text-muted")} onFocus={(e) => e.target.select()} />
          <button type="button" className={buttonClass("secondary", "px-3")} onClick={() => copy(link, "link")} title="Copiar link">
            {copied === "link" ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3">
          <span className="text-sm text-muted">Código de {client.name.split(" ")[0]}</span>
          <span className="font-mono text-xl tracking-[0.3em]">{client.accessCode}</span>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">Mensagem</p>
          <pre className="max-h-44 overflow-auto whitespace-pre-wrap rounded-xl border border-line p-3 font-sans text-sm text-muted">{text}</pre>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <button type="button" className={buttonClass("secondary")} onClick={() => copy(text, "text")}>
            {copied === "text" ? <Check size={16} /> : <Copy size={16} />} Copiar
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
            onClick={markSent}
            className={buttonClass("secondary")}
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a
            href={`mailto:${client.email}?subject=${encodeURIComponent(`Suas fotos · ${studio.name}`)}&body=${encodeURIComponent(text)}`}
            onClick={markSent}
            className={buttonClass("secondary")}
          >
            <Mail size={16} /> E-mail
          </a>
        </div>
        <p className="text-xs text-muted">Em breve o e-mail será enviado automaticamente pelo sistema.</p>
      </div>
    </Modal>
  );
}
