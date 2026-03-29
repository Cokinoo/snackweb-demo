import { NextRequest, NextResponse } from "next/server";
import { getState, setState, getNextCommandeNumero, initializeFromKV, persistAll } from "@/store/state";
import type { ApiResponse, Commande, LigneCommande, TypeVitrine, ModePaiement } from "@/types";

export const dynamic = "force-dynamic";

interface CommandeInput {
  vitrine: TypeVitrine;
  plats: LigneCommande[];
  creneau: string;
  whatsappPhone: string;
  modePaiement: ModePaiement;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await initializeFromKV();

    const body = await req.json() as CommandeInput;
    const { vitrine, plats, creneau, whatsappPhone, modePaiement } = body;

    if (!vitrine || !plats || !creneau || !whatsappPhone || !modePaiement) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 });
    }

    const state = getState();

    if (state.pause) {
      return NextResponse.json(
        { success: false, error: "Les commandes sont en pause" },
        { status: 503 }
      );
    }

    if (!["snack", "restaurant", "pizzeria", "foodtruck"].includes(vitrine)) {
      return NextResponse.json({ success: false, error: "Vitrine invalide" }, { status: 400 });
    }

    if (!Array.isArray(plats) || plats.length === 0) {
      return NextResponse.json({ success: false, error: "Panier vide" }, { status: 400 });
    }

    const montant = plats.reduce((sum, l) => sum + l.prix * l.quantite, 0);

    const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const codeAntiFraude = "#" + Array.from({ length: 4 }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join("");

    const commande: Commande = {
      id: crypto.randomUUID(),
      numero: getNextCommandeNumero(),
      codeAntiFraude,
      vitrine,
      plats,
      montant: Math.round(montant * 100) / 100,
      creneau,
      modePaiement,
      statut: "en_cours",
      createdAt: new Date().toISOString(),
      whatsappPhone,
    };

    setState((s) => ({ ...s, commandes: [commande, ...s.commandes] }));
    await persistAll();

    return NextResponse.json({ success: true, data: commande }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
