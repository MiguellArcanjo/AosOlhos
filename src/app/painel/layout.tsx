import Link from "next/link";
import { Logo } from "@/components/ui";
import { StoreProvider } from "@/lib/store";
import { PainelNav } from "./painel-nav";

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <StoreProvider source={{ mode: "painel" }}>
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/painel">
            <Logo className="text-xl" />
          </Link>
          <PainelNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
    </StoreProvider>
  );
}
