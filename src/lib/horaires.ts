import type { Horaire } from "@/types";

const JOURS_ORDER = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

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
  const now = new Date();
  const jourActuel = JOURS_ORDER[now.getDay()];
  const minutesActuelles = now.getHours() * 60 + now.getMinutes();

  return horaires.some(
    (h) =>
      h.jour === jourActuel &&
      minutesActuelles >= parseHeure(h.ouverture) &&
      minutesActuelles < parseHeure(h.fermeture)
  );
}

export function getProchaineCouverture(horaires: Horaire[]): string | null {
  const now = new Date();
  const jourIndex = now.getDay();
  const minutesActuelles = now.getHours() * 60 + now.getMinutes();

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
