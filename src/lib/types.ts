export type GalleryStatus = "rascunho" | "selecao" | "finalizada" | "entregue";

export interface Photo {
  id: string;
  name: string;
  /** URL da imagem (remota ou data URL reduzida no navegador enquanto não há backend). */
  src: string;
  width: number;
  height: number;
  /** Pasta (momento) a que a foto pertence; sem pasta quando indefinido. */
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
}

export interface Selection {
  photoIds: string[];
  comments: Record<string, string>;
}

/** Pessoa com acesso à galeria. Cada uma tem o próprio código e a própria seleção. */
export interface GalleryClient {
  id: string;
  name: string;
  email: string;
  accessCode: string;
  selection: Selection;
  finalizedAt?: string;
}

export type ColorTheme = "areia" | "branco" | "noite" | "oliva" | "rose";
export type FontStyle = "classica" | "moderna";
export type CoverLayout = "centro" | "lateral" | "minimal";

export interface GalleryDesign {
  theme: ColorTheme;
  font: FontStyle;
  cover: CoverLayout;
}

export interface Gallery {
  id: string;
  title: string;
  eventDate: string;
  /** Nome exibido na capa (ex.: "Ana e Pedro", "Formatura 3º ano"). */
  clientName: string;
  clients: GalleryClient[];
  /** Quantidade de fotos inclusas no pacote (por cliente). */
  includedPhotos: number;
  allowExtras: boolean;
  /** Preço por foto extra, em reais. */
  extraPrice: number;
  /** Data limite para a seleção (YYYY-MM-DD). */
  deadline: string;
  /** Depois desta data (YYYY-MM-DD) o cliente não acessa mais a galeria. */
  expiresAt?: string;
  archived: boolean;
  message: string;
  status: GalleryStatus;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  coverPhotoId?: string;
  folders: Folder[];
  photos: Photo[];
  /** Fotos que a fotógrafa marcou como favoritas para sugerir ao cliente. */
  favoriteIds: string[];
  deliveryPhotos: Photo[];
  design: GalleryDesign;
  /** Marca d'água gravada nas fotos de seleção. */
  watermark: boolean;
  /** Cliente pode compartilhar as fotos entregues (WhatsApp, Instagram…). */
  allowShare: boolean;
}

export type WatermarkPosition = "centro" | "mosaico" | "canto";

export interface StudioSettings {
  name: string;
  /** Logo em data URL (PNG com fundo transparente fica melhor). */
  logo?: string;
  watermark: {
    kind: "texto" | "logo";
    text: string;
    position: WatermarkPosition;
    /** 0 a 1 */
    opacity: number;
    /** Tamanho relativo à largura da foto, 0 a 1. */
    size: number;
  };
}

export type GalleryFields = Pick<
  Gallery,
  | "title"
  | "eventDate"
  | "clientName"
  | "includedPhotos"
  | "allowExtras"
  | "extraPrice"
  | "deadline"
  | "expiresAt"
  | "message"
  | "design"
  | "watermark"
  | "allowShare"
>;

export type NewGallery = GalleryFields & { clientEmail: string };
