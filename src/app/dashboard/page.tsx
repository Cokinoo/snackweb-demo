"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePolling } from "@/hooks/usePolling";
import CommandeCard from "@/components/dashboard/CommandeCard";
import MenuPlatRow from "@/components/dashboard/MenuPlatRow";
import type { State, StatutCommande, Plat } from "@/types";

type Onglet = "commandes" | "menu" | "reglages";
type SousOnglet = StatutCommande;

const SOUS_ONGLETS: { key: SousOnglet; label: string }[] = [
  { key: "nouvelle",  label: "Nouvelles" },
  { key: "en_cours",  label: "En cours" },
  { key: "prete",     label: "Prêtes" },
  { key: "recuperee", label: "Récupérées" },
];

export default function DashboardPage() {
  const state = usePolling<State>("/api/state");
  const [onglet, setOnglet] = useState<Onglet>("commandes");
  const [sousOnglet, setSousOnglet] = useState<SousOnglet>("nouvelle");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [messageTexte, setMessageTexte] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);

  const commandes = state?.commandes ?? [];
  const plats = state?.vitrines?.snack?.plats ?? [];
  const pause = state?.pause ?? false;
  const messageJour = state?.messageJour ?? null;

  const commandesFiltrees = useMemo(
    () => commandes.filter((c) => c.statut === sousOnglet),
    [commandes, sousOnglet]
  );

  const badges: Record<SousOnglet, number> = useMemo(() => ({
    nouvelle:  commandes.filter((c) => c.statut === "nouvelle").length,
    en_cours:  commandes.filter((c) => c.statut === "en_cours").length,
    prete:     commandes.filter((c) => c.statut === "prete").length,
    recuperee: commandes.filter((c) => c.statut === "recuperee").length,
  }), [commandes]);

  async function changerStatut(id: string, statut: StatutCommande) {
    setLoadingId(id);
    try {
      await fetch(`/api/commandes/${id}/statut`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
    } finally {
      setLoadingId(null);
    }
  }

  async function togglePause() {
    setLoadingAction("pause");
    try {
      await fetch("/api/pause", { method: "POST" });
    } finally {
      setLoadingAction(null);
    }
  }

  async function ajouterRetard() {
    setLoadingAction("retard");
    try {
      await fetch("/api/retard", { method: "POST" });
    } finally {
      setLoadingAction(null);
    }
  }

  async function publierMessage() {
    if (!messageTexte.trim()) return;
    setMessageLoading(true);
    try {
      await fetch("/api/message-du-jour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publier", texte: messageTexte.trim() }),
      });
      setMessageTexte("");
    } finally {
      setMessageLoading(false);
    }
  }

  async function supprimerMessage() {
    setMessageLoading(true);
    try {
      await fetch("/api/message-du-jour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "supprimer" }),
      });
    } finally {
      setMessageLoading(false);
    }
  }

  async function togglePlat(id: string, disponible: boolean) {
    setLoadingId(id);
    try {
      await fetch("/api/menu/snack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: disponible ? "activer" : "desactiver" }),
      });
    } finally {
      setLoadingId(null);
    }
  }

  async function changerModeRupture(id: string, mode: "griser" | "masquer") {
    setLoadingId(id);
    const plat = plats.find((p) => p.id === id);
    if (!plat) return;
    try {
      await fetch("/api/menu/snack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...plat, affichageSiRupture: mode }),
      });
    } finally {
      setLoadingId(null);
    }
  }

  const categoriesMenu = useMemo(() => {
    const map = new Map<string, Plat[]>();
    for (const plat of plats) {
      const liste = map.get(plat.categorie) ?? [];
      liste.push(plat);
      map.set(plat.categorie, liste);
    }
    return map;
  }, [plats]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col max-w-[480px] mx-auto">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="bg-zinc-900 px-4 pt-4 pb-3 border-b border-zinc-800 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Dashboard</p>
            <h1 className="text-base font-black text-white leading-tight">Chez Tatie Monique</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Bouton +10 min */}
            {onglet === "commandes" && (
              <button
                onClick={ajouterRetard}
                disabled={loadingAction === "retard"}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-700 rounded-lg text-xs font-bold text-zinc-200 disabled:opacity-50"
              >
                🕐 +10 min
              </button>
            )}
            {/* Lien WhatsApp */}
            <Link
              href="/whatsapp"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-700 text-lg"
            >
              💬
            </Link>
          </div>
        </div>

        {/* Bandeau pause */}
        {pause && (
          <div className="mt-2 bg-red-600 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-white text-xs font-black uppercase tracking-wide flex-1">
              ⚠️ Commandes en pause
            </span>
            <button
              onClick={togglePause}
              className="text-white text-xs font-bold underline underline-offset-2"
            >
              Réactiver
            </button>
          </div>
        )}
      </header>

      {/* ── CONTENU ────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-20">

        {/* === ONGLET COMMANDES === */}
        {onglet === "commandes" && (
          <div>
            {/* Sous-onglets statuts */}
            <div className="flex overflow-x-auto scrollbar-none border-b border-zinc-800 bg-zinc-900 sticky top-[var(--header-h,72px)] z-20">
              {SOUS_ONGLETS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSousOnglet(key)}
                  className={`shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors relative whitespace-nowrap ${
                    sousOnglet === key ? "text-[#F5A623]" : "text-zinc-500"
                  }`}
                >
                  {label}
                  {badges[key] > 0 && (
                    <span
                      className="ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: sousOnglet === key ? "#F5A623" : "#3f3f46",
                        color: sousOnglet === key ? "#111" : "#a1a1aa",
                      }}
                    >
                      {badges[key]}
                    </span>
                  )}
                  {sousOnglet === key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F5A623]" />
                  )}
                </button>
              ))}
            </div>

            {/* Liste commandes */}
            <div className="px-4 py-4 space-y-3">
              {commandesFiltrees.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-600 text-sm">Aucune commande {
                    sousOnglet === "nouvelle" ? "nouvelle" :
                    sousOnglet === "en_cours" ? "en cours" :
                    sousOnglet === "prete" ? "prête" : "récupérée"
                  }</p>
                </div>
              ) : (
                commandesFiltrees.map((commande) => (
                  <CommandeCard
                    key={commande.id}
                    commande={commande}
                    onStatutChange={changerStatut}
                    loading={loadingId === commande.id}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* === ONGLET MENU === */}
        {onglet === "menu" && (
          <div className="px-4 py-4 space-y-6">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Snack — Disponibilité des plats</p>
            {Array.from(categoriesMenu.entries()).map(([categorie, platsCat]) => (
              <section key={categorie}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-[#F5A623] text-zinc-900">
                    {categorie}
                  </span>
                  <div className="flex-1 h-px bg-zinc-700" />
                </div>
                <div className="space-y-2">
                  {platsCat.map((plat) => (
                    <MenuPlatRow
                      key={plat.id}
                      plat={plat}
                      onToggle={togglePlat}
                      onModeChange={changerModeRupture}
                      loading={loadingId === plat.id}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* === ONGLET RÉGLAGES === */}
        {onglet === "reglages" && (
          <div className="px-4 py-4 space-y-6">

            {/* Pause */}
            <section>
              <SectionLabel>Commandes en ligne</SectionLabel>
              <div className="bg-zinc-800 rounded-xl px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {pause ? "Commandes désactivées" : "Commandes actives"}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {pause
                        ? "Les clients ne peuvent pas commander en ligne."
                        : "Les clients peuvent passer commande."}
                    </p>
                  </div>
                  <button
                    onClick={togglePause}
                    disabled={loadingAction === "pause"}
                    className={`relative w-14 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
                      !pause ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    <span
                      className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform"
                      style={{ transform: `translateX(${!pause ? "1.75rem" : "2px"})` }}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Retard */}
            <section>
              <SectionLabel>Retard commandes</SectionLabel>
              <div className="bg-zinc-800 rounded-xl px-4 py-4">
                <p className="text-xs text-zinc-400 mb-3">
                  Décale de +10 min toutes les commandes en cours (nouvelle + en cours).
                </p>
                <button
                  onClick={ajouterRetard}
                  disabled={loadingAction === "retard"}
                  className="w-full py-3 bg-zinc-700 rounded-lg text-sm font-black text-white uppercase tracking-wide disabled:opacity-50"
                >
                  {loadingAction === "retard" ? "…" : "🕐 Ajouter +10 min"}
                </button>
              </div>
            </section>

            {/* Message du jour */}
            <section>
              <SectionLabel>Message du jour</SectionLabel>
              <div className="bg-zinc-800 rounded-xl overflow-hidden">
                {messageJour ? (
                  <div className="px-4 py-4">
                    <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Actif jusqu&apos;à minuit</p>
                    <p className="text-sm text-white leading-relaxed mb-4">{messageJour.texte}</p>
                    <button
                      onClick={supprimerMessage}
                      disabled={messageLoading}
                      className="w-full py-3 bg-red-900/60 border border-red-700 rounded-lg text-sm font-bold text-red-300 disabled:opacity-50"
                    >
                      Supprimer le message
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-4 space-y-3">
                    <p className="text-xs text-zinc-400">
                      Affiché en bandeau sur la vitrine jusqu&apos;à minuit.
                    </p>
                    <textarea
                      value={messageTexte}
                      onChange={(e) => setMessageTexte(e.target.value)}
                      placeholder="Ex : Aujourd'hui menu spécial cabri massalé !"
                      rows={3}
                      className="w-full bg-zinc-700 rounded-lg px-3 py-3 text-sm text-white placeholder-zinc-500 outline-none resize-none"
                    />
                    <button
                      onClick={publierMessage}
                      disabled={messageLoading || !messageTexte.trim()}
                      className="w-full py-3 rounded-lg text-sm font-black text-zinc-900 uppercase tracking-wide disabled:opacity-50"
                      style={{ backgroundColor: "#F5A623" }}
                    >
                      {messageLoading ? "Envoi…" : "Publier le message"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Liens */}
            <section>
              <SectionLabel>Simulation</SectionLabel>
              <div className="space-y-2">
                <Link
                  href="/whatsapp"
                  className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💬</span>
                    <div>
                      <p className="text-sm font-bold text-white">Interface WhatsApp</p>
                      <p className="text-xs text-zinc-400">Messages clients simulés</p>
                    </div>
                  </div>
                  <span className="text-zinc-500">→</span>
                </Link>
                <Link
                  href="/ticket"
                  className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🧾</span>
                    <div>
                      <p className="text-sm font-bold text-white">Ticket thermique</p>
                      <p className="text-xs text-zinc-400">Format impression 80mm</p>
                    </div>
                  </div>
                  <span className="text-zinc-500">→</span>
                </Link>
              </div>
            </section>

          </div>
        )}

      </main>

      {/* ── BOTTOM NAV ─────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-zinc-900 border-t border-zinc-800 z-40">
        <div className="grid grid-cols-3">
          <NavBtn
            active={onglet === "commandes"}
            onClick={() => setOnglet("commandes")}
            icon="📋"
            label="Commandes"
            badge={badges.nouvelle + badges.en_cours}
          />
          <NavBtn
            active={onglet === "menu"}
            onClick={() => setOnglet("menu")}
            icon="🍽️"
            label="Menu"
          />
          <NavBtn
            active={onglet === "reglages"}
            onClick={() => setOnglet("reglages")}
            icon="⚙️"
            label="Réglages"
          />
        </div>
      </nav>

    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────── */

function NavBtn({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 transition-colors relative ${
        active ? "text-[#F5A623]" : "text-zinc-500"
      }`}
    >
      <span className="text-xl leading-none relative">
        {icon}
        {badge && badge > 0 ? (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      {active && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-[#F5A623]" />}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-[#F5A623] text-zinc-900">
        {children}
      </span>
      <div className="flex-1 h-px bg-zinc-700" />
    </div>
  );
}
