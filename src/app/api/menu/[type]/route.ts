import { NextRequest, NextResponse } from "next/server";
import { getState, setState, initializeFromKV, persistAll } from "@/store/state";
import type { ApiResponse, Plat, TypeVitrine } from "@/types";

export const dynamic = "force-dynamic";

const VITRINES_VALIDES: TypeVitrine[] = ["snack", "restaurant", "pizzeria", "foodtruck"];

type PlatInput = Omit<Plat, "id"> & { id?: string };

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await initializeFromKV();

    const type = params.type as TypeVitrine;

    if (!VITRINES_VALIDES.includes(type)) {
      return NextResponse.json({ success: false, error: "Vitrine invalide" }, { status: 400 });
    }

    const body = await req.json() as PlatInput & { action?: "desactiver" | "activer" };
    const { action, ...platData } = body;

    const state = getState();
    const vitrine = state.vitrines[type];

    if (action === "desactiver" || action === "activer") {
      if (!platData.id) {
        return NextResponse.json({ success: false, error: "ID requis" }, { status: 400 });
      }
      const disponible = action === "activer";
      setState((s) => ({
        ...s,
        vitrines: {
          ...s.vitrines,
          [type]: {
            ...s.vitrines[type],
            plats: s.vitrines[type].plats.map((p) =>
              p.id === platData.id ? { ...p, disponible } : p
            ),
          },
        },
      }));
      await persistAll();
      return NextResponse.json({ success: true, data: { id: platData.id, disponible } });
    }

    if (platData.id) {
      const existe = vitrine.plats.some((p) => p.id === platData.id);
      if (!existe) {
        return NextResponse.json({ success: false, error: "Plat introuvable" }, { status: 404 });
      }
      setState((s) => ({
        ...s,
        vitrines: {
          ...s.vitrines,
          [type]: {
            ...s.vitrines[type],
            plats: s.vitrines[type].plats.map((p) =>
              p.id === platData.id ? { ...p, ...platData } : p
            ),
          },
        },
      }));
      await persistAll();
      return NextResponse.json({ success: true, data: platData });
    }

    const nouveauPlat: Plat = {
      ...(platData as Omit<Plat, "id">),
      id: crypto.randomUUID(),
    };
    setState((s) => ({
      ...s,
      vitrines: {
        ...s.vitrines,
        [type]: {
          ...s.vitrines[type],
          plats: [...s.vitrines[type].plats, nouveauPlat],
        },
      },
    }));
    await persistAll();
    return NextResponse.json({ success: true, data: nouveauPlat }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
