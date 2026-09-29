import type { Folder, Gallery, GalleryClient, GalleryDesign, Photo, StudioSettings } from "./types";

// Fotos de banco de imagens (picsum.photos) — nunca usar fotos reais de clientes nos testes.
function demoPhotos(prefix: string, count: number, folders: Folder[] = []): Photo[] {
  return Array.from({ length: count }, (_, i) => {
    const portrait = i % 3 === 1;
    const width = portrait ? 800 : 1200;
    const height = portrait ? 1200 : 800;
    const n = String(i + 1).padStart(4, "0");
    return {
      id: `${prefix}-${n}`,
      name: `IMG_${n}.jpg`,
      src: `https://picsum.photos/seed/${prefix}${i}/${width}/${height}`,
      width,
      height,
      folderId: folders.length ? folders[Math.floor((i * folders.length) / count)].id : undefined,
    };
  });
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function client(id: string, name: string, accessCode: string, photoIds: string[] = [], extra: Partial<GalleryClient> = {}): GalleryClient {
  return {
    id,
    name,
    email: `${id}@example.com`,
    accessCode,
    selection: { photoIds, comments: {} },
    ...extra,
  };
}

const design = (theme: GalleryDesign["theme"], cover: GalleryDesign["cover"] = "centro", font: GalleryDesign["font"] = "classica"): GalleryDesign => ({
  theme,
  font,
  cover,
});

export const defaultStudio = (): StudioSettings => ({
  name: "Aos Olhos",
  watermark: { kind: "texto", text: "AOS OLHOS", position: "mosaico", opacity: 0.35, size: 0.18 },
});

export function seedGalleries(): Gallery[] {
  const ensaio = demoPhotos("ensaio", 36);
  const casamentoFolders: Folder[] = [
    { id: "making-of", name: "Making of" },
    { id: "cerimonia", name: "Cerimônia" },
    { id: "festa", name: "Festa" },
  ];
  const casamento = demoPhotos("casamento", 48, casamentoFolders);
  const familia = demoPhotos("familia", 24);
  const gestante = demoPhotos("gestante", 18);
  const formaturaFolders: Folder[] = [
    { id: "turma", name: "Turma" },
    { id: "individuais", name: "Individuais" },
    { id: "baile", name: "Baile" },
  ];
  const formatura = demoPhotos("formatura", 42, formaturaFolders);
  const aniversario = demoPhotos("aniversario", 20);

  const base = {
    archived: false,
    folders: [] as Folder[],
    favoriteIds: [] as string[],
    deliveryPhotos: [] as Photo[],
    watermark: true,
    allowShare: true,
  };

  return [
    {
      ...base,
      id: "ensaio-ana-e-pedro",
      title: "Ensaio pré-wedding",
      eventDate: daysFromNow(-12),
      clientName: "Ana e Pedro",
      clients: [
        client("ana-pedro", "Ana e Pedro", "482913",
          [ensaio[0].id, ensaio[4].id, ensaio[5].id, ensaio[9].id, ensaio[12].id, ensaio[17].id, ensaio[20].id],
          { selection: { photoIds: [ensaio[0].id, ensaio[4].id, ensaio[5].id, ensaio[9].id, ensaio[12].id, ensaio[17].id, ensaio[20].id], comments: { [ensaio[5].id]: "Dá pra clarear um pouco o fundo?" } } }),
      ],
      includedPhotos: 20,
      allowExtras: true,
      extraPrice: 25,
      deadline: daysFromNow(9),
      expiresAt: daysFromNow(90),
      message: "Oi, Ana e Pedro! Que alegria entregar esse ensaio pra vocês. Escolham com carinho as 20 fotos do pacote 💛",
      status: "selecao",
      createdAt: daysFromNow(-10),
      sentAt: daysFromNow(-6),
      coverPhotoId: ensaio[4].id,
      photos: ensaio,
      favoriteIds: [ensaio[4].id, ensaio[9].id, ensaio[17].id, ensaio[22].id],
      design: design("areia"),
    },
    {
      ...base,
      id: "formatura-3-ano",
      title: "Formatura 3º ano",
      eventDate: daysFromNow(-8),
      clientName: "Formatura 3º ano B",
      clients: [
        client("lucas", "Lucas Almeida", "250311", formatura.filter((_, i) => i % 4 === 0).map((p) => p.id), { finalizedAt: daysFromNow(-1) }),
        client("beatriz", "Beatriz Costa", "250312", formatura.filter((_, i) => i % 5 === 1).map((p) => p.id)),
        client("gabriel", "Gabriel Rocha", "250313"),
      ],
      includedPhotos: 10,
      allowExtras: true,
      extraPrice: 15,
      deadline: daysFromNow(12),
      expiresAt: daysFromNow(60),
      message: "Parabéns, formandos! Cada um escolhe as suas 10 fotos com o próprio código 🎓",
      status: "selecao",
      createdAt: daysFromNow(-7),
      sentAt: daysFromNow(-5),
      coverPhotoId: formatura[0].id,
      folders: formaturaFolders,
      photos: formatura,
      design: design("noite", "lateral", "moderna"),
    },
    {
      ...base,
      id: "casamento-julia-e-rafa",
      title: "Casamento",
      eventDate: daysFromNow(-30),
      clientName: "Júlia e Rafael",
      clients: [
        client("julia-rafa", "Júlia e Rafael", "730155", casamento.filter((_, i) => i % 3 === 0 || i === 2).map((p) => p.id), {
          finalizedAt: daysFromNow(-4),
          selection: {
            photoIds: casamento.filter((_, i) => i % 3 === 0 || i === 2).map((p) => p.id),
            comments: { [casamento[0].id]: "Essa é pra capa do álbum!", [casamento[9].id]: "Tirar o copo da mesa, se possível" },
          },
        }),
      ],
      includedPhotos: 30,
      allowExtras: true,
      extraPrice: 20,
      deadline: daysFromNow(-5),
      expiresAt: daysFromNow(120),
      message: "Foi uma honra registrar o dia de vocês!",
      status: "finalizada",
      createdAt: daysFromNow(-25),
      sentAt: daysFromNow(-20),
      coverPhotoId: casamento[2].id,
      folders: casamentoFolders,
      photos: casamento,
      favoriteIds: [casamento[2].id, casamento[11].id],
      design: design("branco", "minimal"),
    },
    {
      ...base,
      id: "familia-souza",
      title: "Ensaio de família",
      eventDate: daysFromNow(-45),
      clientName: "Família Souza",
      clients: [client("souza", "Família Souza", "115820", familia.slice(0, 15).map((p) => p.id), { finalizedAt: daysFromNow(-35) })],
      includedPhotos: 15,
      allowExtras: false,
      extraPrice: 0,
      deadline: daysFromNow(-30),
      expiresAt: daysFromNow(10),
      message: "",
      status: "entregue",
      createdAt: daysFromNow(-44),
      sentAt: daysFromNow(-40),
      deliveredAt: daysFromNow(-20),
      coverPhotoId: familia[1].id,
      photos: familia,
      deliveryPhotos: familia.slice(0, 15),
      design: design("oliva"),
    },
    {
      ...base,
      id: "gestante-mariana",
      title: "Ensaio gestante",
      eventDate: daysFromNow(-2),
      clientName: "Mariana Lima",
      clients: [client("mariana", "Mariana Lima", "904417")],
      includedPhotos: 12,
      allowExtras: true,
      extraPrice: 30,
      deadline: daysFromNow(14),
      expiresAt: daysFromNow(90),
      message: "",
      status: "rascunho",
      createdAt: daysFromNow(-1),
      coverPhotoId: gestante[0].id,
      photos: gestante,
      design: design("rose", "lateral"),
    },
    {
      ...base,
      id: "aniversario-helena",
      title: "Aniversário de 1 ano",
      eventDate: daysFromNow(-200),
      clientName: "Helena",
      clients: [client("helena", "Família da Helena", "661204", aniversario.slice(0, 10).map((p) => p.id), { finalizedAt: daysFromNow(-190) })],
      includedPhotos: 10,
      allowExtras: false,
      extraPrice: 0,
      deadline: daysFromNow(-190),
      expiresAt: daysFromNow(-100),
      archived: true,
      message: "",
      status: "entregue",
      createdAt: daysFromNow(-199),
      sentAt: daysFromNow(-198),
      deliveredAt: daysFromNow(-180),
      coverPhotoId: aniversario[0].id,
      photos: aniversario,
      deliveryPhotos: aniversario.slice(0, 10),
      design: design("areia"),
    },
  ];
}
