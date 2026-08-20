import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import {
  crearBeneficiarioService,
  listarBeneficiariosService,
} from "@/modules/beneficiarios/beneficiarios.service";
import type {
  BeneficiarioListFilters,
  TipoBeneficiario,
} from "@/modules/beneficiarios/beneficiarios.types";

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

function normalizarActivoParam(activoParam: string | null) {
  if (activoParam === null) {
    return undefined;
  }

  return activoParam.toLowerCase() === "true";
}

export async function GET(request: NextRequest) {
  try {
    const usuarioAutenticado = await obtenerUsuarioSesionDesdeCookie();

    if (!usuarioAutenticado.body.ok || !usuarioAutenticado.body.data) {
      return NextResponse.json(usuarioAutenticado.body, {
        status: usuarioAutenticado.status,
      });
    }

    const { searchParams } = new URL(request.url);

    const filters: BeneficiarioListFilters = {
      tipo_beneficiario: searchParams.get("tipo_beneficiario")
        ? (searchParams.get("tipo_beneficiario") as TipoBeneficiario)
        : undefined,
      activo: normalizarActivoParam(searchParams.get("activo")),
      busqueda: searchParams.get("busqueda") ?? undefined,
    };

    const beneficiarios = await listarBeneficiariosService(
      usuarioAutenticado.body.data.usuario,
      filters,
    );

    return NextResponse.json({
      ok: true,
      message: "Beneficiarios consultados correctamente.",
      data: beneficiarios,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al listar beneficiarios.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: message === "No autorizado." ? 403 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuarioAutenticado = await obtenerUsuarioSesionDesdeCookie();

    if (!usuarioAutenticado.body.ok || !usuarioAutenticado.body.data) {
      return NextResponse.json(usuarioAutenticado.body, {
        status: usuarioAutenticado.status,
      });
    }

    const body = await request.json();

    const beneficiario = await crearBeneficiarioService(
      usuarioAutenticado.body.data.usuario,
      body,
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Beneficiario creado correctamente.",
        data: beneficiario,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al crear beneficiario.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: message === "No autorizado." ? 403 : 400 },
    );
  }
}