"use client";

import { useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import type { NewGallery } from "@/lib/types";

function inDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const emptyGallery = (): NewGallery => ({
  title: "",
  eventDate: inDays(0),
  clientName: "",
  clientEmail: "",
  includedPhotos: 20,
  allowExtras: true,
  extraPrice: 25,
  deadline: inDays(15),
  message: "",
});

export function GalleryForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: NewGallery;
  submitLabel: string;
  onSubmit: (data: NewGallery) => void;
}) {
  const [data, setData] = useState(initial);
  const change = <K extends keyof NewGallery>(key: K, value: NewGallery[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
      }}
    >
      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Trabalho</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da galeria">
            <input
              required
              className={inputClass}
              placeholder="Ex.: Ensaio pré-wedding"
              value={data.title}
              onChange={(e) => change("title", e.target.value)}
            />
          </Field>
          <Field label="Data do evento">
            <input type="date" className={inputClass} value={data.eventDate} onChange={(e) => change("eventDate", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Cliente</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <input
              required
              className={inputClass}
              placeholder="Ex.: Ana e Pedro"
              value={data.clientName}
              onChange={(e) => change("clientName", e.target.value)}
            />
          </Field>
          <Field label="E-mail" hint="Usado para enviar o link e os lembretes (em breve).">
            <input
              type="email"
              className={inputClass}
              placeholder="cliente@exemplo.com"
              value={data.clientEmail}
              onChange={(e) => change("clientEmail", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Mensagem de boas-vindas" hint="Aparece para o cliente ao abrir a galeria.">
          <textarea
            rows={3}
            className={inputClass}
            placeholder="Escreva um recado carinhoso…"
            value={data.message}
            onChange={(e) => change("message", e.target.value)}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Seleção</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fotos inclusas no pacote">
            <input
              type="number"
              min={1}
              required
              className={inputClass}
              value={data.includedPhotos}
              onChange={(e) => change("includedPhotos", Number(e.target.value))}
            />
          </Field>
          <Field label="Prazo para seleção">
            <input type="date" className={inputClass} value={data.deadline} onChange={(e) => change("deadline", e.target.value)} />
          </Field>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--accent)]"
            checked={data.allowExtras}
            onChange={(e) => change("allowExtras", e.target.checked)}
          />
          Permitir que o cliente escolha fotos extras
        </label>
        {data.allowExtras && (
          <div className="sm:w-1/2">
            <Field label="Valor por foto extra (R$)">
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={data.extraPrice}
                onChange={(e) => change("extraPrice", Number(e.target.value))}
              />
            </Field>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
