import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token")?.value;

        if (!sessionToken) {
            return Response.json(
                {
                    ok: false,
                    message: "No hay sesión activa."
                },
                { status:  401 }
            );
        }

        if (!process.env.JWT_SECRET) {
            return Response.json(
                {
                    ok: false,
                    message: "No está configurada la clave de sesión."
                },
                { status: 500 }
            );
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(sessionToken, secret);

        const usuarioId = payload.usuarioId;

        if (!usuarioId || typeof usuarioId !== "string") {
            return Response.json(
                {
                    ok: false,
                    message: "Sesión inválida."
                },
                { status: 401 }
            );
        }

        const usuario = await prisma.usuarios.findUnique({
            where: {
                id: usuarioId
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
                    message: "Usuario no encotrado."
                },
                { status: 404 }
            );
        }

        if (usuario.estado !== "ACTIVO") {
            return Response.json(
                {
                    ok: false,
                    message: "Estado de usuario inactivo."
                },
                {status: 403}
            );
        }

        const roles = usuario.roles.map((usuarioRol) => usuarioRol.rol.nombre);

        return Response.json(
            {
                ok: true,
                message: "Usuario autenticado.",
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
            },
        );

    } catch (error) {
        console.error("Error consultando usuario autenticado: ", error);

        return Response.json(
            {
                ok: false,
                message: "Sesión inválida o expirada."
            },
            { status: 401 }
        );
    }
}