"use client";

import { useState } from "react";
import { Button, Logo, inputClass } from "@/components/ui";
import type { Gallery } from "@/lib/types";
import { cn, coverOf, formatDate } from "@/lib/utils";

export function AccessGate({ gallery, onUnlock }: { gallery: Gallery; onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const cover = coverOf(gallery);

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover.src} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]" />
      )}
      <div className="absolute inset-0 bg-black/45" />

      <form
        className="relative w-full max-w-sm space-y-6 rounded-3xl bg-surface/95 p-8 text-center shadow-2xl backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim() === gallery.accessCode) onUnlock();
          else setError(true);
        }}
      >
        <Logo className="text-xl text-muted" />
        <div>
          <h1 className="font-serif text-4xl leading-tight">{gallery.clientName}</h1>
          <p className="mt-1 text-sm text-muted">
            {gallery.title} · {formatDate(gallery.eventDate)}
          </p>
        </div>
        <div className="space-y-2">
          <input
            inputMode="numeric"
            autoFocus
            maxLength={6}
            placeholder="Código de acesso"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setError(false);
            }}
            className={cn(inputClass, "text-center font-mono text-lg tracking-[0.4em]", error && "border-danger")}
          />
          {error && <p className="text-sm text-danger">Código incorreto. Confira a mensagem que você recebeu.</p>}
        </div>
        <Button type="submit" className="w-full">
          Ver minhas fotos
        </Button>
      </form>
    </main>
  );
}
