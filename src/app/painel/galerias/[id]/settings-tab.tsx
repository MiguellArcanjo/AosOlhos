"use client";

import { useDialog } from "@/components/dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { GalleryForm } from "@/components/gallery-form";
import { useStore } from "@/lib/store";
import type { Gallery, GalleryFields } from "@/lib/types";

function formFields(g: GalleryFields): GalleryFields {
  const { title, eventDate, clientName, category, includedPhotos, sameDayCount, allowExtras, extraPrice, deadline, expiresAt, message, design, watermark, allowShare } = g;
  return { title, eventDate, clientName, category: category.trim(), includedPhotos, sameDayCount, allowExtras, extraPrice, deadline, expiresAt, message, design, watermark, allowShare };
}

export function SettingsTab({ gallery }: { gallery: Gallery }) {
  const router = useRouter();
  const { updateGallery, deleteGallery, setArchived } = useStore();
  const [saved, setSaved] = useState(false);
  const [dialog, dialogElement] = useDialog();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {dialogElement}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <GalleryForm
          initial={formFields(gallery)}
          submitLabel={saved ? "Salvo ✓" : "Salvar alterações"}
          onSubmit={(data) => {
            // Só os campos do formulário, para não sobrescrever fotos/seleção com uma cópia antiga.
            updateGallery(gallery.id, formFields(data));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-serif text-2xl">{gallery.archived ? "Galeria arquivada" : "Arquivar galeria"}</h2>
        <p className="mt-1 text-sm text-muted">
          {gallery.archived
            ? "Ela não aparece na lista principal e o cliente não consegue mais acessar."
            : "Tira a galeria da lista principal e fecha o acesso do cliente, sem apagar nada. Bom para trabalhos antigos."}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => setArchived(gallery.id, !gallery.archived)}>
          {gallery.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          {gallery.archived ? "Desarquivar" : "Arquivar"}
        </Button>
      </div>

      <div className="rounded-2xl border border-danger/30 bg-surface p-6">
        <h2 className="font-serif text-2xl">Excluir galeria</h2>
        <p className="mt-1 text-sm text-muted">Remove a galeria, as fotos e a seleção dos clientes.</p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={async () => {
            const ok = await dialog.confirm({
              title: `Excluir a galeria de ${gallery.clientName}?`,
              message: "Não dá para desfazer.",
              confirmLabel: "Excluir",
              danger: true,
            });
            if (ok) {
              deleteGallery(gallery.id);
              router.push("/painel");
            }
          }}
        >
          <Trash2 size={16} /> Excluir
        </Button>
      </div>
    </div>
  );
}
