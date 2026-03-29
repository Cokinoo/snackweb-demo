import { NextRequest, NextResponse } from "next/server";
import { getState, initializeFromKV } from "@/store/state";
import type { ApiResponse, TypeVitrine } from "@/types";

export const dynamic = "force-dynamic";

const VITRINES_VALIDES: TypeVitrine[] = ["snack", "restaurant", "pizzeria", "foodtruck"];

function parseHeure(heure: string): number {
  const match = heure.match(/^(\d+)h(\d+)$/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function formatHeure(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await initializeFromKV();

    const type = params.type as TypeVitrine;

    if (!VITRINES_VALIDES.includes(type)) {
      return NextResponse.json({ success: false, error: "Vitrine invalide" }, { status: 400 });
    }

    const state = getState();
    const vitrine = state.vitrines[type];
    const { intervalle, dureeService, capaciteParLot } = vitrine.creneaux;

    const maintenant = new Date();
    const joursMap: Record<number, string> = {
      0: "dim", 1: "lun", 2: "mar", 3: "mer", 4: "jeu", 5: "ven", 6: "sam",
    };
    const jourActuel = joursMap[maintenant.getDay()];
    const minutesActuelles = maintenant.getHours() * 60 + maintenant.getMinutes();

    const horairesAujourdhui = vitrine.parametres.horaires.filter(
      (h) => h.jour === jourActuel
    );

    const creneauxDispos: string[] = [];

    for (const horaire of horairesAujourdhui) {
      const debut = parseHeure(horaire.ouverture);
      let fin = parseHeure(horaire.fermeture);
      if (fin < debut) fin += 24 * 60;
      const debutEffectif = Math.max(debut, minutesActuelles + 10);

      for (let t = debut; t + dureeService <= fin; t += intervalle) {
        if (t < debutEffectif) continue;
        if (t >= 24 * 60) continue;

        const creneau = formatHeure(t);
        const commandesDansCreneau = state.commandes.filter(
          (c) =>
            c.vitrine === type &&
            c.creneau === creneau &&
            c.statut !== "recuperee"
        ).length;

        if (commandesDansCreneau < capaciteParLot) {
          creneauxDispos.push(creneau);
        } else {
          const suivant = formatHeure(t + intervalle);
          if (!creneauxDispos.includes(suivant)) {
            creneauxDispos.push(suivant);
          }
        }
      }
    }

    const unique = Array.from(new Set(creneauxDispos)).sort(
      (a, b) => parseHeure(a) - parseHeure(b)
    );
    return NextResponse.json({ success: true, data: { creneaux: unique } });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
