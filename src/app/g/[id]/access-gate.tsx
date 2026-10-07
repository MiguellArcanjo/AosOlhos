"use client";

import { useState } from "react";
import { Button, inputClass } from "@/components/ui";
import { StudioLogo } from "@/components/studio-logo";
import type { Gallery } from "@/lib/types";
import { cn, coverOf, formatDate } from "@/lib/utils";

export function AccessGate({ gallery, onUnlock }: { gallery: Gallery; onUnlock: (code: string) => Promise<boolean> }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const cover = coverOf(gallery);
  const layout = gallery.design.cover;

  const form = (
    <form
      className="w-full max-w-sm space-y-6 text-center"
      onSubmit={async (e) => {
        e.preventDefault();
        // Cada cliente tem seu código: é ele que identifica de quem é a seleção. Quem confere é o servidor.
        setChecking(true);
        const ok = await onUnlock(code.trim());
        setChecking(false);
        if (!ok) setError(true);
      }}
    >
      <StudioLogo className="text-xl text-muted" imageClassName="mx-auto h-10" />
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
      <Button type="submit" className="w-full" disabled={checking || code.length !== 6}>
        {checking ? "Conferindo…" : "Ver minhas fotos"}
      </Button>
    </form>
  );

  if (layout === "lateral") {
    return (
      <main className="grid flex-1 md:grid-cols-[1.2fr_1fr]">
        <div className="relative min-h-56 md:min-h-0">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
        <div className="flex items-center justify-center px-6 py-12">{form}</div>
      </main>
    );
  }

  if (layout === "minimal") {
    return <main className="flex flex-1 items-center justify-center px-6 py-16">{form}</main>;
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover.src} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]" />
      )}
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative flex w-full max-w-sm justify-center rounded-3xl bg-surface/95 p-8 shadow-2xl backdrop-blur">{form}</div>
    </main>
  );
}
