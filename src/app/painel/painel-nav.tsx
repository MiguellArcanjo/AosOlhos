"use client";

import Link from "next/link";
import { LogOut, Palette, Plus } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { logout } from "@/app/actions/auth";

export function PainelNav() {
  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      <Link href="/painel/galerias/nova" className={buttonClass("primary", "px-3 sm:px-5")}>
        <Plus size={16} />
        <span className="hidden sm:inline">Nova galeria</span>
      </Link>
      <Link href="/painel/estudio" title="Estúdio: logo e marca d'água" className={buttonClass("ghost", "px-3")}>
        <Palette size={16} />
        <span className="hidden md:inline">Estúdio</span>
      </Link>
      <form action={logout}>
        <button type="submit" title="Sair" aria-label="Sair" className={buttonClass("ghost", "px-3")}>
          <LogOut size={16} />
        </button>
      </form>
    </nav>
  );
}
