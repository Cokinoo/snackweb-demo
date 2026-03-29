import { NextRequest, NextResponse } from "next/server";
import { getState, addWhatsappMessage, initializeFromKV, persistAll } from "@/store/state";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await initializeFromKV();

    const { id } = params;
    const state = getState();
    const commande = state.commandes.find((c) => c.id === id);

    if (!commande) {
      return NextResponse.json({ success: false, error: "Commande introuvable" }, { status: 404 });
    }

    if (commande.statut !== "prete") {
      return NextResponse.json({ success: false, error: "Commande non prête" }, { status: 400 });
    }

    addWhatsappMessage({
      commandeId: id,
      telephone: commande.whatsappPhone,
      texte: `⏰ Rappel : votre commande ${commande.numero} est prête au comptoir !\nCode de retrait : ${commande.codeAntiFraude}\nNous vous attendons 😊`,
      direction: "envoi",
    });

    await persistAll();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
