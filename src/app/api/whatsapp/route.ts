import { NextRequest, NextResponse } from "next/server";
import { addWhatsappMessage } from "@/store/state";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

interface MessageInput {
  commandeId: string;
  telephone: string;
  texte: string;
  direction: "envoi" | "reception";
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json() as MessageInput;
    const { commandeId, telephone, texte, direction } = body;

    if (!commandeId || !telephone || !texte || !direction) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 });
    }

    addWhatsappMessage({ commandeId, telephone, texte, direction });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
