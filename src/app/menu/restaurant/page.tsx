"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePolling } from "@/hooks/usePolling";
import BandeauPause from "@/components/vitrine/BandeauPause";
import PlatMenuCardLight from "@/components/menu/PlatMenuCardLight";
import PanierBar from "@/components/menu/PanierBar";
import { isOuvert, getProchaineCouverture } from "@/lib/horaires";
import type { State, Plat } from "@/types";

const TERRACOTTA = "#C2410C";

type Vue = "menu" | "checkout";
type ModePaiement = "retrait" | "enligne" | "";

interface LigneCart {
  platId: string;
  nom: string;
  prix: number;
  quantite: number;
}

export interface PendingOrder {
  vitrine: string;
  plats: LigneCart[];
  creneau: string;
  telephone: string;
  modePaiement: ModePaiement;
  total: number;
}

export default function MenuRestaurantPage() {
  const router = useRouter();
  const state = usePolling<State>("/api/state");
  const [cart, setCart] = useState<LigneCart[]>([]);
  const [vue, setVue] = useState<Vue>("menu");
  const [creneaux, setCreneaux] = useState<string[]>([]);
  const [creneauChoisi, setCreneauChoisi] = useState<string>("");
  const [telephone, setTelephone] = useState("");
  const [modePaiement, setModePaiement] = useState<ModePaiement>("");
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const plats: Plat[] = state?.vitrines?.restaurant?.plats ?? [];
  const pause = state?.pause ?? false;
  const messageJour = state?.messageJour ?? null;
  const horaires = state?.vitrines?.restaurant?.parametres?.horaires ?? [];
  const ferme = state !== null && !isOuvert(horaires);
  const prochaineCouverture = ferme ? getProchaineCouverture(horaires) : null;
  const commandesBloquees = pause || ferme;

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
      const res = await fetch("/api/creneaux/restaurant");
      const json = await res.json() as { success: boolean; data: { creneaux: string[] } };
      if (json.success) {
        setCreneaux(json.data.creneaux);
        if (json.data.creneaux.length > 0) setCreneauChoisi(json.data.creneaux[0]);
      }
    } catch {
      setCreneaux([]);
    }
  }

  function confirmerCommande() {
    if (!creneauChoisi) { setErreur("Choisissez un créneau de retrait."); return; }
    if (telephone.replace(/\s/g, "").length < 10) { setErreur("Entrez un numéro WhatsApp valide (10 chiffres)."); return; }
    if (!modePaiement) { setErreur("Choisissez un mode de paiement."); return; }
    setErreur("");
    setShowModal(true);
  }

  function envoyerCommande() {
    setLoading(true);
    const pending: PendingOrder = {
      vitrine: "restaurant",
      plats: cart,
      creneau: creneauChoisi,
      telephone: telephone.replace(/\s/g, ""),
      modePaiement,
      total,
    };
    sessionStorage.setItem("pendingOrder", JSON.stringify(pending));
    const params = new URLSearchParams({
      telephone: pending.telephone,
      creneau: pending.creneau,
    });
    router.push(`/whatsapp?${params.toString()}`);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [vue]);

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
        showModal={showModal}
        onConfirmer={confirmerCommande}
        onEnvoyer={envoyerCommande}
        onFermerModal={() => setShowModal(false)}
        onRetour={() => setVue("menu")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col max-w-[480px] mx-auto pb-28">

      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-4 bg-white border-b border-stone-200">
        <Link href="/restaurant" className="text-stone-500 text-lg leading-none">←</Link>
        <div>
          <p className="text-xs uppercase tracking-widest font-bold" style={{ color: TERRACOTTA }}>Menu</p>
          <h1 className="text-base font-black text-stone-800 leading-tight">Le Quotidien Péi</h1>
        </div>
      </header>

      <BandeauPause visible={pause} />

      {/* Bandeau fermé */}
      {ferme && !pause && (
        <div className="bg-stone-800 text-white px-4 py-3 text-center">
          <p className="text-sm font-bold">Nous sommes actuellement fermés</p>
          {prochaineCouverture && (
            <p className="text-xs text-stone-300 mt-0.5">
              Prochaine ouverture : {prochaineCouverture}
            </p>
          )}
        </div>
      )}

      {/* Offre du jour */}
      {messageJour && (
        <div className="mx-4 mt-4 rounded-xl overflow-hidden border-2" style={{ borderColor: TERRACOTTA }}>
          <div className="px-3 py-1.5 flex items-center gap-2" style={{ backgroundColor: TERRACOTTA }}>
            <span className="text-xs font-black uppercase tracking-widest text-white">⭐ Offre du jour</span>
          </div>
          <div className="bg-white px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-800 leading-snug">{messageJour.texte}</p>
              <p className="text-sm font-black mt-1" style={{ color: TERRACOTTA }}>
                {messageJour.prix.toFixed(2).replace(".", ",")} €
              </p>
            </div>
            {!commandesBloquees && (
              <div className="flex items-center gap-2 shrink-0">
                {quantitePour("offre-du-jour") > 0 && (
                  <>
                    <button
                      onClick={() => retirer("offre-du-jour")}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold text-white"
                      style={{ backgroundColor: TERRACOTTA }}
                    >−</button>
                    <span className="text-sm font-black text-stone-800 w-4 text-center">
                      {quantitePour("offre-du-jour")}
                    </span>
                  </>
                )}
                <button
                  onClick={() => ajouter({ id: "offre-du-jour", nom: "Offre du jour", prix: messageJour.prix, disponible: true, description: messageJour.texte, categorie: "", affichageSiRupture: "griser" })}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: TERRACOTTA }}
                >+</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pills catégories */}
      {categories.size > 0 && (
        <div className="sticky top-[57px] z-20 bg-stone-50 border-b border-stone-200">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
            {Array.from(categories.keys()).map((cat) => (
              <button
                key={cat}
                onClick={() => scrollToCategorie(cat)}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap text-white"
                style={{ backgroundColor: TERRACOTTA }}
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
              <div key={i} className="h-24 bg-stone-200 rounded-xl animate-pulse" />
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
                className="text-xs font-black uppercase tracking-widest px-3 py-1 text-white"
                style={{ backgroundColor: TERRACOTTA }}
              >
                {categorie}
              </span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            <div className="space-y-3">
              {platsDeCat.map((plat) => (
                <PlatMenuCardLight
                  key={plat.id}
                  plat={plat}
                  quantite={quantitePour(plat.id)}
                  onAjouter={() => ajouter(plat)}
                  onRetirer={() => retirer(plat.id)}
                  pause={commandesBloquees}
                  accentColor={TERRACOTTA}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {!commandesBloquees && (
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
  showModal: boolean;
  onCreneauChange: (c: string) => void;
  onTelephoneChange: (t: string) => void;
  onModePaiementChange: (m: ModePaiement) => void;
  onConfirmer: () => void;
  onEnvoyer: () => void;
  onFermerModal: () => void;
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
  showModal,
  onCreneauChange,
  onTelephoneChange,
  onModePaiementChange,
  onConfirmer,
  onEnvoyer,
  onFermerModal,
  onRetour,
}: VueCheckoutProps) {
  const whatsappRef = useRef<HTMLElement>(null);

  function selectionnerCreneau(c: string) {
    onCreneauChange(c);
    setTimeout(() => {
      whatsappRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col max-w-[480px] mx-auto">

      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-4 bg-white border-b border-stone-200">
        <button onClick={onRetour} className="text-stone-500 text-lg leading-none">←</button>
        <h1 className="text-base font-black text-stone-800">Votre commande</h1>
      </header>

      <div className="flex-1 px-4 pt-5 pb-36 space-y-6">

        {/* Récapitulatif */}
        <section>
          <SectionLabel>Récapitulatif</SectionLabel>
          <div className="bg-white rounded-xl overflow-hidden border border-stone-200 divide-y divide-stone-100">
            {cart.map((ligne) => (
              <div key={ligne.platId} className="flex justify-between items-center px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-stone-800">{ligne.nom}</p>
                  <p className="text-xs text-stone-400">× {ligne.quantite}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: TERRACOTTA }}>
                  {(ligne.prix * ligne.quantite).toFixed(2).replace(".", ",")} €
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 bg-stone-100">
              <span className="text-sm font-black text-stone-700 uppercase tracking-wide">Total</span>
              <span className="text-base font-black" style={{ color: TERRACOTTA }}>
                {total.toFixed(2).replace(".", ",")} €
              </span>
            </div>
          </div>
        </section>

        {/* Créneau */}
        <section>
          <SectionLabel>Créneau de retrait</SectionLabel>
          {creneaux.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 px-4 py-4 text-center">
              <p className="text-sm text-stone-400 italic">Aucun créneau disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {creneaux.map((c, i) => (
                <button
                  key={c}
                  onClick={() => selectionnerCreneau(c)}
                  className="py-3 px-2 rounded-xl text-xs font-bold transition-colors leading-tight border"
                  style={
                    creneauChoisi === c
                      ? { backgroundColor: TERRACOTTA, color: "#fff", borderColor: TERRACOTTA }
                      : { backgroundColor: "#fff", color: "#78716c", borderColor: "#e7e5e4" }
                  }
                >
                  {i === 0 ? "Au plus tôt" : c}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* WhatsApp */}
        <section ref={whatsappRef}>
          <SectionLabel>Numéro WhatsApp</SectionLabel>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="flex items-center px-4 py-3 gap-3">
              <span className="text-lg">📱</span>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => onTelephoneChange(e.target.value)}
                placeholder="0692 00 00 00"
                className="flex-1 bg-transparent text-stone-800 text-sm font-medium placeholder-stone-400 outline-none"
                maxLength={14}
              />
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-2 px-1">
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
                  ? { borderColor: TERRACOTTA, backgroundColor: "#FFF7ED" }
                  : { borderColor: "#e7e5e4", backgroundColor: "#fff" }
              }
            >
              <span className="text-2xl">🏪</span>
              <span className="text-xs font-black text-stone-700 uppercase tracking-wide text-center leading-tight">
                Payer au retrait
              </span>
              <span className="text-[10px] text-stone-400">Espèces ou CB</span>
            </button>

            <button
              onClick={() => onModePaiementChange("enligne")}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-colors"
              style={
                modePaiement === "enligne"
                  ? { borderColor: TERRACOTTA, backgroundColor: "#FFF7ED" }
                  : { borderColor: "#e7e5e4", backgroundColor: "#fff" }
              }
            >
              <span className="text-2xl">💳</span>
              <span className="text-xs font-black text-stone-700 uppercase tracking-wide text-center leading-tight">
                Payer en ligne
              </span>
              <span className="text-[10px] text-stone-400">Carte bancaire</span>
            </button>
          </div>
        </section>

        {erreur && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600 font-medium">{erreur}</p>
          </div>
        )}

      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 py-3 bg-white border-t border-stone-200 z-40">
        <button
          onClick={onConfirmer}
          disabled={loading || creneaux.length === 0}
          className="w-full py-4 font-black text-sm uppercase tracking-widest text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: TERRACOTTA }}
        >
          {loading ? "Envoi en cours…" : "Valider ma commande →"}
        </button>
      </div>

      {/* Modal confirmation WhatsApp */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 max-w-[480px] mx-auto">
          <div className="w-full bg-white rounded-t-2xl px-5 pt-6 pb-8 border-t border-stone-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📲</span>
              <h2 className="text-base font-black text-stone-800 leading-tight">
                Confirmation par WhatsApp
              </h2>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Pour finaliser votre commande, vous allez être redirigé vers{" "}
              <span className="font-bold text-stone-800">WhatsApp</span>.
              Un message pré-rempli sera prêt à envoyer — il suffit d&apos;appuyer sur{" "}
              <span className="font-bold text-stone-800">Envoyer</span>.
            </p>
            <div className="bg-stone-50 rounded-xl border border-stone-200 px-4 py-3 mb-5 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Créneau</span>
                <span className="font-bold text-stone-800">{creneauChoisi}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Total</span>
                <span className="font-bold" style={{ color: TERRACOTTA }}>
                  {total.toFixed(2).replace(".", ",")} €
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Paiement</span>
                <span className="font-bold text-stone-800">
                  {modePaiement === "enligne" ? "En ligne" : "Au retrait"}
                </span>
              </div>
            </div>
            <button
              onClick={onEnvoyer}
              disabled={loading}
              className="w-full py-4 font-black text-sm uppercase tracking-widest text-white mb-3 disabled:opacity-50"
              style={{ backgroundColor: TERRACOTTA }}
            >
              {loading ? "Redirection…" : "Continuer vers WhatsApp →"}
            </button>
            <button
              onClick={onFermerModal}
              className="w-full py-3 text-sm font-bold text-stone-400"
            >
              Modifier ma commande
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="text-xs font-black uppercase tracking-widest px-3 py-1 text-white"
        style={{ backgroundColor: TERRACOTTA }}
      >
        {children}
      </span>
      <div className="flex-1 h-px bg-stone-200" />
    </div>
  );
}
