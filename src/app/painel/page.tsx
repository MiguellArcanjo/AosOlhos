"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Images, Search } from "lucide-react";
import { Spinner, StatusBadge, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { GalleryStatus } from "@/lib/types";
import { cn, coverOf, daysUntil, formatDate, statusInfo } from "@/lib/utils";

const filters: (GalleryStatus | "todas")[] = ["todas", "rascunho", "selecao", "finalizada", "entregue"];

export default function PainelPage() {
  const { ready, galleries } = useStore();
  const [filter, setFilter] = useState<GalleryStatus | "todas">("todas");
  const [query, setQuery] = useState("");

  if (!ready) return <Spinner />;

  const count = (s: GalleryStatus) => galleries.filter((g) => g.status === s).length;
  const q = query.trim().toLowerCase();
  const visible = galleries.filter(
    (g) =>
      (filter === "todas" || g.status === filter) &&
      (!q || `${g.title} ${g.clientName}`.toLowerCase().includes(q)),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Olá! ✨</h1>
        <p className="mt-1 text-muted">Acompanhe suas galerias e seleções.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["selecao", "Aguardando cliente"],
            ["finalizada", "Para editar"],
            ["entregue", "Entregues"],
            ["rascunho", "Rascunhos"],
          ] as const
        ).map(([status, label]) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(filter === status ? "todas" : status)}
            className={cn(
              "rounded-2xl border bg-surface p-4 text-left transition hover:border-accent",
              filter === status ? "border-accent ring-2 ring-accent/20" : "border-line",
            )}
          >
            <p className="text-3xl font-light">{count(status)}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition",
                filter === f ? "bg-foreground text-white" : "text-muted hover:bg-accent-soft",
              )}
            >
              {f === "todas" ? "Todas" : statusInfo[f].label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente ou galeria"
            className={cn(inputClass, "pl-9")}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">
          Nenhuma galeria encontrada.{" "}
          <Link href="/painel/galerias/nova" className="text-accent-strong underline">
            Criar uma nova
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((g) => {
            const cover = coverOf(g);
            const selected = g.selection.photoIds.length;
            const late = g.status === "selecao" && daysUntil(g.deadline) < 0;
            return (
              <Link
                key={g.id}
                href={`/painel/galerias/${g.id}`}
                className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-accent-soft">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.src} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted">
                      <Images size={32} />
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <StatusBadge status={g.status} />
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="font-serif text-xl leading-tight">{g.clientName}</p>
                    <p className="text-sm text-muted">{g.title}</p>
                  </div>
                  {g.status === "selecao" && (
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted">
                        <span>
                          {selected} de {g.includedPhotos} escolhidas
                        </span>
                        <span className={late ? "text-danger" : ""}>até {formatDate(g.deadline)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-accent-soft">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.min(100, (selected / g.includedPhotos) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Images size={14} /> {g.photos.length} fotos
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays size={14} /> {formatDate(g.eventDate)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
