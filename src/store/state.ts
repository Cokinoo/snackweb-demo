import type { State, TypeVitrine, WhatsAppMessage, VitrineState } from "@/types";
import snackData from "@/data/snack.json";
import restaurantData from "@/data/restaurant.json";
import pizzeriaData from "@/data/pizzeria.json";
import foodtruckData from "@/data/foodtruck.json";
import { kv } from "@vercel/kv";

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

const KV_STATE   = "demo:state";
const KV_WA      = "demo:whatsapp";
const KV_COUNTER = "demo:counter";

const g = global as typeof globalThis & {
  _state?: State;
  _whatsappMessages?: WhatsAppMessage[];
  _commandeCounter?: number;
  _lastResetDate?: string;
  _kvInitialized?: boolean;
};

// Valeurs par défaut (écrasées par KV au premier appel de initializeFromKV)
if (!g._state)             g._state             = { ...initialState };
if (!g._whatsappMessages)  g._whatsappMessages  = [];
if (!g._commandeCounter)   g._commandeCounter   = 1;
if (!g._lastResetDate)     g._lastResetDate     = new Date().toDateString();

// ── KV helpers ───────────────────────────────────────────────

export async function initializeFromKV(): Promise<void> {
  if (g._kvInitialized) return;
  g._kvInitialized = true;
  try {
    const [state, messages, counter] = await Promise.all([
      kv.get<State>(KV_STATE),
      kv.get<WhatsAppMessage[]>(KV_WA),
      kv.get<number>(KV_COUNTER),
    ]);
    if (state   !== null && state   !== undefined) g._state            = state;
    if (messages !== null && messages !== undefined) g._whatsappMessages = messages;
    if (counter  !== null && counter  !== undefined) g._commandeCounter  = counter;
  } catch {
    // KV non disponible (dev local sans env vars) → on garde le state en mémoire
  }
}

export async function persistAll(): Promise<void> {
  try {
    await Promise.all([
      kv.set(KV_STATE,   g._state),
      kv.set(KV_WA,      g._whatsappMessages),
      kv.set(KV_COUNTER, g._commandeCounter),
    ]);
  } catch {
    // Silencieux — fallback mémoire seulement
  }
}

export async function resetAll(): Promise<void> {
  g._state            = { ...initialState };
  g._whatsappMessages = [];
  g._commandeCounter  = 1;
  g._lastResetDate    = new Date().toDateString();
  g._kvInitialized    = true; // éviter de recharger l'ancien state depuis KV
  await persistAll();
}

// ── Accesseurs synchrones ────────────────────────────────────

export function getState(): State {
  verifierExpirationMessageJour();
  verifierResetMinuit();
  return g._state!;
}

export function setState(updater: (s: State) => State): void {
  g._state = updater(g._state!);
}

export function getWhatsappMessages(): WhatsAppMessage[] {
  return g._whatsappMessages!;
}

export function addWhatsappMessage(msg: Omit<WhatsAppMessage, "id" | "createdAt">): void {
  g._whatsappMessages!.push({
    ...msg,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
}

export function getNextCommandeNumero(): string {
  const num = String(g._commandeCounter!).padStart(3, "0");
  g._commandeCounter!++;
  return `#${num}`;
}

// ── Vérifications automatiques ───────────────────────────────

function verifierExpirationMessageJour(): void {
  if (!g._state!.messageJour) return;
  const now = new Date();
  const expiration = new Date(g._state!.messageJour.expireA);
  if (now >= expiration) {
    g._state = { ...g._state!, messageJour: null };
  }
}

function verifierResetMinuit(): void {
  const today = new Date().toDateString();
  if (today === g._lastResetDate) return;
  g._lastResetDate = today;

  const vitrines = { ...g._state!.vitrines };
  for (const type of Object.keys(vitrines) as TypeVitrine[]) {
    const vitrine = vitrines[type];
    if (!vitrine.parametres.conserverPlats) {
      vitrines[type] = {
        ...vitrine,
        plats: vitrine.plats.map((p) => ({ ...p, disponible: true })),
      };
    }
  }
  g._state = { ...g._state!, vitrines };
}
