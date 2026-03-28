import type { Plat } from "@/types";

interface MenuPlatRowProps {
  plat: Plat;
  onToggle: (id: string, disponible: boolean) => void;
  onModeChange: (id: string, mode: "griser" | "masquer") => void;
  loading: boolean;
}

export default function MenuPlatRow({ plat, onToggle, onModeChange, loading }: MenuPlatRowProps) {
  return (
    <div className={`bg-zinc-800 rounded-xl px-4 py-3 ${!plat.disponible ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-3">
        {/* Infos plat */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-tight ${!plat.disponible ? "line-through text-zinc-500" : "text-white"}`}>
            {plat.nom}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{plat.prix.toFixed(2).replace(".", ",")} € · {plat.categorie}</p>
        </div>

        {/* Toggle disponible */}
        <button
          onClick={() => onToggle(plat.id, !plat.disponible)}
          disabled={loading}
          className={`relative w-12 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
            plat.disponible ? "bg-green-500" : "bg-zinc-600"
          }`}
          aria-label={plat.disponible ? "Désactiver" : "Activer"}
        >
          <span
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
          style={{ transform: `translateX(${plat.disponible ? "1.375rem" : "2px"})` }}
          />
        </button>
      </div>

      {/* Mode rupture (visible seulement si indisponible) */}
      {!plat.disponible && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onModeChange(plat.id, "griser")}
            disabled={loading}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              plat.affichageSiRupture === "griser"
                ? "bg-zinc-500 text-white"
                : "bg-zinc-700 text-zinc-400"
            }`}
          >
            Griser
          </button>
          <button
            onClick={() => onModeChange(plat.id, "masquer")}
            disabled={loading}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              plat.affichageSiRupture === "masquer"
                ? "bg-zinc-500 text-white"
                : "bg-zinc-700 text-zinc-400"
            }`}
          >
            Masquer
          </button>
        </div>
      )}
    </div>
  );
}
