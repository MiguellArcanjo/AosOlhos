"use client";

import { useDialog } from "@/components/dialog";
import { useState } from "react";
import { CheckCircle2, Clock, Trash2, UserPlus } from "lucide-react";
import { Button, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Gallery } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function ClientsTab({ gallery, onShare }: { gallery: Gallery; onShare: (clientId: string) => void }) {
  const { addClient, updateClient, removeClient } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dialog, dialogElement] = useDialog();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {dialogElement}
      <p className="text-sm text-muted">
        Cada pessoa recebe um código próprio e faz a sua seleção separada — ideal para formaturas, famílias ou quando
        cada noivo quer escolher as suas. Todos veem as mesmas fotos.
      </p>

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {gallery.clients.map((c) => (
          <div key={c.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
            <input
              className={inputClass}
              value={c.name}
              aria-label="Nome"
              onChange={(e) => updateClient(gallery.id, c.id, { name: e.target.value })}
            />
            <input
              className={inputClass}
              type="email"
              value={c.email}
              placeholder="E-mail"
              aria-label="E-mail"
              onChange={(e) => updateClient(gallery.id, c.id, { email: e.target.value })}
            />
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="font-mono text-sm tracking-[0.2em]" title="Código de acesso">
                {c.accessCode}
              </span>
              <span
                className={cn("flex items-center gap-1 whitespace-nowrap text-xs", c.finalizedAt ? "text-success" : "text-muted")}
                title={c.finalizedAt ? `Finalizou em ${formatDate(c.finalizedAt)}` : "Ainda escolhendo"}
              >
                {c.finalizedAt ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                {c.selection.photoIds.length}
              </span>
              <Button variant="ghost" className="px-3 py-1.5" onClick={() => onShare(c.id)}>
                Enviar
              </Button>
              <button
                type="button"
                title="Remover acesso"
                disabled={gallery.clients.length === 1}
                onClick={async () =>
                  (await dialog.confirm({
                    title: `Remover o acesso de ${c.name}?`,
                    message: "A seleção dessa pessoa será perdida.",
                    confirmLabel: "Remover",
                    danger: true,
                  })) && removeClient(gallery.id, c.id)
                }
                className="rounded-full p-2 text-muted hover:bg-accent-soft disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        className="grid gap-3 rounded-2xl border border-dashed border-line p-4 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addClient(gallery.id, name.trim(), email.trim());
          setName("");
          setEmail("");
        }}
      >
        <input className={inputClass} placeholder="Nome do novo cliente" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} type="email" placeholder="E-mail (opcional)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" variant="secondary" disabled={!name.trim()}>
          <UserPlus size={16} /> Adicionar
        </Button>
      </form>
    </div>
  );
}
