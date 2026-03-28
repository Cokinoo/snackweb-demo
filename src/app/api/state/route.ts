import { NextResponse } from "next/server";
import { getState, getWhatsappMessages } from "@/store/state";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export function GET(): NextResponse<ApiResponse> {
  try {
    const state = getState();
    const whatsappMessages = getWhatsappMessages();
    return NextResponse.json({ success: true, data: { ...state, whatsappMessages } });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
