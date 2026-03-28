import { NextRequest, NextResponse } from "next/server";
import { setState } from "@/store/state";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

interface MessageInput {
  texte?: string;
  photo?: string;
  action: "publier" | "supprimer";
}

function getMinuitAujourdhui(): string {
  const minuit = new Date();
  minuit.setHours(23, 59, 59, 999);
  return minuit.toISOString();
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json() as MessageInput;
    const { action, texte, photo } = body;

    if (action === "supprimer") {
      setState((s) => ({ ...s, messageJour: null }));
      return NextResponse.json({ success: true, data: { messageJour: null } });
    }

    if (action === "publier") {
      if (!texte || texte.trim() === "") {
        return NextResponse.json(
          { success: false, error: "Le texte est requis" },
          { status: 400 }
        );
      }

      const messageJour = {
        texte: texte.trim(),
        photo: photo ?? undefined,
        expireA: getMinuitAujourdhui(),
      };

      setState((s) => ({ ...s, messageJour }));
      return NextResponse.json({ success: true, data: { messageJour } });
    }

    return NextResponse.json({ success: false, error: "Action invalide" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
