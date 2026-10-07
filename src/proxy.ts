import { NextResponse, type NextRequest } from "next/server";

// Checagem rápida: sem o cookie de sessão, o painel manda para o login.
// A conferência de verdade acontece no servidor, em cada ação (requirePhotographer).
export function proxy(request: NextRequest) {
  if (!request.cookies.has("aos-sessao")) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/painel/:path*",
};
