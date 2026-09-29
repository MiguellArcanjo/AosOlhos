"use client";

import { useRef } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { ProtectedImage } from "@/components/protected-image";
import { Button, Field, Spinner, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Photo, StudioSettings, WatermarkPosition } from "@/lib/types";
import { cn } from "@/lib/utils";

const samples: Photo[] = [
  { id: "amostra-1", name: "amostra.jpg", src: "https://picsum.photos/seed/aosolhos-amostra/1200/800", width: 1200, height: 800 },
  { id: "amostra-2", name: "amostra-2.jpg", src: "https://picsum.photos/seed/aosolhos-amostra2/800/1200", width: 800, height: 1200 },
];

const positions: Record<WatermarkPosition, string> = { mosaico: "Mosaico (mais seguro)", centro: "Centro", canto: "Canto" };

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EstudioPage() {
  const { ready, studio, updateStudio } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);

  if (!ready) return <Spinner />;

  const wm = studio.watermark;
  const setWm = (patch: Partial<StudioSettings["watermark"]>) => updateStudio({ watermark: { ...wm, ...patch } });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Estúdio</h1>
        <p className="mt-1 text-muted">Sua marca nas galerias e nas fotos. As alterações são salvas na hora.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-serif text-2xl">Identidade</h2>
            <Field label="Nome do estúdio" hint="Aparece nas galerias e nas mensagens para o cliente.">
              <input className={inputClass} value={studio.name} onChange={(e) => updateStudio({ name: e.target.value })} />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium">Logo</p>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-40 items-center justify-center rounded-xl border border-dashed border-line bg-[repeating-conic-gradient(#f3f3f3_0_25%,#fff_0_50%)] bg-[length:16px_16px] p-2">
                  {studio.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={studio.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-muted">Sem logo</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" className="px-4 py-2" onClick={() => fileInput.current?.click()}>
                    <ImageUp size={16} /> Enviar logo
                  </Button>
                  {studio.logo && (
                    <Button
                      variant="ghost"
                      className="px-4 py-2"
                      onClick={() => updateStudio({ logo: undefined, watermark: { ...wm, kind: "texto" } })}
                    >
                      <Trash2 size={16} /> Remover
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/svg+xml,image/webp,image/jpeg"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) updateStudio({ logo: await readFile(file) });
                    e.target.value = "";
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">PNG com fundo transparente fica melhor, tanto nas galerias quanto na marca d&apos;água.</p>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-serif text-2xl">Marca d&apos;água</h2>
            <p className="text-sm text-muted">
              Gravada nas fotos de seleção (não é uma camada por cima que dá para remover). As fotos entregues ficam sem marca.
            </p>
            <div className="flex gap-2">
              {(["texto", "logo"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={k === "logo" && !studio.logo}
                  onClick={() => setWm({ kind: k })}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-sm transition disabled:opacity-40",
                    wm.kind === k ? "border-foreground bg-accent-soft font-medium" : "border-line",
                  )}
                >
                  {k === "texto" ? "Texto" : "Logo"}
                </button>
              ))}
            </div>
            {wm.kind === "texto" && (
              <Field label="Texto">
                <input className={inputClass} value={wm.text} onChange={(e) => setWm({ text: e.target.value })} />
              </Field>
            )}
            <Field label="Posição">
              <select className={inputClass} value={wm.position} onChange={(e) => setWm({ position: e.target.value as WatermarkPosition })}>
                {(Object.keys(positions) as WatermarkPosition[]).map((p) => (
                  <option key={p} value={p}>
                    {positions[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Transparência · ${Math.round(wm.opacity * 100)}%`}>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={wm.opacity}
                onChange={(e) => setWm({ opacity: Number(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
            </Field>
            <Field label={`Tamanho · ${Math.round(wm.size * 100)}%`}>
              <input
                type="range"
                min={0.08}
                max={0.5}
                step={0.01}
                value={wm.size}
                onChange={(e) => setWm({ size: Number(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
            </Field>
          </section>
        </div>

        <section className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm font-medium">Prévia (como o cliente vê na seleção)</p>
          <div className="grid grid-cols-[3fr_2fr] gap-3">
            {samples.map((p) => (
              <ProtectedImage key={p.id} photo={p} enabled className="w-full rounded-xl" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
