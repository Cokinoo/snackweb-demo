interface MessageJour {
  texte: string;
  photo?: string;
}

interface BandeauMessageJourProps {
  message: MessageJour | null;
}

export default function BandeauMessageJour({ message }: BandeauMessageJourProps) {
  if (!message) return null;

  return (
    <div className="bg-amber-400 text-amber-900 px-4 py-3">
      <p className="text-sm font-semibold text-center leading-snug">{message.texte}</p>
    </div>
  );
}
