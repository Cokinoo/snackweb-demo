interface BandeauPauseProps {
  visible: boolean;
}

export default function BandeauPause({ visible }: BandeauPauseProps) {
  if (!visible) return null;

  return (
    <div className="bg-red-600 text-white text-center px-4 py-3 text-sm font-medium leading-snug">
      Les commandes en ligne ne sont pas disponibles pour le moment,
      veuillez venir passer votre commande au comptoir.
    </div>
  );
}
