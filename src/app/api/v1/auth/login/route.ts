import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    let body: { correo?: string; password?: string };

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          ok: false,
          message: "El cuerpo de la solicitud debe ser un JSON válido.",
        },
        { status: 400 }
      );
    }

    const { correo, password } = body;

    if (!correo || !password) {
      return Response.json(
        {
          ok: false,
          message: "Correo y contraseña son obligatorios.",
        },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuarios.findUnique({
      where: {
        correo,
      },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (!usuario) {
      return Response.json(
        {
          ok: false,
          message: "Credenciales inválidas.",
        },
        { status: 401 }
      );
    }

    if (usuario.estado !== "ACTIVO") {
      return Response.json(
        {
          ok: false,
          message: "El usuario se encuentra inactivo.",
        },
        { status: 403 }
      );
    }

    const passwordValida = await bcrypt.compare(
      password,
      usuario.password_hash ?? ""
    );

    if (!passwordValida) {
      return Response.json(
        {
          ok: false,
          message: "Credenciales inválidas.",
        },
        { status: 401 }
      );
    }

    const roles = usuario.roles.map((usuarioRol) => usuarioRol.rol.nombre);

    if (!process.env.JWT_SECRET) {
      return Response.json(
        {
          ok: false,
          message: "No está configurada la clave de sesión.",
        },
        { status: 500 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const sessionToken = await new SignJWT({
      usuarioId: usuario.id,
      correo: usuario.correo,
      roles,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secret);

    const cookieStore = await cookies();

    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return Response.json({
      ok: true,
      message: "Inicio de sesión correcto.",
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          telefono: usuario.telefono,
          estado: usuario.estado,
          roles,
        },
      },
    });
  } catch (error) {
    console.error("Error en login:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible iniciar sesión.",
      },
      { status: 500 }
    );
  }
}