import { NextResponse } from "next/server";
import { getState, setState, addWhatsappMessage, initializeFromKV, persistAll } from "@/store/state";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

function ajouterMinutes(creneau: string, minutes: number): string {
  const match = creneau.match(/^(\d+)h(\d+)$/);
  if (!match) return creneau;
  const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]) + minutes;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    await initializeFromKV();

    const state = getState();
    const commandesConcernees = state.commandes.filter(
      (c) => c.statut === "nouvelle" || c.statut === "en_cours"
    );

    setState((s) => ({
      ...s,
      retardMinutes: s.retardMinutes + 10,
      commandes: s.commandes.map((c) => {
        if (c.statut !== "nouvelle" && c.statut !== "en_cours") return c;
        const nouveauCreneau = ajouterMinutes(c.creneau, 10);
        return { ...c, creneau: nouveauCreneau };
      }),
    }));

    for (const commande of commandesConcernees) {
      const nouveauCreneau = ajouterMinutes(commande.creneau, 10);
      addWhatsappMessage({
        commandeId: commande.id,
        telephone: commande.whatsappPhone,
        texte: `Commande ${commande.numero} : léger retard, nouveau créneau ${nouveauCreneau}. Merci de votre patience ! 🙏`,
        direction: "envoi",
      });
    }

    await persistAll();

    return NextResponse.json({
      success: true,
      data: { commandesConcernees: commandesConcernees.length },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
