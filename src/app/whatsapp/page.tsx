"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePolling } from "@/hooks/usePolling";
import type { WhatsAppMessage } from "@/types";

interface StateWithMessages {
  whatsappMessages: WhatsAppMessage[];
}

function formatHeure(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatTelephone(tel: string): string {
  if (tel.length === 10) {
    return `${tel.slice(0, 4)} ${tel.slice(4, 6)} ${tel.slice(6, 8)} ${tel.slice(8, 10)}`;
  }
  return tel;
}

function WhatsappChat() {
  const searchParams = useSearchParams();
  const texteParam = searchParams.get("texte") ?? "";
  const commandeIdParam = searchParams.get("commandeId") ?? "";
  const telephoneParam = searchParams.get("telephone") ?? "";

  const state = usePolling<StateWithMessages>("/api/state");
  const messages = state?.whatsappMessages ?? [];

  const [inputValue, setInputValue] = useState(texteParam);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Pré-remplir l'input si les params changent (arrivée depuis la page succès)
  useEffect(() => {
    if (texteParam) setInputValue(texteParam);
  }, [texteParam]);

  async function envoyerMessage() {
    const texte = inputValue.trim();
    if (!texte || sending) return;

    setSending(true);
    try {
      await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId: commandeIdParam || "direct",
          telephone: telephoneParam || "0692000000",
          texte,
          direction: "reception",
        }),
      });
      setInputValue("");
      // Nettoyer l'URL sans recharger la page
      window.history.replaceState({}, "", "/whatsapp");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") envoyerMessage();
  }

  return (
    <div style={styles.root}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>
            <span style={{ fontSize: 20 }}>🍽️</span>
          </div>
          <div>
            <div style={styles.headerName}>Chez Tatie Monique</div>
            <div style={styles.headerSub}>en ligne</div>
          </div>
        </div>
        <div style={styles.headerIcons}>
          <span style={styles.iconBtn}>📞</span>
          <span style={styles.iconBtn}>⋮</span>
        </div>
      </div>

      {/* Corps du chat */}
      <div style={styles.chatBody}>

        <div style={styles.infoBubble}>
          <span style={styles.infoText}>
            🔒 Simulation — aucun message réel n&apos;est envoyé.
          </span>
        </div>

        {messages.length === 0 && !texteParam && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyText}>Aucun message pour le moment.</p>
            <p style={styles.emptyHint}>
              Les messages apparaîtront ici dès qu&apos;une commande est passée.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Barre de saisie */}
      <div style={styles.inputBar}>
        <div style={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            style={styles.input}
          />
        </div>
        <button
          onClick={envoyerMessage}
          disabled={!inputValue.trim() || sending}
          style={{
            ...styles.sendBtn,
            backgroundColor: inputValue.trim() ? "#25D366" : "#8e8e8e",
          }}
          aria-label="Envoyer"
        >
          {sending ? "…" : "➤"}
        </button>
      </div>

    </div>
  );
}

function MessageBubble({ message }: { message: WhatsAppMessage }) {
  const isReception = message.direction === "reception";

  return (
    <div style={{ ...styles.messageWrapper, justifyContent: isReception ? "flex-start" : "flex-end" }}>
      <div style={isReception ? styles.bubbleReception : styles.bubbleEnvoi}>
        <div style={{ ...styles.bubbleContact, color: isReception ? "#128C7E" : "#5d8a3c" }}>
          📱 {formatTelephone(message.telephone)}
        </div>
        <div style={styles.bubbleText}>{message.texte}</div>
        <div style={styles.bubbleMeta}>
          <span style={styles.bubbleTime}>{formatHeure(message.createdAt)}</span>
          {!isReception && <span style={styles.checkmarks}>✓✓</span>}
        </div>
        <div style={isReception ? styles.tailReception : styles.tailEnvoi} />
      </div>
    </div>
  );
}

export default function WhatsappPage() {
  return (
    <Suspense>
      <WhatsappChat />
    </Suspense>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    maxWidth: 480,
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: "hidden",
    backgroundColor: "#E5DDD5",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9b99a' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  },
  header: {
    backgroundColor: "#075E54",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    paddingTop: "env(safe-area-inset-top, 10px)",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: "#128C7E",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerName: { color: "white", fontSize: 16, fontWeight: 600, lineHeight: 1.2 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  headerIcons: { display: "flex", gap: 16 },
  iconBtn: { fontSize: 20, cursor: "pointer" },

  chatBody: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  infoBubble: {
    backgroundColor: "#FFF9C4",
    borderRadius: 8,
    padding: "6px 12px",
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 280,
    marginBottom: 4,
  },
  infoText: { fontSize: 12, color: "#666", lineHeight: 1.4 },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    padding: 32,
    textAlign: "center",
    marginTop: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.4 },
  emptyText: { fontSize: 16, color: "#555", fontWeight: 600, margin: "0 0 8px" },
  emptyHint: { fontSize: 13, color: "#888", lineHeight: 1.5, margin: 0 },

  messageWrapper: { display: "flex", paddingLeft: 4, paddingRight: 4 },

  bubbleReception: {
    backgroundColor: "white",
    borderRadius: "0px 12px 12px 12px",
    padding: "6px 10px 4px",
    maxWidth: "80%",
    position: "relative",
    boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
  },
  tailReception: {
    position: "absolute",
    top: 0,
    left: -8,
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderWidth: "0 10px 10px 0",
    borderColor: "transparent white transparent transparent",
  },
  bubbleEnvoi: {
    backgroundColor: "#DCF8C6",
    borderRadius: "12px 0px 12px 12px",
    padding: "6px 10px 4px",
    maxWidth: "80%",
    position: "relative",
    boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
  },
  tailEnvoi: {
    position: "absolute",
    top: 0,
    right: -8,
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderWidth: "0 0 10px 10px",
    borderColor: "transparent transparent transparent #DCF8C6",
  },

  bubbleContact: { fontSize: 12, fontWeight: 700, marginBottom: 3 },
  bubbleText: { fontSize: 14, color: "#111", lineHeight: 1.45, wordBreak: "break-word" },
  bubbleMeta: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 3 },
  bubbleTime: { fontSize: 11, color: "#888" },
  checkmarks: { fontSize: 12, color: "#4FC3F7" },

  inputBar: {
    backgroundColor: "#F0F0F0",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
    flexShrink: 0,
    borderTop: "1px solid #ddd",
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 24,
    padding: "2px 4px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
  },
  input: {
    width: "100%",
    border: "none",
    outline: "none",
    padding: "8px 12px",
    fontSize: 14,
    backgroundColor: "transparent",
    color: "#111",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    color: "white",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background-color 0.15s",
  },
};
