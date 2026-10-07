"use client";

import { useState } from "react";
import { Contrast, Gift, Heart, MessageSquare, Star } from "lucide-react";
import { Button, Modal, inputClass } from "@/components/ui";
import { Lightbox } from "@/components/lightbox";
import { JustifiedGrid } from "@/components/justified-grid";
import { ProtectedImage } from "@/components/protected-image";
import { StudioLogo } from "@/components/studio-logo";
import { useStore } from "@/lib/store";
import type { Gallery, GalleryClient, Photo } from "@/lib/types";
import { cn, deadlineLabel, daysUntil, extrasOf, formatMoney, photosInFolder } from "@/lib/utils";

type Filter = "todas" | "selecionadas" | "favoritas";

export function ClientSelection({
  gallery,
  client,
  onSameDay,
}: {
  gallery: Gallery;
  client: GalleryClient;
  /** Abre as fotos entregues no dia (quando a fotógrafa já liberou). */
  onSameDay?: () => void;
}) {
  const { toggleSelected, setComment, toggleBw, finalizeSelection } = useStore();
  // Prévia em preto e branco (só visual, não muda a seleção).
  const [bw, setBw] = useState(false);
  const [filter, setFilter] = useState<Filter>("todas");
  const [folder, setFolder] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [welcome, setWelcome] = useState(!!gallery.message);

  const selectedIds = client.selection.photoIds;
  const comments = client.selection.comments;
  const bwIds = client.selection.bwIds;
  const count = selectedIds.length;
  const extras = extrasOf(gallery, client);
  const full = !gallery.allowExtras && count >= gallery.includedPhotos;
  const isSelected = (p: Photo) => selectedIds.includes(p.id);
  const isFavorite = (p: Photo) => gallery.favoriteIds.includes(p.id);

  // Pastas sem fotos não aparecem para o cliente.
  const folders = gallery.folders.filter((f) => gallery.photos.some((p) => p.folderId === f.id));
  const inFolder = photosInFolder(gallery.photos, folder);
  const visible = inFolder.filter((p) =>
    filter === "selecionadas" ? isSelected(p) : filter === "favoritas" ? isFavorite(p) : true,
  );

  const toggle = (p: Photo) => toggleSelected(gallery.id, client.id, p.id);
  const late = daysUntil(gallery.deadline) < 0;
  const firstName = client.name.split(" ")[0];

  return (
    <div className="protected flex flex-1 flex-col" onContextMenu={(e) => e.preventDefault()}>
      <header className="sticky top-0 z-30 border-b border-line bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <StudioLogo className="text-sm text-muted" imageClassName="h-6" />
            <p className="truncate font-serif text-2xl leading-tight">{gallery.clientName}</p>
            {gallery.clients.length > 1 && <p className="text-xs text-muted">Seleção de {client.name}</p>}
          </div>

          <div className="order-last flex w-full items-center gap-4 sm:order-none sm:w-auto sm:flex-1 sm:justify-center">
            <div className="flex-1 sm:max-w-xs">
              <div className="mb-1 flex justify-between text-xs">
                <span>
                  <strong className="text-sm">{count}</strong> de {gallery.includedPhotos} fotos
                </span>
                {extras > 0 && <span className="text-accent-strong">+{extras} extra{extras > 1 ? "s" : ""}</span>}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-accent-soft">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.min(100, (count / gallery.includedPhotos) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSameDay && (
              <Button variant="secondary" onClick={onSameDay}>
                <Gift size={16} /> <span className="hidden sm:inline">Fotos do dia</span>
              </Button>
            )}
            <Button onClick={() => setConfirming(true)} disabled={count === 0}>
              Finalizar seleção
            </Button>
          </div>
        </div>

        {folders.length > 0 && (
          <div className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 sm:px-6">
            <FolderTab active={folder === null} onClick={() => setFolder(null)}>
              Todas
            </FolderTab>
            {folders.map((f) => (
              <FolderTab key={f.id} active={folder === f.id} onClick={() => setFolder(f.id)}>
                {f.name}
              </FolderTab>
            ))}
          </div>
        )}

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            <FilterButton active={filter === "todas"} onClick={() => setFilter("todas")}>
              Todas ({inFolder.length})
            </FilterButton>
            <FilterButton active={filter === "selecionadas"} onClick={() => setFilter("selecionadas")}>
              Escolhidas ({inFolder.filter(isSelected).length})
            </FilterButton>
            {gallery.favoriteIds.length > 0 && (
              <FilterButton active={filter === "favoritas"} onClick={() => setFilter("favoritas")}>
                Favoritas da fotógrafa
              </FilterButton>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("hidden whitespace-nowrap text-xs sm:block", late ? "text-danger" : "text-muted")}>
              {deadlineLabel(gallery.deadline)}
            </span>
            <FilterButton active={bw} onClick={() => setBw(!bw)} title="Ver as fotos em preto e branco">
              <span className="flex items-center gap-1.5">
                <Contrast size={14} /> P&amp;B
              </span>
            </FilterButton>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-2 py-4 sm:px-6">
        {full && (
          <p className="mb-4 rounded-xl bg-accent-soft px-4 py-3 text-center text-sm">
            Você chegou ao limite de {gallery.includedPhotos} fotos. Para trocar, desmarque alguma.
          </p>
        )}
        {visible.length === 0 ? (
          <p className="py-24 text-center text-muted">
            {filter === "selecionadas" ? "Toque no coração das fotos que você mais gostar." : "Nenhuma foto aqui."}
          </p>
        ) : (
          <JustifiedGrid photos={visible}>
            {(p, i) => {
              const sel = isSelected(p);
              return (
                <>
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    className={cn(
                      "block h-full w-full overflow-hidden rounded-lg bg-accent-soft transition",
                      sel && "ring-4 ring-accent ring-offset-2 ring-offset-background",
                    )}
                  >
                    <ProtectedImage
                      photo={p}
                      enabled={gallery.watermark}
                      loading="lazy"
                      className={cn("h-full w-full object-cover transition-[filter] duration-300", bw && "grayscale")}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(p)}
                    disabled={!sel && full}
                    aria-label={sel ? "Desmarcar" : "Escolher"}
                    className={cn(
                      "absolute bottom-2 right-2 rounded-full p-2.5 shadow-lg transition active:scale-90 disabled:opacity-50",
                      sel ? "bg-accent text-white" : "bg-white/90 text-[#2b2724] hover:bg-white",
                    )}
                  >
                    <Heart size={18} className={sel ? "fill-current" : ""} />
                  </button>
                  <div className="pointer-events-none absolute left-2 top-2 flex gap-1">
                    {isFavorite(p) && (
                      <span className="rounded-full bg-white/90 p-1.5 shadow" title="Favorita da fotógrafa">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                      </span>
                    )}
                    {comments[p.id] && (
                      <span className="rounded-full bg-white/90 p-1.5 shadow" title="Você comentou">
                        <MessageSquare size={13} className="text-[#7d6045]" />
                      </span>
                    )}
                    {bwIds.includes(p.id) && (
                      <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#2b2724] shadow" title="Pedida em preto e branco">
                        P&amp;B
                      </span>
                    )}
                  </div>
                  <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
                    {p.name}
                  </span>
                </>
              );
            }}
          </JustifiedGrid>
        )}
      </main>

      {open !== null && (
        <Lightbox
          protect
          photos={visible}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          grayscale={bw}
          onGrayscale={setBw}
          renderImage={(p, className) => <ProtectedImage key={p.id} photo={p} enabled={gallery.watermark} className={className} />}
          onKey={(e, p) => {
            if (e.key !== " ") return false;
            toggle(p);
            return true;
          }}
          actions={(p) => {
            const sel = isSelected(p);
            return (
              <button
                type="button"
                onClick={() => toggle(p)}
                disabled={!sel && full}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition disabled:opacity-40",
                  sel ? "bg-accent text-white" : "bg-white/10 hover:bg-white/20",
                )}
              >
                <Heart size={16} className={sel ? "fill-current" : ""} />
                {sel ? "Escolhida" : "Escolher"}
              </button>
            );
          }}
          footer={(p) => (
            <div className="mx-auto max-w-2xl space-y-2">
              {isSelected(p) && (
                <label className="flex items-center justify-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-white"
                    checked={bwIds.includes(p.id)}
                    onChange={() => toggleBw(gallery.id, client.id, p.id)}
                  />
                  Quero esta foto em preto e branco
                </label>
              )}
              <CommentBox key={p.id} value={comments[p.id] ?? ""} onSave={(text) => setComment(gallery.id, client.id, p.id, text)} />
            </div>
          )}
        />
      )}

      <Modal open={welcome} onClose={() => setWelcome(false)} title={`Bem-vindo(a), ${firstName}!`}>
        <p className="whitespace-pre-line text-muted">{gallery.message}</p>
        <ul className="mt-4 space-y-1 text-sm">
          <li>❤️ Toque no coração para escolher uma foto</li>
          <li>
            📷 Seu pacote inclui <strong>{gallery.includedPhotos} fotos</strong>
            {gallery.allowExtras && gallery.extraPrice > 0 && <> · extras por {formatMoney(gallery.extraPrice)} cada</>}
          </li>
          {folders.length > 0 && <li>📁 As fotos estão separadas por momento, nas abas lá em cima</li>}
          <li>💬 Abra a foto para deixar um comentário</li>
          <li>◐ Use o botão P&amp;B para ver em preto e branco e, se quiser, peça a foto assim</li>
          <li>✅ Quando terminar, clique em “Finalizar seleção”</li>
        </ul>
        <Button className="mt-6 w-full" onClick={() => setWelcome(false)}>
          Começar
        </Button>
      </Modal>

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Finalizar seleção?">
        <div className="space-y-3 text-sm">
          <p>
            Você escolheu <strong>{count} fotos</strong>.
          </p>
          {count < gallery.includedPhotos && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">
              Seu pacote inclui {gallery.includedPhotos} — ainda dá para escolher mais {gallery.includedPhotos - count}.
            </p>
          )}
          {bwIds.length > 0 && (
            <p>
              {bwIds.length} em preto e branco.
            </p>
          )}
          {extras > 0 && (
            <p className="rounded-xl bg-accent-soft px-3 py-2">
              {extras} foto{extras > 1 ? "s" : ""} extra{extras > 1 ? "s" : ""} ·{" "}
              <strong>{formatMoney(extras * gallery.extraPrice)}</strong>
            </p>
          )}
          <p className="text-muted">Depois de finalizar, a seleção vai para a fotógrafa e não poderá ser alterada.</p>
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirming(false)}>
            Voltar
          </Button>
          <Button className="flex-1" onClick={() => finalizeSelection(gallery.id, client.id)}>
            Confirmar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function FolderTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px whitespace-nowrap border-b-2 py-2 font-serif text-lg transition",
        active ? "border-foreground" : "border-transparent text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function FilterButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "whitespace-nowrap rounded-full px-3 py-1 text-sm transition",
        active ? "bg-foreground text-background" : "text-muted hover:bg-accent-soft",
      )}
    >
      {children}
    </button>
  );
}

function CommentBox({ value, onSave }: { value: string; onSave: (text: string) => void }) {
  const [text, setText] = useState(value);
  const dirty = text !== value;
  return (
    <div className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && dirty && onSave(text)}
        placeholder="Deixe um comentário sobre esta foto (opcional)"
        className={cn(inputClass, "border-white/20 bg-white/10 text-white placeholder:text-white/50")}
      />
      <Button variant="secondary" disabled={!dirty} onClick={() => onSave(text)} className="shrink-0">
        Salvar
      </Button>
    </div>
  );
}
