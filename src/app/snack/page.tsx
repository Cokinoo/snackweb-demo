"use client";

import Link from "next/link";
import Image from "next/image";
import { usePolling } from "@/hooks/usePolling";
import BandeauPause from "@/components/vitrine/BandeauPause";
import BandeauMessageJour from "@/components/vitrine/BandeauMessageJour";
import type { State, Plat } from "@/types";

const VERT = "#1D7A5F";
const JAUNE = "#F5A623";

const PLATS_VEDETTES: string[] = ["s1", "s3", "s6", "s8"];

const CATEGORIES = [
  { emoji: "🥖", label: "Sandwichs" },
  { emoji: "🥟", label: "Barquettes" },
  { emoji: "🌶️", label: "Pimentés" },
  { emoji: "🥤", label: "Boissons" },
];

export default function SnackVitrinePage() {
  const state = usePolling<State>("/api/state");

  const plats: Plat[] = state?.vitrines?.snack?.plats ?? [];
  const platsVedettes = PLATS_VEDETTES
    .map((id) => plats.find((p) => p.id === id))
    .filter((p): p is Plat => !!p);

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col max-w-[480px] mx-auto">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative h-[85vh] min-h-[520px] flex flex-col justify-end">

        {/* Photo de fond */}
        <Image
          src="https://picsum.photos/seed/snack-hero-food/480/700"
          alt="Chez Tatie Monique"
          fill
          className="object-cover"
          priority
        />

        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />

        {/* Bandeaux par-dessus overlay */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <BandeauMessageJour message={state?.messageJour ?? null} />
          <BandeauPause visible={state?.pause ?? false} />
        </div>

        {/* Badge statut ouverture */}
        <div className="absolute top-4 right-4 z-10">
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: state?.pause ? "#ef4444" : JAUNE,
              color: state?.pause ? "white" : "#111",
            }}
          >
            {state === null ? "…" : state.pause ? "FERMÉ" : "OUVERT"}
          </span>
        </div>

        {/* Contenu hero */}
        <div className="relative z-10 px-5 pb-8">
          {/* Badge catégorie */}
          <div
            className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 mb-4"
            style={{ backgroundColor: JAUNE, color: "#111" }}
          >
            Snack Péi — Saint-Pierre
          </div>

          {/* Titre massif */}
          <h1 className="text-4xl font-black text-white uppercase leading-none mb-2">
            Chez<br />Tatie<br />Monique
          </h1>

          {/* Slogan */}
          <p className="text-sm text-white/70 mb-6 font-medium">
            Le snack péi qu'on aime depuis toujours
          </p>

          {/* CTA principal */}
          {state?.pause ? (
            <button
              disabled
              className="w-full py-4 text-sm font-black uppercase tracking-widest text-white bg-zinc-600 cursor-not-allowed"
            >
              Commandes indisponibles
            </button>
          ) : (
            <Link
              href="/menu/snack"
              className="block w-full py-4 text-sm font-black uppercase tracking-widest text-center text-zinc-900"
              style={{ backgroundColor: JAUNE }}
            >
              Commander maintenant
            </Link>
          )}
        </div>
      </section>

      {/* ── CATÉGORIES ───────────────────────────────────────── */}
      <section className="bg-zinc-800 px-4 py-5">
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(({ emoji, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                {emoji}
              </div>
              <span className="text-xs text-zinc-400 font-medium text-center leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SÉPARATEUR ───────────────────────────────────────── */}
      <div className="flex items-center px-5 py-5 gap-3">
        <div className="flex-1 h-px bg-zinc-700" />
        <span
          className="text-xs font-black uppercase tracking-widest px-2"
          style={{ color: JAUNE }}
        >
          Nos spécialités
        </span>
        <div className="flex-1 h-px bg-zinc-700" />
      </div>

      {/* ── PLATS VEDETTES ───────────────────────────────────── */}
      <section className="px-4 pb-4 space-y-3">
        {platsVedettes.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-zinc-800 rounded animate-pulse" />
            ))
          : platsVedettes.map((plat) => (
              <PlatVedette key={plat.id} plat={plat} />
            ))}
      </section>

      {/* ── HORAIRES ─────────────────────────────────────────── */}
      <section className="px-4 pb-4 mt-2">
        <div
          className="rounded overflow-hidden border"
          style={{ borderColor: VERT + "60" }}
        >
          <div
            className="px-4 py-2.5 flex items-center gap-2"
            style={{ backgroundColor: VERT }}
          >
            <span className="text-sm font-black uppercase tracking-wider text-white">
              Horaires
            </span>
          </div>
          <div className="bg-zinc-800 divide-y divide-zinc-700">
            <HoraireLigne jour="Lun — Ven" heures="11h30 – 13h30" />
            <HoraireLigne jour="Sam — Dim" heures="Fermé" ferme />
          </div>
        </div>
      </section>

      {/* ── INFOS ────────────────────────────────────────────── */}
      <section className="px-4 pb-8">
        <div className="bg-zinc-800 rounded px-4 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-base">📍</span>
            <p className="text-sm text-zinc-300">Zone Artisanale, Saint-Pierre, La Réunion</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base">📞</span>
            <p className="text-sm text-zinc-300">0692 00 00 00</p>
          </div>
        </div>
      </section>

      {/* ── CTA STICKY ───────────────────────────────────────── */}
      <div className="sticky bottom-0 px-4 py-3 bg-zinc-900 border-t border-zinc-700">
        {state?.pause ? (
          <button
            disabled
            className="w-full py-4 text-sm font-black uppercase tracking-widest text-zinc-500 bg-zinc-800 cursor-not-allowed"
          >
            Commandes indisponibles
          </button>
        ) : (
          <Link
            href="/menu/snack"
            className="block w-full py-4 text-sm font-black uppercase tracking-widest text-center text-zinc-900"
            style={{ backgroundColor: JAUNE }}
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
    <div className="flex gap-0 bg-zinc-800 rounded overflow-hidden">
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
          <p className="text-sm font-bold text-white leading-tight">{plat.nom}</p>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-snug">
            {plat.description}
          </p>
        </div>
        <p className="text-sm font-black" style={{ color: "#F5A623" }}>
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
      <span className="text-sm text-zinc-300">{jour}</span>
      <span
        className={`text-sm font-bold ${ferme ? "text-zinc-500 italic" : "text-white"}`}
      >
        {heures}
      </span>
    </div>
  );
}
