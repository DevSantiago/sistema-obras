"use client";

import { useState } from "react";
import type { UsuarioListado } from "@/modules/usuarios/usuarios.types";
import { UserForm } from "./UserForm";
import { UsersTable } from "./UsersTable";

type UsersManagerProps = {
  usuarios: UsuarioListado[];
};

export function UsersManager({ usuarios }: UsersManagerProps) {
  const [usuarioEditando, setUsuarioEditando] =
    useState<UsuarioListado | null>(null);

  function cancelarEdicion() {
    setUsuarioEditando(null);
  }

  function finalizarGuardado() {
    setUsuarioEditando(null);
  }

  return (
    <>
      <UserForm
        key={usuarioEditando?.id ?? "crear-usuario"}
        usuarioEditando={usuarioEditando}
        onCancelarEdicion={cancelarEdicion}
        onGuardado={finalizarGuardado}
      />

      <UsersTable usuarios={usuarios} onEditarUsuario={setUsuarioEditando} />
    </>
  );
}