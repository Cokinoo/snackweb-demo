import { NextResponse } from "next/server";
import { getState, setState } from "@/store/state";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export function POST(): NextResponse<ApiResponse> {
  try {
    const state = getState();
    const pause = !state.pause;
    setState((s) => ({ ...s, pause }));
    return NextResponse.json({ success: true, data: { pause } });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
