export type StatutCommande = "nouvelle" | "en_cours" | "prete" | "recuperee";

export type TypeVitrine = "snack" | "restaurant" | "pizzeria" | "foodtruck";

export type AffichageSiRupture = "griser" | "masquer";

export type JourSemaine =
  | "lun"
  | "mar"
  | "mer"
  | "jeu"
  | "ven"
  | "sam"
  | "dim";

export type Service = "midi" | "soir";

export interface LigneCommande {
  platId: string;
  nom: string;
  quantite: number;
  prix: number;
}

export interface Commande {
  id: string;
  numero: string;
  vitrine: TypeVitrine;
  plats: LigneCommande[];
  montant: number;
  creneau: string;
  statut: StatutCommande;
  createdAt: string;
  whatsappPhone: string;
}

export interface Plat {
  id: string;
  nom: string;
  description: string;
  prix: number;
  categorie: string;
  photo?: string;
  disponible: boolean;
  affichageSiRupture: AffichageSiRupture;
}

export interface Creneaux {
  intervalle: number;
  dureeService: number;
  capaciteParLot: number;
}

export interface Horaire {
  jour: JourSemaine;
  ouverture: string;
  fermeture: string;
  service: Service;
}

export interface Parametres {
  conserverPlats: boolean;
  horaires: Horaire[];
}

export interface VitrineState {
  plats: Plat[];
  creneaux: Creneaux;
  parametres: Parametres;
}

export interface MessageJour {
  texte: string;
  photo?: string;
  expireA: string;
}

export interface State {
  commandes: Commande[];
  pause: boolean;
  messageJour: MessageJour | null;
  retardMinutes: number;
  vitrines: Record<TypeVitrine, VitrineState>;
}

export interface WhatsAppMessage {
  id: string;
  commandeId: string;
  telephone: string;
  texte: string;
  direction: "envoi" | "reception";
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
