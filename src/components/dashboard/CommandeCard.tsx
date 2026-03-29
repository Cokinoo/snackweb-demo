import type { Commande, StatutCommande } from "@/types";

const VITRINE_LABELS: Record<string, string> = {
  snack: "Snack",
  restaurant: "Restaurant",
  pizzeria: "Pizzeria",
  foodtruck: "Food Truck",
};

const STATUT_STYLES: Record<StatutCommande, { bg: string; text: string; label: string }> = {
  nouvelle:   { bg: "#F5A62320", text: "#F5A623", label: "Nouvelle" },
  en_cours:   { bg: "#3b82f620", text: "#60a5fa", label: "En cours" },
  prete:      { bg: "#22c55e20", text: "#4ade80", label: "Prête" },
  recuperee:  { bg: "#71717a20", text: "#a1a1aa", label: "Récupérée" },
};

const ACTIONS: Partial<Record<StatutCommande, { label: string; next: StatutCommande; style: string }>> = {
  en_cours:  { label: "Marquer prête ✓",   next: "prete",     style: "bg-green-600 text-white" },
  prete:     { label: "Récupérée ✓",       next: "recuperee", style: "bg-zinc-600 text-white" },
};

interface CommandeCardProps {
  commande: Commande;
  onStatutChange: (id: string, statut: StatutCommande) => void;
  onRelance: (id: string) => void;
  loading: boolean;
  loadingRelance: boolean;
}

export default function CommandeCard({ commande, onStatutChange, onRelance, loading, loadingRelance }: CommandeCardProps) {
  const statutStyle = STATUT_STYLES[commande.statut];
  const action = ACTIONS[commande.statut];

  return (
    <div className="bg-zinc-800 rounded-xl overflow-hidden">
      {/* Header card */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-700">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-[#F5A623]">{commande.numero}</span>
          <span className="text-xs text-zinc-400">·</span>
          <span className="text-sm font-bold text-white">{commande.creneau}</span>
          <span className="text-xs text-zinc-400">·</span>
          <span className="text-xs text-zinc-400">{VITRINE_LABELS[commande.vitrine] ?? commande.vitrine}</span>
        </div>
        <span
          className="text-sm font-black tracking-widest px-2 py-0.5 rounded"
          style={{ backgroundColor: "#1D7A5F20", color: "#4ade80", fontFamily: "monospace" }}
        >
          {commande.codeAntiFraude}
        </span>
        <span
          className="text-xs font-bold px-2 py-1 rounded-full"
          style={{ backgroundColor: statutStyle.bg, color: statutStyle.text }}
        >
          {statutStyle.label}
        </span>
      </div>

      {/* Plats */}
      <div className="px-4 py-3 space-y-1.5">
        {commande.plats.map((ligne) => (
          <div key={ligne.platId} className="flex justify-between items-baseline">
            <span className="text-sm text-zinc-200">
              <span className="text-zinc-400 mr-1">×{ligne.quantite}</span>
              {ligne.nom}
            </span>
            <span className="text-sm font-semibold text-zinc-300 ml-2 shrink-0">
              {(ligne.prix * ligne.quantite).toFixed(2).replace(".", ",")} €
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3 gap-3">
        <div className="flex flex-col gap-0.5">
          <div>
            <span className="text-xs text-zinc-500">Total : </span>
            <span className="text-sm font-black text-[#F5A623]">
              {commande.montant.toFixed(2).replace(".", ",")} €
            </span>
          </div>
          <span className="text-xs text-zinc-400">
            {commande.modePaiement === "enligne" ? "💳 Paiement en ligne" : "🏪 Paiement au retrait"}
          </span>
        </div>
        <div className="flex gap-2">
          {commande.statut === "prete" && (
            <button
              onClick={() => onRelance(commande.id)}
              disabled={loadingRelance}
              className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide disabled:opacity-50 bg-amber-600 text-white"
            >
              {loadingRelance ? "…" : "⏰ Relancer"}
            </button>
          )}
          {action && (
            <button
              onClick={() => onStatutChange(commande.id, action.next)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide disabled:opacity-50 ${action.style}`}
            >
              {loading ? "…" : action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
