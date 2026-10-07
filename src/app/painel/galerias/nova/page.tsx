"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { GalleryForm, emptyGallery } from "@/components/gallery-form";
import { useStore } from "@/lib/store";

export default function NovaGaleriaPage() {
  const router = useRouter();
  const { createGallery } = useStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/painel" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <div>
        <h1 className="font-serif text-4xl">Nova galeria</h1>
        <p className="mt-1 text-muted">Depois de criar, você envia as fotos e compartilha com o cliente.</p>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{error}</p>}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <GalleryForm
          initial={emptyGallery()}
          submitLabel={saving ? "Criando…" : "Criar e enviar fotos"}
          onSubmit={async (data) => {
            setSaving(true);
            setError(null);
            try {
              const g = await createGallery(data);
              router.push(`/painel/galerias/${g.id}`);
            } catch {
              setError("Não foi possível criar a galeria. Tente de novo.");
              setSaving(false);
            }
          }}
        />
      </div>
    </div>
  );
}
