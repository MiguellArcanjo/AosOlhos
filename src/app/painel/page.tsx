"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, CalendarDays, Folder, Images, Pencil, Search, Users } from "lucide-react";
import { useDialog } from "@/components/dialog";
import { Spinner, StatusBadge, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { GalleryStatus } from "@/lib/types";
import { categoriesOf, cn, coverOf, daysUntil, expiryLabel, finalizedCount, formatDate, statusInfo } from "@/lib/utils";

type Filter = GalleryStatus | "todas" | "arquivadas";

const filters: Filter[] = ["todas", "rascunho", "selecao", "finalizada", "entregue", "arquivadas"];

/** null = todas as pastas; "" = sem pasta; qualquer outro valor = nome da pasta. */
type CategoryFilter = string | null;

const categoryKey = "aos-olhos:pasta-painel";

/** Lembra a última pasta aberta neste navegador. */
function savedCategory(): CategoryFilter {
  try {
    return typeof window === "undefined" ? null : localStorage.getItem(categoryKey);
  } catch {
    return null;
  }
}

export default function PainelPage() {
  const { ready, galleries, renameCategory } = useStore();
  const [filter, setFilter] = useState<Filter>("todas");
  const [category, setCategoryState] = useState<CategoryFilter>(savedCategory);
  const [query, setQuery] = useState("");
  const [dialog, dialogElement] = useDialog();

  if (!ready) return <Spinner />;

  function setCategory(value: CategoryFilter) {
    setCategoryState(value);
    try {
      if (value === null) localStorage.removeItem(categoryKey);
      else localStorage.setItem(categoryKey, value);
    } catch {}
  }

  const categories = categoriesOf(galleries, false);
  const uncategorized = galleries.filter((g) => !g.category).length;
  // Pasta salva que deixou de existir (renomeada/esvaziada) volta para "Todas".
  const currentCategory = category !== null && (category === "" ? uncategorized > 0 : categories.includes(category)) ? category : null;
  const inCategory = currentCategory === null ? galleries : galleries.filter((g) => g.category === currentCategory);

  // Arquivadas só aparecem no filtro próprio.
  const active = inCategory.filter((g) => !g.archived);
  const count = (s: GalleryStatus) => active.filter((g) => g.status === s).length;
  const q = query.trim().toLowerCase();
  const visible = inCategory.filter(
    (g) =>
      (filter === "arquivadas" ? g.archived : !g.archived && (filter === "todas" || g.status === filter)) &&
      (!q || `${g.title} ${g.clientName} ${g.category}`.toLowerCase().includes(q)),
  );

  async function rename(from: string) {
    const to = await dialog.prompt({ title: "Renomear pasta", label: "Nome", initial: from, confirmLabel: "Renomear" });
    if (!to?.trim() || to.trim() === from) return;
    renameCategory(from, to);
    setCategory(to.trim());
  }

  return (
    <div className="space-y-8">
      {dialogElement}
      <div>
        <h1 className="font-serif text-4xl">Olá! ✨</h1>
        <p className="mt-1 text-muted">Acompanhe suas galerias e seleções.</p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryChip active={currentCategory === null} onClick={() => setCategory(null)}>
            Todas as pastas <span className="text-xs opacity-60">{galleries.length}</span>
          </CategoryChip>
          {categories.map((c) => (
            <CategoryChip key={c} active={currentCategory === c} onClick={() => setCategory(c)}>
              <Folder size={14} /> {c} <span className="text-xs opacity-60">{galleries.filter((g) => g.category === c).length}</span>
            </CategoryChip>
          ))}
          {uncategorized > 0 && (
            <CategoryChip active={currentCategory === ""} onClick={() => setCategory("")}>
              Sem pasta <span className="text-xs opacity-60">{uncategorized}</span>
            </CategoryChip>
          )}
          {currentCategory && (
            <button
              type="button"
              title="Renomear pasta"
              aria-label="Renomear pasta"
              onClick={() => rename(currentCategory)}
              className="rounded-full p-2 text-muted hover:bg-accent-soft hover:text-foreground"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      )}

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
                filter === f ? "bg-foreground text-background" : "text-muted hover:bg-accent-soft",
              )}
            >
              {f === "todas" ? "Todas" : f === "arquivadas" ? (
                <span className="flex items-center gap-1">
                  <Archive size={13} /> Arquivadas
                </span>
              ) : (
                statusInfo[f].label
              )}
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
            const multi = g.clients.length > 1;
            // Com vários clientes, o progresso é quantos já finalizaram.
            const done = multi ? finalizedCount(g) : g.clients[0]?.selection.photoIds.length ?? 0;
            const total = multi ? g.clients.length : g.includedPhotos;
            const expiry = expiryLabel(g);
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
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <StatusBadge status={g.status} />
                    {expiry && <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs text-danger">{expiry}</span>}
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="font-serif text-xl leading-tight">{g.clientName}</p>
                    <p className="text-sm text-muted">
                      {g.title}
                      {currentCategory === null && g.category && <span className="opacity-70"> · {g.category}</span>}
                    </p>
                  </div>
                  {g.status === "selecao" && (
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted">
                        <span>
                          {multi ? `${done} de ${total} clientes finalizaram` : `${done} de ${total} escolhidas`}
                        </span>
                        <span className={late ? "text-danger" : ""}>até {formatDate(g.deadline)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-accent-soft">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.min(100, (done / total) * 100)}%` }}
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
                    {multi && (
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {g.clients.length} clientes
                      </span>
                    )}
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

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition",
        active ? "bg-foreground text-background" : "border border-line bg-surface hover:bg-accent-soft",
      )}
    >
      {children}
    </button>
  );
}
