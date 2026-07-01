import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import {
  crearProyectoBaseService,
  listarProyectosBaseService,
} from "@/modules/proyectos-base/proyectos-base.service";
import type { EstadoProyectoBase } from "@/modules/proyectos-base/proyectos-base.types";

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

function usuarioTienePermiso(permisos: string[] | undefined, permiso: string) {
  return permisos?.includes(permiso) ?? false;
}

export async function GET(request: NextRequest) {
  try {
    const usuarioAutenticado = await obtenerUsuarioSesionDesdeCookie();

    if (!usuarioAutenticado.body.ok) {
      return NextResponse.json(usuarioAutenticado.body, {
        status: usuarioAutenticado.status,
      });
    }

    const { searchParams } = new URL(request.url);

    const estadoProyecto = searchParams.get("estado_proyecto");
    const activoParam = searchParams.get("activo");

    const proyectosBase = await listarProyectosBaseService({
      estado_proyecto: estadoProyecto
        ? (estadoProyecto as EstadoProyectoBase)
        : undefined,
      activo:
        activoParam === null ? undefined : activoParam.toLowerCase() === "true",
    });

    return NextResponse.json({
      ok: true,
      message: "Proyectos base consultados correctamente.",
      data: proyectosBase,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al listar proyectos base.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
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

    const usuario = usuarioAutenticado.body.data.usuario;

    if (!usuarioTienePermiso(usuario.permisos, "CREAR_PROYECTOS")) {
      return NextResponse.json(
        {
          ok: false,
          message: "No autorizado.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const proyectoBase = await crearProyectoBaseService({
      nombre: body.nombre,
      descripcion: body.descripcion,
      centros_costo: body.centros_costo,
      creado_por: usuario.id,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Proyecto base creado correctamente.",
        data: proyectoBase,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al crear proyecto base.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 400 },
    );
  }
}