"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePolling } from "@/hooks/usePolling";
import type { State, Commande } from "@/types";

const COL = 32;
const TICKET_WIDTH = 302;

const VITRINE_INFO: Record<string, { nom: string; sous: string }> = {
  snack:      { nom: "CHEZ TATIE MONIQUE",  sous: "Snack · Saint-Pierre, Réunion" },
  restaurant: { nom: "LE QUOTIDIEN PÉI",    sous: "Restaurant · Saint-Denis, Réunion" },
  pizzeria:   { nom: "PIZZA LÉ BON",        sous: "Pizzeria · Réunion" },
  foodtruck:  { nom: "DODO ON THE ROAD",    sous: "Food Truck · Réunion" },
};

function formatMontant(n: number): string {
  return n.toFixed(2).replace(".", ",") + " EUR";
}

function formatHeure(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function padLine(left: string, right: string): string {
  const spaces = Math.max(1, COL - left.length - right.length);
  return left + " ".repeat(spaces) + right;
}

function TicketContent({ commande }: { commande: Commande }) {
  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 12,
      lineHeight: 1.6,
      color: "#111",
      backgroundColor: "white",
      width: TICKET_WIDTH,
      padding: "12px 10px 16px",
      boxSizing: "border-box",
    }}>
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 14 }}>
        {VITRINE_INFO[commande.vitrine]?.nom ?? commande.vitrine.toUpperCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 11, marginBottom: 6 }}>
        {VITRINE_INFO[commande.vitrine]?.sous ?? ""}
      </div>
      <div>{"=".repeat(COL)}</div>
      <div style={{ margin: "6px 0 2px" }}>
        <div>{padLine("Commande :", commande.numero)}</div>
        <div>{padLine("Creneau  :", commande.creneau)}</div>
        <div>{padLine("Heure    :", formatHeure(commande.createdAt))}</div>
        <div>{padLine("Tel      :", commande.whatsappPhone)}</div>
      </div>
      <div>{"-".repeat(COL)}</div>
      <div style={{ margin: "6px 0" }}>
        {commande.plats.map((ligne) => {
          const qte = `x${ligne.quantite} `;
          const prix = formatMontant(ligne.prix * ligne.quantite);
          const nomMax = COL - qte.length - prix.length - 1;
          const nom = ligne.nom.length > nomMax ? ligne.nom.slice(0, nomMax - 1) + "." : ligne.nom;
          return <div key={ligne.platId}>{padLine(qte + nom, prix)}</div>;
        })}
      </div>
      <div>{"-".repeat(COL)}</div>
      <div style={{ fontWeight: "bold", fontSize: 14, margin: "6px 0 2px" }}>
        {padLine("TOTAL", formatMontant(commande.montant))}
      </div>
      <div>{padLine("PAIEMENT", commande.modePaiement === "enligne" ? "En ligne" : "Au retrait")}</div>
      <div>{"=".repeat(COL)}</div>
      <div style={{ textAlign: "center", margin: "10px 0 4px", fontSize: 11, letterSpacing: "0.05em" }}>
        CODE DE RETRAIT
      </div>
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 28, letterSpacing: "0.15em", margin: "2px 0 10px" }}>
        {commande.codeAntiFraude}
      </div>
      <div>{"=".repeat(COL)}</div>
      <div style={{ textAlign: "center", marginTop: 8, fontSize: 11 }}>Merci et a bientot !</div>
      <div style={{ textAlign: "center", fontSize: 11 }}>Bon appetit ! 🙂</div>
    </div>
  );
}

