"use client";

import { useState } from "react";
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

  return (
    <>
      <UserForm
        key={usuarioEditando?.id ?? "crear-usuario"}
        usuarioEditando={usuarioEditando}
        proyectos={proyectos}
        onCancelarEdicion={() => setUsuarioEditando(null)}
        onGuardado={() => setUsuarioEditando(null)}
      />

      <UsersTable
        usuarios={usuarios}
        onEditarUsuario={setUsuarioEditando}
      />
    </>
  );
}
