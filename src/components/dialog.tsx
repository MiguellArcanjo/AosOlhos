"use client";

import { useState } from "react";
import { Button, Modal, inputClass } from "@/components/ui";

// Substitui confirm()/prompt() nativos, que alguns navegadores embutidos (e apps) bloqueiam.

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface PromptOptions {
  title: string;
  label?: string;
  placeholder?: string;
  initial?: string;
  confirmLabel?: string;
}

type Pending =
  | { kind: "confirm"; opts: ConfirmOptions; resolve: (ok: boolean) => void }
  | { kind: "prompt"; opts: PromptOptions; resolve: (value: string | null) => void };

/**
 * Uso: `const [dialog, dialogElement] = useDialog();` — renderize `dialogElement`
 * e chame `await dialog.confirm({...})` ou `await dialog.prompt({...})`.
 */
export function useDialog() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [text, setText] = useState("");

  const dialog = {
    confirm: (opts: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ kind: "confirm", opts, resolve })),
    prompt: (opts: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        setText(opts.initial ?? "");
        setPending({ kind: "prompt", opts, resolve });
      }),
  };

  function close(ok: boolean) {
    if (!pending) return;
    if (pending.kind === "confirm") pending.resolve(ok);
    else pending.resolve(ok && text.trim() ? text.trim() : null);
    setPending(null);
  }

  const element = (
    <Modal open={!!pending} onClose={() => close(false)} title={pending?.opts.title}>
      {pending && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            close(true);
          }}
        >
          {pending.kind === "confirm" && pending.opts.message && <p className="text-sm text-muted">{pending.opts.message}</p>}
          {pending.kind === "prompt" && (
            <label className="block">
              {pending.opts.label && <span className="mb-1.5 block text-sm font-medium">{pending.opts.label}</span>}
              <input autoFocus className={inputClass} placeholder={pending.opts.placeholder} value={text} onChange={(e) => setText(e.target.value)} />
            </label>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={pending.kind === "confirm" && pending.opts.danger ? "danger" : "primary"}
              disabled={pending.kind === "prompt" && !text.trim()}
            >
              {pending.opts.confirmLabel ?? (pending.kind === "prompt" ? "Salvar" : "Confirmar")}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );

  return [dialog, element] as const;
}
