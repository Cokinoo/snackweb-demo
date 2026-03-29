"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

const QR_ITEMS = [
  {
    label: "Chez Tatie Monique",
    sousTitre: "Snack",
    url: "https://snackweb-demo.vercel.app/snack",
    couleur: "#f97316",
  },
  {
    label: "Le Quotidien Péi",
    sousTitre: "Restaurant",
    url: "https://snackweb-demo.vercel.app/restaurant",
    couleur: "#16a34a",
  },
];

function QrCard({ label, sousTitre, url, couleur }: (typeof QR_ITEMS)[0]) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 240,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
  }, [url]);

  return (
    <div className="flex flex-col items-center gap-3 p-6 border-2 rounded-2xl bg-white print:border-black print:rounded-none print:shadow-none shadow-md">
      <div
        className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white"
        style={{ backgroundColor: couleur }}
      >
        {sousTitre}
      </div>
      <p className="text-lg font-bold text-gray-800 text-center">{label}</p>
      <canvas ref={canvasRef} className="rounded-lg" />
      <p className="text-xs text-gray-400 text-center break-all">{url}</p>
    </div>
  );
}

export default function QrCodePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 print:bg-white print:p-0">
      <div className="max-w-sm mx-auto flex flex-col gap-6">
        <div className="text-center print:hidden">
          <h1 className="text-xl font-bold text-gray-800">QR Codes</h1>
          <p className="text-sm text-gray-500 mt-1">Scannez pour commander en ligne</p>
        </div>

        {QR_ITEMS.map((item) => (
          <QrCard key={item.url} {...item} />
        ))}

        <button
          onClick={() => window.print()}
          className="print:hidden w-full py-3 rounded-xl bg-gray-800 text-white font-semibold text-sm"
        >
          Imprimer
        </button>
      </div>
    </div>
  );
}
