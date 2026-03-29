import { NextResponse } from "next/server";
import { resetAll } from "@/store/state";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    await resetAll();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
