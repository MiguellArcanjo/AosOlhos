import { BUCKET, DATABASE, TABLES, admin, getPhotographer } from "@/lib/appwrite/server";
import { clientAccess, clientCanSee, findGalleryRow, isOpenForClients } from "@/lib/appwrite/queries";
import type { PhotoRow } from "@/lib/appwrite/rows";

// Entrega a foto conferindo quem pede: a fotógrafa logada, ou o cliente com o código daquela galeria.
// O bucket é privado; o navegador nunca fala direto com o Appwrite.

const notFound = () => new Response("Foto não encontrada", { status: 404 });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, storage } = admin();

  let photo: PhotoRow;
  try {
    photo = await db.getRow<PhotoRow>({ databaseId: DATABASE, tableId: TABLES.photos, rowId: id });
  } catch {
    return notFound();
  }

  if (!(await getPhotographer())) {
    const gallery = await findGalleryRow(photo.galleryId);
    if (!gallery) return notFound();
    // A capa aparece na tela do código, antes de o cliente entrar.
    const isCover = gallery.coverPhotoId === photo.$id && isOpenForClients(gallery);
    const allowed = isCover || ((await clientAccess(gallery.$id)) && clientCanSee(gallery, photo));
    if (!allowed) return notFound();
  }

  const file = await storage.getFileView({ bucketId: BUCKET, fileId: photo.fileId });
  const download = new URL(request.url).searchParams.has("baixar");
  const name = encodeURIComponent(photo.name ?? "foto.jpg");
  return new Response(file, {
    headers: {
      "Content-Type": "image/jpeg",
      // O arquivo de um id nunca muda; só o próprio navegador guarda (é privado).
      "Cache-Control": "private, max-age=31536000, immutable",
      ...(download ? { "Content-Disposition": `attachment; filename*=UTF-8''${name}` } : {}),
    },
  });
}
