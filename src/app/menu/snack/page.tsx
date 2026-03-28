"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePolling } from "@/hooks/usePolling";
import BandeauPause from "@/components/vitrine/BandeauPause";
import PlatMenuCard from "@/components/menu/PlatMenuCard";
import PanierBar from "@/components/menu/PanierBar";
import type { State, Plat, LigneCommande } from "@/types";

const VERT = "#1D7A5F";
const JAUNE = "#F5A623";

type Vue = "menu" | "checkout" | "succes";
type ModePaiement = "retrait" | "enligne" | "";

interface LigneCart {
  platId: string;
  nom: string;
  prix: number;
  quantite: number;
}

interface CommandeConfirmee {
  id: string;
  numero: string;
  creneau: string;
  telephone: string;
  modePaiement: ModePaiement;
}

export default function MenuSnackPage() {
  const state = usePolling<State>("/api/state");
  const [cart, setCart] = useState<LigneCart[]>([]);
  const [vue, setVue] = useState<Vue>("menu");
  const [creneaux, setCreneaux] = useState<string[]>([]);
  const [creneauChoisi, setCreneauChoisi] = useState<string>("");
  const [telephone, setTelephone] = useState("");
  const [modePaiement, setModePaiement] = useState<ModePaiement>("");
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);
  const [commande, setCommande] = useState<CommandeConfirmee | null>(null);

  const plats: Plat[] = state?.vitrines?.snack?.plats ?? [];
  const pause = state?.pause ?? false;

  const categories = useMemo(() => {
    const map = new Map<string, Plat[]>();
    for (const plat of plats) {
      if (!plat.disponible && plat.affichageSiRupture === "masquer") continue;
      const liste = map.get(plat.categorie) ?? [];
      liste.push(plat);
      map.set(plat.categorie, liste);
    }
    return map;
  }, [plats]);

  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  function scrollToCategorie(cat: string) {
    const el = sectionRefs.current.get(cat);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const nbArticles = cart.reduce((s, l) => s + l.quantite, 0);
  const total = cart.reduce((s, l) => s + l.prix * l.quantite, 0);

  function ajouter(plat: Plat) {
    setCart((prev) => {
      const existing = prev.find((l) => l.platId === plat.id);
      if (existing) {
        return prev.map((l) =>
          l.platId === plat.id ? { ...l, quantite: l.quantite + 1 } : l
        );
      }
      return [...prev, { platId: plat.id, nom: plat.nom, prix: plat.prix, quantite: 1 }];
    });
  }

  function retirer(platId: string) {
    setCart((prev) =>
      prev
        .map((l) => (l.platId === platId ? { ...l, quantite: l.quantite - 1 } : l))
        .filter((l) => l.quantite > 0)
    );
  }

  function quantitePour(platId: string) {
    return cart.find((l) => l.platId === platId)?.quantite ?? 0;
  }

  async function ouvrirCheckout() {
    setErreur("");
    setCreneauChoisi("");
    setModePaiement("");
    setVue("checkout");
    try {
      const res = await fetch("/api/creneaux/snack");
      const json = await res.json() as { success: boolean; data: { creneaux: string[] } };
      if (json.success) {
        setCreneaux(json.data.creneaux);
        if (json.data.creneaux.length > 0) setCreneauChoisi(json.data.creneaux[0]);
      }
    } catch {
      setCreneaux([]);
    }
  }

  async function confirmerCommande() {
    if (!creneauChoisi) {
      setErreur("Choisissez un créneau de retrait.");
      return;
    }
    if (telephone.replace(/\s/g, "").length < 10) {
      setErreur("Entrez un numéro WhatsApp valide (10 chiffres).");
      return;
    }
    if (!modePaiement) {
      setErreur("Choisissez un mode de paiement.");
      return;
    }

    setErreur("");
    setLoading(true);

    const lignes: LigneCommande[] = cart.map((l) => ({
      platId: l.platId,
      nom: l.nom,
      quantite: l.quantite,
      prix: l.prix,
    }));

    try {
      const res = await fetch("/api/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vitrine: "snack",
          plats: lignes,
          creneau: creneauChoisi,
          whatsappPhone: telephone.replace(/\s/g, ""),
        }),
      });
      const json = await res.json() as { success: boolean; data: { id: string; numero: string; creneau: string } };
      if (json.success) {
        setCommande({
          id: json.data.id,
          numero: json.data.numero,
          creneau: json.data.creneau,
          telephone: telephone.replace(/\s/g, ""),
          modePaiement,
        });
        setCart([]);
        setVue("succes");
      } else {
        setErreur("Erreur lors de la commande. Réessayez.");
      }
    } catch {
      setErreur("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [vue]);

  if (vue === "succes" && commande) {
    return <VueSucces commande={commande} />;
  }

  if (vue === "checkout") {
    return (
      <VueCheckout
        cart={cart}
        total={total}
        creneaux={creneaux}
        creneauChoisi={creneauChoisi}
        telephone={telephone}
        modePaiement={modePaiement}
        erreur={erreur}
        loading={loading}
        onCreneauChange={setCreneauChoisi}
        onTelephoneChange={setTelephone}
        onModePaiementChange={setModePaiement}
        onConfirmer={confirmerCommande}
        onRetour={() => setVue("menu")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col max-w-[480px] mx-auto pb-28">

      {/* Header */}
      <header style={{ backgroundColor: VERT }} className="sticky top-0 z-30 flex items-center gap-3 px-4 py-4">
        <Link href="/snack" className="text-white/80 text-lg leading-none">←</Link>
        <div>
          <p className="text-xs text-white/60 uppercase tracking-widest font-bold">Menu</p>
          <h1 className="text-base font-black text-white leading-tight">Chez Tatie Monique</h1>
        </div>
      </header>

      <BandeauPause visible={pause} />

      {/* Pills catégories */}
      {categories.size > 0 && (
        <div className="sticky top-[56px] z-20 bg-zinc-900 border-b border-zinc-800">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
            {Array.from(categories.keys()).map((cat) => (
              <button
                key={cat}
                onClick={() => scrollToCategorie(cat)}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                style={{ backgroundColor: JAUNE, color: "#111" }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu par catégorie */}
      <main className="flex-1 px-4 pt-5 space-y-8">
        {categories.size === 0 && (
          <div className="space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        )}

        {Array.from(categories.entries()).map(([categorie, platsDeCat]) => (
          <section
            key={categorie}
            ref={(el) => { if (el) sectionRefs.current.set(categorie, el); }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-xs font-black uppercase tracking-widest px-3 py-1"
                style={{ backgroundColor: JAUNE, color: "#111" }}
              >
                {categorie}
              </span>
              <div className="flex-1 h-px bg-zinc-700" />
            </div>

            <div className="space-y-3">
              {platsDeCat.map((plat) => (
                <PlatMenuCard
                  key={plat.id}
                  plat={plat}
                  quantite={quantitePour(plat.id)}
                  onAjouter={() => ajouter(plat)}
                  onRetirer={() => retirer(plat.id)}
                  pause={pause}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {!pause && (
        <PanierBar nbArticles={nbArticles} total={total} onOuvrir={ouvrirCheckout} />
      )}
    </div>
  );
}

/* ── Vue Checkout ──────────────────────────────────────────── */

interface VueCheckoutProps {
  cart: LigneCart[];
  total: number;
  creneaux: string[];
  creneauChoisi: string;
  telephone: string;
  modePaiement: ModePaiement;
  erreur: string;
  loading: boolean;
  onCreneauChange: (c: string) => void;
  onTelephoneChange: (t: string) => void;
  onModePaiementChange: (m: ModePaiement) => void;
  onConfirmer: () => void;
  onRetour: () => void;
}

function VueCheckout({
  cart,
  total,
  creneaux,
  creneauChoisi,
  telephone,
  modePaiement,
  erreur,
  loading,
  onCreneauChange,
  onTelephoneChange,
  onModePaiementChange,
  onConfirmer,
  onRetour,
}: VueCheckoutProps) {
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col max-w-[480px] mx-auto">

      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-4"
        style={{ backgroundColor: "#1D7A5F" }}
      >
        <button onClick={onRetour} className="text-white/80 text-lg leading-none">←</button>
        <h1 className="text-base font-black text-white">Votre commande</h1>
      </header>

      <div className="flex-1 px-4 pt-5 pb-36 space-y-6">

        {/* Récapitulatif */}
        <section>
          <SectionLabel>Récapitulatif</SectionLabel>
          <div className="bg-zinc-800 rounded overflow-hidden divide-y divide-zinc-700">
            {cart.map((ligne) => (
              <div key={ligne.platId} className="flex justify-between items-center px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">{ligne.nom}</p>
                  <p className="text-xs text-zinc-400">× {ligne.quantite}</p>
                </div>
                <span className="text-sm font-bold text-[#F5A623]">
                  {(ligne.prix * ligne.quantite).toFixed(2).replace(".", ",")} €
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 bg-zinc-700">
              <span className="text-sm font-black text-white uppercase tracking-wide">Total</span>
              <span className="text-base font-black text-[#F5A623]">
                {total.toFixed(2).replace(".", ",")} €
              </span>
            </div>
          </div>
        </section>

        {/* Créneau */}
        <section>
          <SectionLabel>Créneau de retrait</SectionLabel>
          {creneaux.length === 0 ? (
            <div className="bg-zinc-800 rounded px-4 py-4 text-center">
              <p className="text-sm text-zinc-400 italic">Aucun créneau disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {creneaux.map((c, i) => (
                <button
                  key={c}
                  onClick={() => onCreneauChange(c)}
                  className="py-3 px-2 rounded text-xs font-bold transition-colors leading-tight"
                  style={
                    creneauChoisi === c
                      ? { backgroundColor: "#F5A623", color: "#111" }
                      : { backgroundColor: "#27272a", color: "#a1a1aa" }
                  }
                >
                  {i === 0 ? "Au plus tôt" : c}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* WhatsApp */}
        <section>
          <SectionLabel>Numéro WhatsApp</SectionLabel>
          <div className="bg-zinc-800 rounded overflow-hidden">
            <div className="flex items-center px-4 py-3 gap-3">
              <span className="text-lg">📱</span>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => onTelephoneChange(e.target.value)}
                placeholder="0692 00 00 00"
                className="flex-1 bg-transparent text-white text-sm font-medium placeholder-zinc-500 outline-none"
                maxLength={14}
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2 px-1">
            Vous recevrez un message quand votre commande sera prête.
          </p>
        </section>

        {/* Mode de paiement */}
        <section>
          <SectionLabel>Paiement</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onModePaiementChange("retrait")}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-colors"
              style={
                modePaiement === "retrait"
                  ? { borderColor: "#F5A623", backgroundColor: "#F5A62318" }
                  : { borderColor: "#3f3f46", backgroundColor: "#27272a" }
              }
            >
              <span className="text-2xl">🏪</span>
              <span className="text-xs font-black text-white uppercase tracking-wide text-center leading-tight">
                Payer au retrait
              </span>
              <span className="text-[10px] text-zinc-400">Espèces ou CB</span>
            </button>

            <button
              onClick={() => onModePaiementChange("enligne")}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-colors"
              style={
                modePaiement === "enligne"
                  ? { borderColor: "#F5A623", backgroundColor: "#F5A62318" }
                  : { borderColor: "#3f3f46", backgroundColor: "#27272a" }
              }
            >
              <span className="text-2xl">💳</span>
              <span className="text-xs font-black text-white uppercase tracking-wide text-center leading-tight">
                Payer en ligne
              </span>
              <span className="text-[10px] text-zinc-400">Carte bancaire</span>
            </button>
          </div>
        </section>

        {/* Erreur */}
        {erreur && (
          <div className="bg-red-900/50 border border-red-700 rounded px-4 py-3">
            <p className="text-sm text-red-300 font-medium">{erreur}</p>
          </div>
        )}

      </div>

      {/* CTA sticky */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 py-3 bg-zinc-900 border-t border-zinc-700 z-40">
        <button
          onClick={onConfirmer}
          disabled={loading || creneaux.length === 0}
          className="w-full py-4 font-black text-sm uppercase tracking-widest text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#F5A623" }}
        >
          {loading ? "Envoi en cours…" : "Valider ma commande →"}
        </button>
      </div>

    </div>
  );
}

/* ── Vue Succès ────────────────────────────────────────────── */

function VueSucces({ commande }: { commande: CommandeConfirmee }) {
  const router = useRouter();

  function envoyerWhatsapp() {
    const params = new URLSearchParams({
      texte: `Bonjour, ${commande.numero} OK`,
      commandeId: commande.id,
      telephone: commande.telephone,
    });
    router.push(`/whatsapp?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col max-w-[480px] mx-auto">

      {/* Header */}
      <header
        className="flex items-center justify-center px-4 py-5"
        style={{ backgroundColor: "#1D7A5F" }}
      >
        <div className="text-center">
          <div className="text-3xl mb-1">✓</div>
          <p className="text-white font-black text-base uppercase tracking-widest">
            Commande enregistrée
          </p>
        </div>
      </header>

      <div className="flex-1 px-4 pt-5 pb-8 space-y-5">

        {/* Récap commande */}
        <div className="bg-zinc-800 rounded divide-y divide-zinc-700">
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-zinc-400">Numéro</span>
            <span className="text-lg font-black text-[#F5A623]">{commande.numero}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-zinc-400">Créneau</span>
            <span className="text-sm font-bold text-white">{commande.creneau}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-zinc-400">Paiement</span>
            <span className="text-sm font-bold text-white">
              {commande.modePaiement === "enligne" ? "💳 En ligne" : "🏪 Au retrait"}
            </span>
          </div>
        </div>

        {/* Étape obligatoire WhatsApp */}
        <div className="bg-zinc-800 rounded-xl overflow-hidden border-2" style={{ borderColor: "#25D366" }}>
          <div className="px-4 py-3" style={{ backgroundColor: "#25D36618" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">💬</span>
              <p className="text-sm font-black text-white uppercase tracking-wide">
                Étape obligatoire
              </p>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Confirmez votre commande en envoyant ce message au restaurant.
              Vous recevrez une notification quand elle sera prête.
            </p>
          </div>

          {/* Aperçu du message */}
          <div className="bg-zinc-900 mx-3 my-3 rounded-lg px-4 py-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Message pré-rempli</p>
            <p className="text-sm font-mono text-white">Bonjour, {commande.numero} OK</p>
          </div>

          <div className="px-4 pb-4">
            <button
              onClick={envoyerWhatsapp}
              className="flex items-center justify-center gap-3 w-full py-4 font-black text-sm uppercase tracking-widest text-white rounded-lg"
              style={{ backgroundColor: "#25D366" }}
            >
              <span className="text-xl leading-none">💬</span>
              Envoyer sur WhatsApp
            </button>
          </div>
        </div>

        {/* Lien retour discret */}
        <p className="text-center text-xs text-zinc-600">
          <Link href="/snack" className="underline underline-offset-2">
            Retour à la vitrine
          </Link>
        </p>

      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="text-xs font-black uppercase tracking-widest px-3 py-1"
        style={{ backgroundColor: "#F5A623", color: "#111" }}
      >
        {children}
      </span>
      <div className="flex-1 h-px bg-zinc-700" />
    </div>
  );
}
