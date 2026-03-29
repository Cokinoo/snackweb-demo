import Image from "next/image";
import type { Plat } from "@/types";

interface PlatMenuCardLightProps {
  plat: Plat;
  quantite: number;
  onAjouter: () => void;
  onRetirer: () => void;
  pause: boolean;
  accentColor: string;
}

export default function PlatMenuCardLight({
  plat,
  quantite,
  onAjouter,
  onRetirer,
  pause,
  accentColor,
}: PlatMenuCardLightProps) {
  if (!plat.disponible && plat.affichageSiRupture === "masquer") return null;

  const grised = !plat.disponible;

  return (
    <div
      className={`flex bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm ${
        grised ? "opacity-60" : ""
      }`}
    >
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

      <div className="flex-1 px-3 py-3 flex flex-col justify-between min-w-0">
        <div>
          <p
            className={`text-sm font-bold leading-tight ${
              grised ? "line-through text-stone-400" : "text-stone-800"
            }`}
          >
            {plat.nom}
          </p>
          <p className="text-xs text-stone-400 mt-0.5 line-clamp-2 leading-snug">
            {plat.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-black" style={{ color: accentColor }}>
            {plat.prix.toFixed(2).replace(".", ",")} €
          </span>

          {!grised && !pause && (
            <div className="flex items-center gap-2">
              {quantite > 0 && (
                <>
                  <button
                    onClick={onRetirer}
                    className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 text-stone-700 font-bold text-base flex items-center justify-center"
                    aria-label="Retirer"
                  >
                    −
                  </button>
                  <span className="text-sm font-bold text-stone-800 w-4 text-center">
                    {quantite}
                  </span>
                </>
              )}
              <button
                onClick={onAjouter}
                className="w-7 h-7 rounded-full font-bold text-base flex items-center justify-center text-white"
                style={{ backgroundColor: accentColor }}
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
