"use client";

import Link from "next/link";
import { LogOut, Plus, RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { useStore } from "@/lib/store";

export function PainelNav() {
  const { resetDemo } = useStore();

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      <Link href="/painel/galerias/nova" className={buttonClass("primary", "px-3 sm:px-5")}>
        <Plus size={16} />
        <span className="hidden sm:inline">Nova galeria</span>
      </Link>
      <button
        type="button"
        title="Restaurar dados de demonstração"
        className={buttonClass("ghost", "px-3")}
        onClick={() => confirm("Apagar tudo e voltar aos dados de demonstração?") && resetDemo()}
      >
        <RotateCcw size={16} />
      </button>
      <Link href="/entrar" title="Sair" className={buttonClass("ghost", "px-3")}>
        <LogOut size={16} />
      </Link>
    </nav>
  );
}
