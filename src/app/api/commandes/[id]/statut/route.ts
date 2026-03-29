import { NextRequest, NextResponse } from "next/server";
import { getState, setState, addWhatsappMessage, initializeFromKV, persistAll } from "@/store/state";
import type { ApiResponse, StatutCommande } from "@/types";

export const dynamic = "force-dynamic";

const TRANSITIONS_VALIDES: Record<StatutCommande, StatutCommande | null> = {
  nouvelle: "en_cours",
  en_cours: "prete",
  prete: "recuperee",
  recuperee: null,
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await initializeFromKV();

    const { id } = params;
    const body = await req.json() as { statut: StatutCommande };
    const { statut } = body;

    const state = getState();
    const commande = state.commandes.find((c) => c.id === id);

    if (!commande) {
      return NextResponse.json({ success: false, error: "Commande introuvable" }, { status: 404 });
    }

    const statutValide = TRANSITIONS_VALIDES[commande.statut];
    if (statutValide !== statut) {
      return NextResponse.json(
        { success: false, error: `Transition invalide: ${commande.statut} → ${statut}` },
        { status: 400 }
      );
    }

    setState((s) => ({
      ...s,
      commandes: s.commandes.map((c) =>
        c.id === id ? { ...c, statut } : c
      ),
    }));

    if (statut === "prete") {
      addWhatsappMessage({
        commandeId: id,
        telephone: commande.whatsappPhone,
        texte: `Votre commande ${commande.numero} est prête ! Venez la récupérer. 🎉`,
        direction: "envoi",
      });
    }

    await persistAll();

    return NextResponse.json({ success: true, data: { id, statut } });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
