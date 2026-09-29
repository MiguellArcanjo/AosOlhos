"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { GalleryForm } from "@/components/gallery-form";
import { useStore } from "@/lib/store";
import type { Gallery, NewGallery } from "@/lib/types";

function formFields(g: NewGallery): NewGallery {
  const { title, eventDate, clientName, clientEmail, includedPhotos, allowExtras, extraPrice, deadline, message } = g;
  return { title, eventDate, clientName, clientEmail, includedPhotos, allowExtras, extraPrice, deadline, message };
}

export function SettingsTab({ gallery }: { gallery: Gallery }) {
  const router = useRouter();
  const { updateGallery, deleteGallery } = useStore();
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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

      <div className="rounded-2xl border border-danger/30 bg-surface p-6">
        <h2 className="font-serif text-2xl">Excluir galeria</h2>
        <p className="mt-1 text-sm text-muted">Remove a galeria, as fotos e a seleção do cliente.</p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => {
            if (confirm(`Excluir a galeria de ${gallery.clientName}? Não dá para desfazer.`)) {
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
