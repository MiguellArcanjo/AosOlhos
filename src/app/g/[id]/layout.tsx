import { StoreProvider } from "@/lib/store";

/** A área do cliente carrega só a galeria do link (e só depois do código). */
export default async function ClientGalleryLayout({ children, params }: LayoutProps<"/g/[id]">) {
  const { id } = await params;
  return <StoreProvider source={{ mode: "cliente", galleryId: id }}>{children}</StoreProvider>;
}
