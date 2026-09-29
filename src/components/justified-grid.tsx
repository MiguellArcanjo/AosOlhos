import type { Photo } from "@/lib/types";

/**
 * Grade "justificada" (estilo Google Fotos): linhas de altura parecida,
 * respeitando a proporção de cada foto e mantendo a ordem da esquerda para a direita.
 */
export function JustifiedGrid({
  photos,
  children,
}: {
  photos: Photo[];
  children: (photo: Photo, index: number) => React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-2 [--row:130px] after:grow-[999999] after:content-[''] sm:gap-3 sm:[--row:220px]">
      {photos.map((p, i) => {
        const ratio = p.width / p.height;
        return (
          <div key={p.id} className="relative" style={{ width: `calc(var(--row) * ${ratio})`, flexGrow: ratio }}>
            <div style={{ paddingBottom: `${100 / ratio}%` }} />
            <div className="absolute inset-0">{children(p, i)}</div>
          </div>
        );
      })}
    </div>
  );
}
