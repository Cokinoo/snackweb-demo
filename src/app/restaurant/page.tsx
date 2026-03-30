"use client";

import BandeauMessageJour from "@/components/vitrine/BandeauMessageJour";
import BandeauPause from "@/components/vitrine/BandeauPause";
import { usePolling } from "@/hooks/usePolling";
import { groupHoraires, isOuvert } from "@/lib/horaires";
import type { Plat, State } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const TERRACOTTA = "#C2410C";

const PLATS_VEDETTES: string[] = ["resto-002", "resto-005", "resto-006"];

export default function RestaurantVitrinePage() {
  const state = usePolling<State>("/api/state");
  const heroCTARef = useRef<HTMLDivElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const el = heroCTARef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const horaires = state?.vitrines?.restaurant?.parametres?.horaires ?? [];
  const ouvert =
    state !== null && isOuvert(horaires) && !(state?.pause ?? false);
  const lignesHoraires = groupHoraires(horaires);

  const plats: Plat[] = state?.vitrines?.restaurant?.plats ?? [];
  const platsVedettes = PLATS_VEDETTES.map((id) =>
    plats.find((p) => p.id === id),
  ).filter((p): p is Plat => !!p);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col max-w-[480px] mx-auto">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative h-[55vh] min-h-[340px] flex flex-col justify-end">
        <Image
          src="/images/restaurant-hero.png"
          alt="Le Quotidien Péi"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute top-0 left-0 right-0 z-10">
          <BandeauPause visible={state?.pause ?? false} />
        </div>

        <div className="absolute top-4 right-4 z-10">
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: ouvert ? "#fff" : "#ef4444",
              color: ouvert ? TERRACOTTA : "#fff",
            }}
          >
            {state === null ? "…" : ouvert ? "OUVERT" : "FERMÉ"}
          </span>
        </div>

        <div className="relative z-10 px-5 pb-7">
          <div
            className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 mb-3"
            style={{ backgroundColor: TERRACOTTA, color: "#fff" }}
          >
            Restaurant Péi — Saint-Denis
          </div>
          <h1 className="text-3xl font-black text-white uppercase leading-tight mb-1">
            Le Quotidien Péi
          </h1>
          <p className="text-sm text-white/70 mb-5">
            Cuisine créole du jour, barquettes à emporter
          </p>

          <div ref={heroCTARef}>
            {state?.pause ? (
              <button
                disabled
                className="w-full py-4 text-sm font-black uppercase tracking-widest text-white/50 bg-white/10 cursor-not-allowed"
              >
                Commandes indisponibles
              </button>
            ) : (
              <Link
                href="/menu/restaurant"
                className="block w-full py-4 text-sm font-black uppercase tracking-widest text-center text-white"
                style={{ backgroundColor: TERRACOTTA }}
              >
                Voir le menu & commander
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── MESSAGE DU JOUR ──────────────────────────────────── */}
      <BandeauMessageJour message={state?.messageJour ?? null} />

      {/* ── INFOS RAPIDES ────────────────────────────────────── */}
      <section className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl mb-1">🕐</p>
            <p className="text-xs font-bold text-stone-700">Mar – Sam</p>
            <p className="text-[11px] text-stone-400">12h – 14h</p>
          </div>
          <div>
            <p className="text-xl mb-1">📦</p>
            <p className="text-xs font-bold text-stone-700">À emporter</p>
            <p className="text-[11px] text-stone-400">Barquettes</p>
          </div>
          <div>
            <p className="text-xl mb-1">📱</p>
            <p className="text-xs font-bold text-stone-700">Commande</p>
            <p className="text-[11px] text-stone-400">En ligne</p>
          </div>
        </div>
      </section>

      {/* ── SÉPARATEUR ───────────────────────────────────────── */}
      <div className="flex items-center px-5 py-5 gap-3">
        <div className="flex-1 h-px bg-stone-200" />
        <span
          className="text-xs font-black uppercase tracking-widest px-2"
          style={{ color: TERRACOTTA }}
        >
          Nos spécialités
        </span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      {/* ── PLATS VEDETTES ───────────────────────────────────── */}
      <section className="px-4 pb-4 space-y-3">
        {platsVedettes.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-stone-200 rounded-xl animate-pulse"
              />
            ))
          : platsVedettes.map((plat) => (
              <PlatVedette key={plat.id} plat={plat} />
            ))}
      </section>

      {/* ── HORAIRES ─────────────────────────────────────────── */}
      <section className="px-4 pb-4 mt-2">
        <div className="rounded-xl overflow-hidden border border-stone-200">
          <div className="px-4 py-2.5" style={{ backgroundColor: TERRACOTTA }}>
            <span className="text-sm font-black uppercase tracking-wider text-white">
              Horaires
            </span>
          </div>
          <div className="bg-white divide-y divide-stone-100">
            {lignesHoraires.map((l) => (
              <HoraireLigne
                key={l.jours}
                jour={l.jours}
                heures={l.ferme ? "Fermé" : l.plages}
                ferme={l.ferme}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── INFOS CONTACT ────────────────────────────────────── */}
      <section className="px-4 pb-10">
        <div className="bg-white rounded-xl border border-stone-200 px-4 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-base">📍</span>
            <p className="text-sm text-stone-600">
              12 rue de la Paix, Saint-Denis, La Réunion
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base">📞</span>
            <p className="text-sm text-stone-600">0262 00 00 00</p>
          </div>
        </div>
      </section>

      {/* ── CTA STICKY ───────────────────────────────────────── */}
      <div
        className={`sticky bottom-0 px-4 py-3 bg-white border-t border-stone-200 transition-opacity duration-200 ${
          stickyVisible
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {state?.pause ? (
          <button
            disabled
            className="w-full py-4 text-sm font-black uppercase tracking-widest text-stone-400 bg-stone-100 cursor-not-allowed"
          >
            Commandes indisponibles
          </button>
        ) : (
          <Link
            href="/menu/restaurant"
            className="block w-full py-4 text-sm font-black uppercase tracking-widest text-center text-white"
            style={{ backgroundColor: TERRACOTTA }}
          >
            Commander →
          </Link>
        )}
      </div>
    </div>
  );
}

function PlatVedette({ plat }: { plat: Plat }) {
  return (
    <div className="flex bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm">
      <div className="relative w-24 h-24 shrink-0">
        <Image
          src={plat.photo ?? `https://picsum.photos/seed/${plat.id}/96/96`}
          alt={plat.nom}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 px-3 py-3 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-sm font-bold text-stone-800 leading-tight">
            {plat.nom}
          </p>
          <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-snug">
            {plat.description}
          </p>
        </div>
        <p className="text-sm font-black" style={{ color: TERRACOTTA }}>
          {plat.prix.toFixed(2).replace(".", ",")} €
        </p>
      </div>
    </div>
  );
}

function HoraireLigne({
  jour,
  heures,
  ferme = false,
}: {
  jour: string;
  heures: string;
  ferme?: boolean;
}) {
  return (
    <div className="flex justify-between items-center px-4 py-3">
      <span className="text-sm text-stone-600">{jour}</span>
      <span
        className={`text-sm font-bold ${ferme ? "text-stone-400 italic" : "text-stone-800"}`}
      >
        {heures}
      </span>
    </div>
  );
}
