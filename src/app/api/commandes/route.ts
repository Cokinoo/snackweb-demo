import { NextRequest, NextResponse } from "next/server";
import { getState, setState, getNextCommandeNumero } from "@/store/state";
import type { ApiResponse, Commande, LigneCommande, TypeVitrine } from "@/types";

export const dynamic = "force-dynamic";

interface CommandeInput {
  vitrine: TypeVitrine;
  plats: LigneCommande[];
  creneau: string;
  whatsappPhone: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json() as CommandeInput;
    const { vitrine, plats, creneau, whatsappPhone } = body;

    if (!vitrine || !plats || !creneau || !whatsappPhone) {
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

    const commande: Commande = {
      id: crypto.randomUUID(),
      numero: getNextCommandeNumero(),
      vitrine,
      plats,
      montant: Math.round(montant * 100) / 100,
      creneau,
      statut: "nouvelle",
      createdAt: new Date().toISOString(),
      whatsappPhone,
    };

    setState((s) => ({ ...s, commandes: [commande, ...s.commandes] }));

    return NextResponse.json({ success: true, data: commande }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