function TicketEnImpression({ commande, onDone }: { commande: Commande; onDone: () => void }) {
  const [progres, setProgres] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const duree = 3000;
    const debut = performance.now();
    let raf: number;

    function frame(now: number) {
      const p = Math.min((now - debut) / duree, 1);
      setProgres(p);
      if (p < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        setTimeout(() => onDoneRef.current(), 500);
      }
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Révèle le ticket de haut en bas (comme une vraie imprimante)
  const clipBottom = `${Math.round((1 - progres) * 100)}%`;

  return (
    <div style={{ clipPath: `inset(0 0 ${clipBottom} 0)` }}>
      <TicketContent commande={commande} />
    </div>
  );
}

export default function TicketPage() {
  const state = usePolling<State>("/api/state");
  const commandes = state?.commandes ?? [];

  const imprimeRef = useRef<Set<string>>(new Set());
  const [tickets, setTickets] = useState<{ commande: Commande; imprimeLe: string }[]>([]);
  const [enCours, setEnCours] = useState<Commande | null>(null);
  const [file, setFile] = useState<Commande[]>([]);

  // Charger les IDs déjà imprimés
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("ticketsImprimes");
      if (stored) (JSON.parse(stored) as string[]).forEach((id) => imprimeRef.current.add(id));
    } catch { /* ignore */ }
  }, []);

  // Détecter les nouvelles commandes
  useEffect(() => {
    const nouvelles = commandes.filter((c) => !imprimeRef.current.has(c.id));
    if (nouvelles.length === 0) return;
    nouvelles.forEach((c) => imprimeRef.current.add(c.id));
    try {
      sessionStorage.setItem("ticketsImprimes", JSON.stringify([...imprimeRef.current]));
    } catch { /* ignore */ }
    setFile((prev) => [...prev, ...nouvelles]);
  }, [commandes]);

  // Traiter la file d'impression une par une
  useEffect(() => {
    if (enCours || file.length === 0) return;
    const [suivant, ...reste] = file;
    setFile(reste);
    setEnCours(suivant);
  }, [enCours, file]);

  const onTicketSorti = useCallback(() => {
    setEnCours((c) => {
      if (!c) return null;
      setTickets((prev) => [{ commande: c, imprimeLe: new Date().toISOString() }, ...prev]);
      return null;
    });
  }, []);

  const impression = enCours || (tickets.length > 0 && !enCours ? tickets[0].commande : null);
  const isImpression = !!enCours;

  return (
    <div style={{
      minHeight: "100dvh",
      backgroundColor: "#18181b",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingBottom: 48,
    }}>

      {/* Header */}
      <div style={{
        width: "100%", maxWidth: 480,
        backgroundColor: "#09090b",
        padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 12,
        borderBottom: "1px solid #27272a",
        position: "sticky", top: 0, zIndex: 20,
        boxSizing: "border-box",
      }}>
        <Link href="/dashboard" style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, textDecoration: "none" }}>←</Link>
        <div>
          <p style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, margin: 0 }}>
            Simulation
          </p>
          <h1 style={{ fontSize: 15, fontWeight: 900, color: "white", margin: 0 }}>Imprimante thermique</h1>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            backgroundColor: isImpression ? "#f59e0b" : "#22c55e",
            boxShadow: `0 0 8px ${isImpression ? "#f59e0b88" : "#22c55e88"}`,
          }} />
          <span style={{ fontSize: 11, color: "#71717a" }}>{isImpression ? "Impression…" : "Prête"}</span>
        </div>
      </div>

      {/* Corps de l'imprimante */}
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Boîtier */}
        <div style={{
          width: TICKET_WIDTH + 40,
          backgroundColor: "#3f3f46",
          borderRadius: "12px 12px 0 0",
          padding: "14px 20px 0",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              backgroundColor: isImpression ? "#f59e0b" : "#22c55e",
              transition: "background-color 0.3s",
            }} />
            <span style={{ fontSize: 10, color: "#a1a1aa", fontWeight: 700, letterSpacing: "0.08em" }}>
              THERMAL PRINTER · {isImpression ? "PRINTING" : "READY"}
            </span>
          </div>
          {/* Fente papier */}
          <div style={{
            height: 6,
            backgroundColor: "#111",
            borderRadius: "2px 2px 0 0",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8)",
          }} />
        </div>

        {/* Zone ticket (sort du bas de l'imprimante) */}
        <div style={{
          backgroundColor: "#111",
          width: TICKET_WIDTH + 40,
          padding: "0 20px",
          boxSizing: "border-box",
          minHeight: 6,
        }}>
          {enCours ? (
            <TicketEnImpression key={enCours.id} commande={enCours} onDone={onTicketSorti} />
          ) : tickets.length > 0 ? (
            <TicketContent commande={tickets[0].commande} />
          ) : null}
        </div>

        {/* Socle */}
        <div style={{
          width: TICKET_WIDTH + 40,
          height: 12,
          backgroundColor: "#27272a",
          borderRadius: "0 0 8px 8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        }} />
      </div>

      {/* Historique */}
      {tickets.length > 1 && (
        <div style={{ marginTop: 32, width: "100%", maxWidth: 480, padding: "0 16px", boxSizing: "border-box" }}>
          <p style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 12 }}>
            Historique ({tickets.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tickets.slice(1).map((t) => (
              <div key={t.commande.id} style={{
                backgroundColor: "#27272a", borderRadius: 8, padding: "10px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 900, color: "#F5A623", margin: 0 }}>{t.commande.numero}</p>
                  <p style={{ fontSize: 12, color: "#a1a1aa", margin: 0 }}>
                    {t.commande.plats.length} article{t.commande.plats.length > 1 ? "s" : ""} · {t.commande.creneau}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0 }}>{formatMontant(t.commande.montant)}</p>
                  <p style={{ fontSize: 11, color: "#71717a", margin: 0 }}>{formatHeure(t.imprimeLe)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* État vide */}
      {tickets.length === 0 && !enCours && (
        <div style={{ marginTop: 48, textAlign: "center", padding: "0 32px" }}>
          <p style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>🧾</p>
          <p style={{ fontSize: 14, color: "#52525b", fontWeight: 600, margin: "0 0 8px" }}>En attente de commandes</p>
          <p style={{ fontSize: 12, color: "#3f3f46", lineHeight: 1.6, margin: 0 }}>
            Le ticket s&apos;imprime automatiquement dès qu&apos;une commande est validée.
          </p>
        </div>
      )}

    </div>
  );
}
