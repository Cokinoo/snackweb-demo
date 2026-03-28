import type { State, TypeVitrine, WhatsAppMessage, VitrineState } from "@/types";
import snackData from "@/data/snack.json";
import restaurantData from "@/data/restaurant.json";
import pizzeriaData from "@/data/pizzeria.json";
import foodtruckData from "@/data/foodtruck.json";

function buildVitrineState(data: typeof snackData): VitrineState {
  return {
    plats: data.plats as VitrineState["plats"],
    creneaux: data.creneaux,
    parametres: data.parametres as VitrineState["parametres"],
  };
}

const initialState: State = {
  commandes: [],
  pause: false,
  messageJour: null,
  retardMinutes: 0,
  vitrines: {
    snack: buildVitrineState(snackData),
    restaurant: buildVitrineState(restaurantData),
    pizzeria: buildVitrineState(pizzeriaData),
    foodtruck: buildVitrineState(foodtruckData),
  },
};

let state: State = { ...initialState };
let whatsappMessages: WhatsAppMessage[] = [];
let commandeCounter = 1;

export function getState(): State {
  verifierExpirationMessageJour();
  verifierResetMinuit();
  return state;
}

export function setState(updater: (s: State) => State): void {
  state = updater(state);
}

export function getWhatsappMessages(): WhatsAppMessage[] {
  return whatsappMessages;
}

export function addWhatsappMessage(msg: Omit<WhatsAppMessage, "id" | "createdAt">): void {
  whatsappMessages.push({
    ...msg,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
}

export function getNextCommandeNumero(): string {
  const num = String(commandeCounter).padStart(3, "0");
  commandeCounter++;
  return `#${num}`;
}

function verifierExpirationMessageJour(): void {
  if (!state.messageJour) return;
  const now = new Date();
  const expiration = new Date(state.messageJour.expireA);
  if (now >= expiration) {
    state = { ...state, messageJour: null };
  }
}

let lastResetDate: string = new Date().toDateString();

function verifierResetMinuit(): void {
  const today = new Date().toDateString();
  if (today === lastResetDate) return;
  lastResetDate = today;

  const vitrines = { ...state.vitrines };
  for (const type of Object.keys(vitrines) as TypeVitrine[]) {
    const vitrine = vitrines[type];
    if (!vitrine.parametres.conserverPlats) {
      vitrines[type] = {
        ...vitrine,
        plats: vitrine.plats.map((p) => ({ ...p, disponible: true })),
      };
    }
  }
  state = { ...state, vitrines };
}
