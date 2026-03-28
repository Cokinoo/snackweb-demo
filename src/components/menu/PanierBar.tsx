interface PanierBarProps {
  nbArticles: number;
  total: number;
  onOuvrir: () => void;
}

export default function PanierBar({ nbArticles, total, onOuvrir }: PanierBarProps) {
  if (nbArticles === 0) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 py-3 bg-zinc-900 border-t border-zinc-700 z-40">
      <button
        onClick={onOuvrir}
        className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest text-zinc-900 flex items-center justify-between px-5"
        style={{ backgroundColor: "#F5A623" }}
      >
        <span className="bg-zinc-900 text-[#F5A623] text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0">
          {nbArticles}
        </span>
        <span>Voir ma commande</span>
        <span>{total.toFixed(2).replace(".", ",")} €</span>
      </button>
    </div>
  );
}
