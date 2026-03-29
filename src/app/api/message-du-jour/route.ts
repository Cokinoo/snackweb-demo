import { NextRequest, NextResponse } from "next/server";
import { setState, initializeFromKV, persistAll } from "@/store/state";
import { getMinuitReunion } from "@/lib/timezone";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

interface MessageInput {
  texte?: string;
  photo?: string;
  prix?: number;
  action: "publier" | "supprimer";
}


export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await initializeFromKV();

    const body = await req.json() as MessageInput;
    const { action, texte, photo, prix } = body;

    if (action === "supprimer") {
      setState((s) => ({ ...s, messageJour: null }));
      await persistAll();
      return NextResponse.json({ success: true, data: { messageJour: null } });
    }

    if (action === "publier") {
      if (!texte || texte.trim() === "") {
        return NextResponse.json(
          { success: false, error: "Le texte est requis" },
          { status: 400 }
        );
      }
      if (prix === undefined || isNaN(prix) || prix < 0) {
        return NextResponse.json(
          { success: false, error: "Le prix est requis" },
          { status: 400 }
        );
      }

      const messageJour = {
        texte: texte.trim(),
        photo: photo ?? undefined,
        prix,
        expireA: getMinuitReunion(),
      };

      setState((s) => ({ ...s, messageJour }));
      await persistAll();
      return NextResponse.json({ success: true, data: { messageJour } });
    }

    return NextResponse.json({ success: false, error: "Action invalide" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
