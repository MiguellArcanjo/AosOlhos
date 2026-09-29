import type { Gallery, Photo } from "./types";

// Fotos de banco de imagens (picsum.photos) — nunca usar fotos reais de clientes nos testes.
function demoPhotos(prefix: string, count: number): Photo[] {
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
    };
  });
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function seedGalleries(): Gallery[] {
  const ensaio = demoPhotos("ensaio", 36);
  const casamento = demoPhotos("casamento", 48);
  const familia = demoPhotos("familia", 24);
  const gestante = demoPhotos("gestante", 18);

  return [
    {
      id: "ensaio-ana-e-pedro",
      title: "Ensaio pré-wedding",
      eventDate: daysFromNow(-12),
      clientName: "Ana e Pedro",
      clientEmail: "ana.pedro@example.com",
      accessCode: "482913",
      includedPhotos: 20,
      allowExtras: true,
      extraPrice: 25,
      deadline: daysFromNow(9),
      message: "Oi, Ana e Pedro! Que alegria entregar esse ensaio pra vocês. Escolham com carinho as 20 fotos do pacote 💛",
      status: "selecao",
      createdAt: daysFromNow(-10),
      sentAt: daysFromNow(-6),
      coverPhotoId: ensaio[4].id,
      photos: ensaio,
      favoriteIds: [ensaio[4].id, ensaio[9].id, ensaio[17].id, ensaio[22].id],
      selection: {
        photoIds: [ensaio[0].id, ensaio[4].id, ensaio[5].id, ensaio[9].id, ensaio[12].id, ensaio[17].id, ensaio[20].id],
        comments: { [ensaio[5].id]: "Dá pra clarear um pouco o fundo?" },
      },
      deliveryPhotos: [],
    },
    {
      id: "casamento-julia-e-rafa",
      title: "Casamento",
      eventDate: daysFromNow(-30),
      clientName: "Júlia e Rafael",
      clientEmail: "julia.rafa@example.com",
      accessCode: "730155",
      includedPhotos: 30,
      allowExtras: true,
      extraPrice: 20,
      deadline: daysFromNow(-5),
      message: "Foi uma honra registrar o dia de vocês!",
      status: "finalizada",
      createdAt: daysFromNow(-25),
      sentAt: daysFromNow(-20),
      finalizedAt: daysFromNow(-4),
      coverPhotoId: casamento[2].id,
      photos: casamento,
      favoriteIds: [casamento[2].id, casamento[11].id],
      selection: {
        photoIds: casamento.filter((_, i) => i % 3 === 0 || i === 2).map((p) => p.id).slice(0, 33),
        comments: {
          [casamento[0].id]: "Essa é pra capa do álbum!",
          [casamento[9].id]: "Tirar o copo da mesa, se possível",
        },
      },
      deliveryPhotos: [],
    },
    {
      id: "familia-souza",
      title: "Ensaio de família",
      eventDate: daysFromNow(-45),
      clientName: "Família Souza",
      clientEmail: "souza@example.com",
      accessCode: "115820",
      includedPhotos: 15,
      allowExtras: false,
      extraPrice: 0,
      deadline: daysFromNow(-30),
      message: "",
      status: "entregue",
      createdAt: daysFromNow(-44),
      sentAt: daysFromNow(-40),
      finalizedAt: daysFromNow(-35),
      deliveredAt: daysFromNow(-20),
      coverPhotoId: familia[1].id,
      photos: familia,
      favoriteIds: [],
      selection: { photoIds: familia.slice(0, 15).map((p) => p.id), comments: {} },
      deliveryPhotos: familia.slice(0, 15),
    },
    {
      id: "gestante-mariana",
      title: "Ensaio gestante",
      eventDate: daysFromNow(-2),
      clientName: "Mariana Lima",
      clientEmail: "mariana@example.com",
      accessCode: "904417",
      includedPhotos: 12,
      allowExtras: true,
      extraPrice: 30,
      deadline: daysFromNow(14),
      message: "",
      status: "rascunho",
      createdAt: daysFromNow(-1),
      coverPhotoId: gestante[0].id,
      photos: gestante,
      favoriteIds: [],
      selection: { photoIds: [], comments: {} },
      deliveryPhotos: [],
    },
  ];
}
