"use client";

import { useState } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { Modal, buttonClass, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Gallery } from "@/lib/types";
import { cn, formatDate, galleryLink } from "@/lib/utils";

function shareText(g: Gallery) {
  const link = galleryLink(g);
  if (g.status === "entregue") {
    return `Oi, ${g.clientName}! Suas fotos estão prontas 💛\n\nÉ só acessar ${link} com o código ${g.accessCode} para baixar.\n\nCom carinho, Aos Olhos`;
  }
  return `Oi, ${g.clientName}! Suas fotos já estão disponíveis para seleção 📸\n\nAcesse ${link} e use o código ${g.accessCode}.\nVocê pode escolher ${g.includedPhotos} fotos até ${formatDate(g.deadline)}.\n\nCom carinho, Aos Olhos`;
}

export function ShareModal({ gallery, open, onClose }: { gallery: Gallery; open: boolean; onClose: () => void }) {
  const { sendToClient } = useStore();
  const [copied, setCopied] = useState<string | null>(null);
  const text = shareText(gallery);
  const link = galleryLink(gallery);

  // Enquanto o envio de e-mail não existe, compartilhar = marcar como enviada.
  function markSent() {
    sendToClient(gallery.id);
  }

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    markSent();
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Modal open={open} onClose={onClose} title={gallery.status === "entregue" ? "Enviar fotos finais" : "Enviar para seleção"}>
      <div className="space-y-5">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input readOnly value={link} className={cn(inputClass, "text-muted")} onFocus={(e) => e.target.select()} />
          <button type="button" className={buttonClass("secondary", "px-3")} onClick={() => copy(link, "link")} title="Copiar link">
            {copied === "link" ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3">
          <span className="text-sm text-muted">Código de acesso</span>
          <span className="font-mono text-xl tracking-[0.3em]">{gallery.accessCode}</span>
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
            href={`mailto:${gallery.clientEmail}?subject=${encodeURIComponent("Suas fotos · Aos Olhos")}&body=${encodeURIComponent(text)}`}
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
