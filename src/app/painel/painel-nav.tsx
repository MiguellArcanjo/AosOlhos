"use client";

import { useDialog } from "@/components/dialog";
import Link from "next/link";
import { LogOut, Palette, Plus, RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { useStore } from "@/lib/store";

export function PainelNav() {
  const { resetDemo } = useStore();
  const [dialog, dialogElement] = useDialog();

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {dialogElement}
      <Link href="/painel/galerias/nova" className={buttonClass("primary", "px-3 sm:px-5")}>
        <Plus size={16} />
        <span className="hidden sm:inline">Nova galeria</span>
      </Link>
      <Link href="/painel/estudio" title="Estúdio: logo e marca d'água" className={buttonClass("ghost", "px-3")}>
        <Palette size={16} />
        <span className="hidden md:inline">Estúdio</span>
      </Link>
      <button
        type="button"
        title="Restaurar dados de demonstração"
        className={buttonClass("ghost", "px-3")}
        onClick={async () =>
          (await dialog.confirm({ title: "Restaurar demonstração?", message: "Apaga tudo e volta aos dados de exemplo.", confirmLabel: "Restaurar", danger: true })) &&
          resetDemo()
        }
      >
        <RotateCcw size={16} />
      </button>
      <Link href="/entrar" title="Sair" className={buttonClass("ghost", "px-3")}>
        <LogOut size={16} />
      </Link>
    </nav>
  );
}
