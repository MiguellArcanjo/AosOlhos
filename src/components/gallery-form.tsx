"use client";

import { useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { coverLabels, defaultDesign, fontLabels, themes } from "@/lib/design";
import type { ColorTheme, CoverLayout, FontStyle, GalleryFields, NewGallery } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  expiresAt: inDays(90),
  message: "",
  design: defaultDesign(),
  watermark: true,
  allowShare: true,
});

export function GalleryForm<T extends GalleryFields & { clientEmail?: string }>({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: T;
  submitLabel: string;
  onSubmit: (data: T) => void;
}) {
  const [data, setData] = useState(initial);
  const creating = initial.clientEmail !== undefined;
  const change = <K extends keyof T>(key: K, value: T[K]) => setData((d) => ({ ...d, [key]: value }));
  const changeDesign = (patch: Partial<GalleryFields["design"]>) => setData((d) => ({ ...d, design: { ...d.design, ...patch } }));

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
          <Field label={creating ? "Nome" : "Nome na capa"} hint={creating ? undefined : "Os clientes com acesso ficam na aba Clientes."}>
            <input
              required
              className={inputClass}
              placeholder="Ex.: Ana e Pedro"
              value={data.clientName}
              onChange={(e) => change("clientName", e.target.value)}
            />
          </Field>
          {creating && (
            <Field label="E-mail" hint="Dá para adicionar mais clientes depois (ex.: formatura).">
              <input
                type="email"
                className={inputClass}
                placeholder="cliente@exemplo.com"
                value={data.clientEmail}
                onChange={(e) => change("clientEmail", e.target.value as T["clientEmail"])}
              />
            </Field>
          )}
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
          <Field label="Fotos inclusas no pacote" hint="Por cliente.">
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
        <Toggle checked={data.allowExtras} onChange={(v) => change("allowExtras", v)}>
          Permitir que o cliente escolha fotos extras
        </Toggle>
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

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Aparência</h2>
        <div>
          <p className="mb-2 text-sm font-medium">Cores</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(themes) as ColorTheme[]).map((t) => {
              const p = themes[t].palette;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => changeDesign({ theme: t })}
                  className={cn(
                    "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm transition",
                    data.design.theme === t ? "border-foreground ring-2 ring-accent/20" : "border-line",
                  )}
                >
                  <span className="flex h-6 w-6 overflow-hidden rounded-full border border-line">
                    <span className="w-1/2" style={{ background: p.background }} />
                    <span className="w-1/2" style={{ background: p.accent }} />
                  </span>
                  {themes[t].label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fonte dos títulos">
            <select className={inputClass} value={data.design.font} onChange={(e) => changeDesign({ font: e.target.value as FontStyle })}>
              {(Object.keys(fontLabels) as FontStyle[]).map((f) => (
                <option key={f} value={f}>
                  {fontLabels[f]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Capa">
            <select className={inputClass} value={data.design.cover} onChange={(e) => changeDesign({ cover: e.target.value as CoverLayout })}>
              {(Object.keys(coverLabels) as CoverLayout[]).map((c) => (
                <option key={c} value={c}>
                  {coverLabels[c]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Proteção e acesso</h2>
        <Toggle checked={data.watermark} onChange={(v) => change("watermark", v)}>
          Gravar marca d&apos;água nas fotos de seleção
        </Toggle>
        <Toggle checked={data.allowShare} onChange={(v) => change("allowShare", v)}>
          Permitir que o cliente compartilhe as fotos entregues (WhatsApp, Instagram…)
        </Toggle>
        <div className="sm:w-1/2">
          <Field label="Galeria disponível até" hint="Depois disso o cliente não acessa mais. Deixe vazio para não expirar.">
            <input
              type="date"
              className={inputClass}
              value={data.expiresAt ?? ""}
              onChange={(e) => change("expiresAt", e.target.value || undefined)}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}
