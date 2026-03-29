const TZ = "Indian/Reunion";

const JOURS_MAP: Record<string, number> = {
  dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6,
};

export function getNowReunion(): { jourIndex: number; minutesActuelles: number; dateString: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const jourShort = get("weekday").slice(0, 3).toLowerCase();
  const jourIndex = JOURS_MAP[jourShort] ?? 0;
  const minutesActuelles = parseInt(get("hour")) * 60 + parseInt(get("minute"));
  const dateString = `${get("year")}-${get("month")}-${get("day")}`;

  return { jourIndex, minutesActuelles, dateString };
}

export function getMinuitReunion(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  // Minuit = fin du jour en cours (23h59m59s en heure Réunion)
  // On calcule l'offset UTC+4 = -240 minutes
  const year = parseInt(get("year"));
  const month = parseInt(get("month")) - 1;
  const day = parseInt(get("day"));

  // 23:59:59 heure Réunion = UTC+4, soit -4h en UTC
  const minuitReunion = new Date(Date.UTC(year, month, day, 19, 59, 59, 999));
  return minuitReunion.toISOString();
}
