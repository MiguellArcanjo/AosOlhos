export type GalleryStatus = "rascunho" | "selecao" | "finalizada" | "entregue";

export interface Photo {
  id: string;
  name: string;
  /** URL da imagem (remota ou data URL reduzida no navegador enquanto não há backend). */
  src: string;
  width: number;
  height: number;
}

export interface Selection {
  photoIds: string[];
  comments: Record<string, string>;
}

export interface Gallery {
  id: string;
  title: string;
  eventDate: string;
  clientName: string;
  clientEmail: string;
  accessCode: string;
  /** Quantidade de fotos inclusas no pacote. */
  includedPhotos: number;
  allowExtras: boolean;
  /** Preço por foto extra, em reais. */
  extraPrice: number;
  /** Data limite para a seleção (YYYY-MM-DD). */
  deadline: string;
  message: string;
  status: GalleryStatus;
  createdAt: string;
  sentAt?: string;
  finalizedAt?: string;
  deliveredAt?: string;
  coverPhotoId?: string;
  photos: Photo[];
  /** Fotos que a fotógrafa marcou como favoritas para sugerir ao cliente. */
  favoriteIds: string[];
  selection: Selection;
  deliveryPhotos: Photo[];
}

export type NewGallery = Pick<
  Gallery,
  | "title"
  | "eventDate"
  | "clientName"
  | "clientEmail"
  | "includedPhotos"
  | "allowExtras"
  | "extraPrice"
  | "deadline"
  | "message"
>;
