import type { Horaire } from "@/types";
import { getNowReunion } from "@/lib/timezone";

const JOURS_ORDER = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

const JOURS_DISPLAY = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
const JOURS_COURT: Record<string, string> = {
  lun: "Lun", mar: "Mar", mer: "Mer", jeu: "Jeu",
  ven: "Ven", sam: "Sam", dim: "Dim",
};

export interface LigneHoraire {
  jours: string;
  plages: string;
  ferme: boolean;
}

export function groupHoraires(horaires: Horaire[]): LigneHoraire[] {
  const byDay = JOURS_DISPLAY.map((jour) => {
    const entries = horaires
      .filter((h) => h.jour === jour)
      .sort((a, b) => parseHeure(a.ouverture) - parseHeure(b.ouverture));
    const plages = entries.map((h) => `${h.ouverture} – ${h.fermeture}`).join("  •  ");
    return { jour, plages };
  });

  const result: LigneHoraire[] = [];
  let i = 0;
  while (i < byDay.length) {
    const sig = byDay[i].plages;
    let j = i + 1;
    while (j < byDay.length && byDay[j].plages === sig) j++;
    const debut = JOURS_COURT[byDay[i].jour];
    const fin = JOURS_COURT[byDay[j - 1].jour];
    result.push({
      jours: j - 1 === i ? debut : `${debut} – ${fin}`,
      plages: sig,
      ferme: sig === "",
    });
    i = j;
  }
  return result;
}

const JOURS_LABELS: Record<string, string> = {
  lun: "lundi",
  mar: "mardi",
  mer: "mercredi",
  jeu: "jeudi",
  ven: "vendredi",
  sam: "samedi",
  dim: "dimanche",
};

function parseHeure(heure: string): number {
  const match = heure.match(/^(\d+)h(\d+)$/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

export function isOuvert(horaires: Horaire[]): boolean {
  const { jourIndex, minutesActuelles } = getNowReunion();
  const jourActuel = JOURS_ORDER[jourIndex];

  return horaires.some(
    (h) =>
      h.jour === jourActuel &&
      minutesActuelles >= parseHeure(h.ouverture) &&
      minutesActuelles < parseHeure(h.fermeture)
  );
}

export function getProchaineCouverture(horaires: Horaire[]): string | null {
  const { jourIndex, minutesActuelles } = getNowReunion();

  for (let offset = 0; offset < 7; offset++) {
    const dayIndex = (jourIndex + offset) % 7;
    const jourKey = JOURS_ORDER[dayIndex];

    const horairesJour = horaires
      .filter((h) => h.jour === jourKey)
      .sort((a, b) => parseHeure(a.ouverture) - parseHeure(b.ouverture));

    for (const h of horairesJour) {
      const ouverture = parseHeure(h.ouverture);
      if (offset === 0 && ouverture <= minutesActuelles) continue;

      const label =
        offset === 0 ? "aujourd'hui" : offset === 1 ? "demain" : JOURS_LABELS[jourKey];
      return `${label} à ${h.ouverture}`;
    }
  }

  return null;
}
