"use client";

import { useRouter } from "next/navigation";
import { Button, Field, Logo, inputClass } from "@/components/ui";

// Login só visual por enquanto: a autenticação real virá com o Appwrite.
export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="grid flex-1 lg:grid-cols-2">
      <div className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://picsum.photos/seed/aosolhos-login/1200/1600" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <p className="absolute bottom-10 left-10 max-w-sm font-serif text-3xl leading-snug text-white">
          Cada história merece ser vista com carinho.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <form
          className="w-full max-w-sm space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/painel");
          }}
        >
          <div className="space-y-2 text-center">
            <Logo className="text-3xl" />
            <p className="text-sm text-muted">Área da fotógrafa</p>
          </div>
          <Field label="E-mail">
            <input type="email" className={inputClass} placeholder="voce@exemplo.com" autoComplete="email" />
          </Field>
          <Field label="Senha">
            <input type="password" className={inputClass} placeholder="••••••••" autoComplete="current-password" />
          </Field>
          <Button type="submit" className="w-full">
            Entrar
          </Button>
          <p className="text-center text-xs text-muted">Versão de demonstração — qualquer dado entra.</p>
        </form>
      </div>
    </main>
  );
}
