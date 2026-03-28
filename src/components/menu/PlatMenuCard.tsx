import Image from "next/image";
import type { Plat } from "@/types";

interface PlatMenuCardProps {
  plat: Plat;
  quantite: number;
  onAjouter: () => void;
  onRetirer: () => void;
  pause: boolean;
}

export default function PlatMenuCard({
  plat,
  quantite,
  onAjouter,
  onRetirer,
  pause,
}: PlatMenuCardProps) {
  if (!plat.disponible && plat.affichageSiRupture === "masquer") return null;

  const grised = !plat.disponible;

  return (
    <div className={`flex gap-3 bg-zinc-800 rounded-xl overflow-hidden ${grised ? "opacity-50" : ""}`}>
      {/* Photo */}
      <div className="relative w-24 h-24 shrink-0">
        <Image
          src={plat.photo ?? `https://picsum.photos/seed/${plat.id}/96/96`}
          alt={plat.nom}
          fill
          className={`object-cover ${grised ? "grayscale" : ""}`}
        />
        {grised && (
          <div className="absolute inset-0 flex items-end justify-center pb-1.5">
            <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">
              Rupture
            </span>
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 py-3 pr-3 flex flex-col justify-between min-w-0">
        <div>
          <p className={`text-sm font-bold leading-tight ${grised ? "line-through text-zinc-500" : "text-white"}`}>
            {plat.nom}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-snug">
            {plat.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-black text-[#F5A623]">
            {plat.prix.toFixed(2).replace(".", ",")} €
          </span>

          {!grised && !pause && (
            <div className="flex items-center gap-2">
              {quantite > 0 && (
                <>
                  <button
                    onClick={onRetirer}
                    className="w-7 h-7 rounded-full bg-zinc-700 text-white font-bold text-base flex items-center justify-center"
                    aria-label="Retirer"
                  >
                    −
                  </button>
                  <span className="text-sm font-bold text-white w-4 text-center">
                    {quantite}
                  </span>
                </>
              )}
              <button
                onClick={onAjouter}
                className="w-7 h-7 rounded-full font-bold text-base flex items-center justify-center"
                style={{ backgroundColor: "#F5A623", color: "#111" }}
                aria-label="Ajouter"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
