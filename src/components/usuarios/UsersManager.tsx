"use client";

import { useRef, useState } from "react";
import type { UsuarioListado } from "@/modules/usuarios/usuarios.types";
import {
  UserForm,
  type ProyectoAccesoDisponible,
} from "./UserForm";
import { UsersTable } from "./UsersTable";

type UsersManagerProps = {
  usuarios: UsuarioListado[];
  proyectos: ProyectoAccesoDisponible[];
};

export function UsersManager({ usuarios, proyectos }: UsersManagerProps) {
  const [usuarioEditando, setUsuarioEditando] =
    useState<UsuarioListado | null>(null);
  const [formularioExpandido, setFormularioExpandido] = useState(true);
  const formularioRef = useRef<HTMLDivElement>(null);

  function editarUsuario(usuario: UsuarioListado) {
    setUsuarioEditando(usuario);
    setFormularioExpandido(true);
    window.requestAnimationFrame(() => {
      formularioRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <>
      <div ref={formularioRef}>
        <UserForm
          key={usuarioEditando?.id ?? "crear-usuario"}
          usuarioEditando={usuarioEditando}
          proyectos={proyectos}
          expandido={formularioExpandido}
          onAlternarExpansion={() =>
            setFormularioExpandido((expandido) => !expandido)
          }
          onCancelarEdicion={() => setUsuarioEditando(null)}
          onGuardado={() => setUsuarioEditando(null)}
        />
      </div>

      <UsersTable
        usuarios={usuarios}
        onEditarUsuario={editarUsuario}
      />
    </>
  );
}
