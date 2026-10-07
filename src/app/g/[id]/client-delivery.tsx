"use client";

import { useState } from "react";
import { ArrowLeft, Download, Play, Share2 } from "lucide-react";
import { Button, buttonClass } from "@/components/ui";
import { Lightbox } from "@/components/lightbox";
import { JustifiedGrid } from "@/components/justified-grid";
import { Slideshow } from "@/components/slideshow";
import { StudioLogo } from "@/components/studio-logo";
import { useStore } from "@/lib/store";
import type { Gallery, Photo } from "@/lib/types";
import { cn, coverOf, formatDate, galleryLink } from "@/lib/utils";

async function photoBlob(p: Photo) {
  const res = await fetch(p.src);
  if (!res.ok) throw new Error(`Falha ao baixar ${p.name}`);
  return res.blob();
}

function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function ClientDelivery({
  gallery,
  sameDay = false,
  onBack,
}: {
  gallery: Gallery;
  /** Mostra as fotos entregues no dia em vez das fotos finais. */
  sameDay?: boolean;
  onBack?: () => void;
}) {
  const { studio } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const [slideshow, setSlideshow] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const [zipping, setZipping] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const photos = sameDay ? gallery.sameDayPhotos : gallery.deliveryPhotos;
  const subtitle = sameDay
    ? `Fotos do dia · ${gallery.status === "rascunho" ? "as demais chegam em breve" : "a seleção completa continua no mesmo link"}`
    : `${gallery.title} · ${formatDate(gallery.eventDate)}`;
  const hero = photos[0] ?? coverOf(gallery);
  const minimal = gallery.design.cover === "minimal";

  function flash(text: string) {
    setNotice(text);
    setTimeout(() => setNotice(null), 2500);
  }

  async function downloadOne(p: Photo) {
    try {
      saveBlob(await photoBlob(p), p.name);
    } catch {
      window.open(p.src, "_blank");
    }
  }

  async function downloadAll() {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    try {
      for (const [i, p] of photos.entries()) {
        setZipping(`Preparando ${i + 1} de ${photos.length}…`);
        zip.file(p.name, await photoBlob(p));
      }
      setZipping("Compactando…");
      saveBlob(
        await zip.generateAsync({ type: "blob" }),
        `${gallery.clientName}${sameDay ? " - fotos do dia" : ""} - ${studio.name}.zip`,
      );
    } catch {
      flash("Não foi possível baixar todas as fotos. Tente novamente.");
    } finally {
      setZipping(null);
    }
  }

  /**
   * No celular abre a folha de compartilhamento do sistema com a foto (WhatsApp, Instagram, Stories…).
   * No computador, sem suporte a arquivos, manda o link da galeria pelo WhatsApp.
   */
  async function sharePhoto(p: Photo) {
    const text = `Fotos por ${studio.name} 📸`;
    try {
      const file = new File([await photoBlob(p)], p.name, { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // a pessoa cancelou
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${galleryLink(gallery)}`)}`, "_blank");
  }

  async function shareGallery() {
    const data = { title: gallery.clientName, text: `Olha as fotos de ${gallery.clientName} por ${studio.name} 📸`, url: galleryLink(gallery) };
    try {
      if (navigator.share) return await navigator.share(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
    await navigator.clipboard.writeText(data.url);
    flash("Link copiado!");
  }

  const outline = minimal ? "border border-line" : "border border-white/40 text-white hover:bg-white/10";
  const actions = (
    <div className="mt-6 flex flex-wrap gap-2">
      {onBack && (
        <button type="button" onClick={onBack} className={buttonClass("ghost", outline)}>
          <ArrowLeft size={16} /> Voltar para a seleção
        </button>
      )}
      <Button onClick={downloadAll} disabled={!!zipping || photos.length === 0} variant="secondary" className="border-transparent">
        <Download size={16} /> {zipping ?? `Baixar todas (${photos.length})`}
      </Button>
      <button
        type="button"
        onClick={() => setSlideshow(true)}
        disabled={photos.length === 0}
        className={buttonClass("ghost", outline)}
      >
        <Play size={16} /> Slideshow
      </button>
      {gallery.allowShare && (
        <button
          type="button"
          onClick={shareGallery}
          className={buttonClass("ghost", outline)}
        >
          <Share2 size={16} /> Compartilhar
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      {minimal ? (
        <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-16 text-center sm:px-6">
          <StudioLogo className="text-sm text-muted" imageClassName="mx-auto" />
          <h1 className="mt-4 font-serif text-5xl leading-tight">{gallery.clientName}</h1>
          <p className="mt-1 text-muted">{subtitle}</p>
          <div className="flex justify-center">{actions}</div>
        </section>
      ) : (
        <section className="relative flex h-[60vh] min-h-80 items-end overflow-hidden">
          {hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 text-white sm:px-6">
            <StudioLogo className="text-sm text-white/70" imageClassName="brightness-0 invert" />
            <h1 className="mt-2 font-serif text-5xl leading-tight">{gallery.clientName}</h1>
            <p className="mt-1 text-white/80">{subtitle}</p>
            {actions}
          </div>
        </section>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-2 py-6 sm:px-6">
        <JustifiedGrid photos={photos}>
          {(p, i) => (
            <div className="group h-full">
              <button type="button" onClick={() => setOpen(i)} className="block h-full w-full overflow-hidden rounded-lg bg-accent-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
              </button>
              <div className="absolute bottom-2 right-2 flex gap-1.5 transition sm:opacity-0 sm:group-hover:opacity-100">
                {gallery.allowShare && (
                  <PhotoAction label={`Compartilhar ${p.name}`} onClick={() => sharePhoto(p)}>
                    <Share2 size={16} />
                  </PhotoAction>
                )}
                <PhotoAction label={`Baixar ${p.name}`} onClick={() => downloadOne(p)}>
                  <Download size={16} />
                </PhotoAction>
              </div>
            </div>
          )}
        </JustifiedGrid>
      </main>

      {open !== null && (
        <Lightbox
          photos={photos}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          grayscale={grayscale}
          onGrayscale={setGrayscale}
          actions={(p) => (
            <>
              {gallery.allowShare && (
                <button type="button" onClick={() => sharePhoto(p)} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm hover:bg-white/10">
                  <Share2 size={16} /> Compartilhar
                </button>
              )}
              <button
                type="button"
                onClick={() => downloadOne(p)}
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                <Download size={16} /> Baixar
              </button>
            </>
          )}
        />
      )}

      {slideshow && <Slideshow photos={photos} title={gallery.clientName} onClose={() => setSlideshow(false)} />}

      <div
        role="status"
        className={cn(
          "pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-white transition",
          notice ? "opacity-100" : "opacity-0",
        )}
      >
        {notice}
      </div>
    </div>
  );
}

function PhotoAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-full bg-white/90 p-2.5 text-[#2b2724] shadow-lg transition hover:bg-white"
    >
      {children}
    </button>
  );
}
