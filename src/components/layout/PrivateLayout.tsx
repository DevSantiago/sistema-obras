"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";
import Link from "next/link";
import { useState } from "react";
import styles from "./PrivateLayout.module.css";
import type { UsuarioSesion } from "@/modules/auth/auth.types";

type PrivateLayoutProps = {
  children: React.ReactNode;
  usuario: UsuarioSesion;
};

type MenuItem = {
  label: string;
  href: string;
  visibleParaRoles?: string[];
  visibleParaPermisos?: string[];
};

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    visibleParaRoles: [
      "ADMINISTRADOR",
      "DIRECTOR",
      "APROBADOR_1",
      "APROBADOR_2",
      "SOLICITANTE",
    ],
  },
  {
    label: "Usuarios",
    href: "/usuarios",
    visibleParaRoles: ["ADMINISTRADOR", "DIRECTOR", "APROBADOR_1"],
  },
  {
    label: "Proyectos",
    href: "/proyectos-base",
    visibleParaRoles: ["ADMINISTRADOR", "DIRECTOR", "APROBADOR_1"],
  },
  {
    label: "Beneficiarios",
    href: "/beneficiarios",
    visibleParaRoles: ["ADMINISTRADOR", "DIRECTOR", "APROBADOR_1"],
  },
  {
    label: "Solicitudes",
    href: "/solicitudes-pago",
    visibleParaRoles: [
      "ADMINISTRADOR",
      "DIRECTOR",
      "APROBADOR_1",
      "SOLICITANTE",
      "AUXILIAR_CONTABLE",
    ],
  },
  {
    label: "Aprobaciones",
    href: "/aprobaciones",
    visibleParaPermisos: [
      "APROBAR_NIVEL_1",
    ],
  },
  {
    label: "Pagos",
    href: "/pagos",
    visibleParaRoles: ["ADMINISTRADOR", "TESORERIA", "PAGOS"],
  },
];

function usuarioTieneAlgunoDeLosRoles(
  usuarioRoles: string[],
  rolesPermitidos: string[],
) {
  return rolesPermitidos.some((rol) => usuarioRoles.includes(rol));
}

function usuarioTieneAlgunoDeLosPermisos(
  usuarioPermisos: string[],
  permisosPermitidos: string[],
) {
  return permisosPermitidos.some((permiso) =>
    usuarioPermisos.includes(permiso),
  );
}

function menuItemEsVisible(item: MenuItem, usuario: UsuarioSesion) {
  const visiblePorRol =
    item.visibleParaRoles !== undefined &&
    usuarioTieneAlgunoDeLosRoles(usuario.roles, item.visibleParaRoles);

  const visiblePorPermiso =
    item.visibleParaPermisos !== undefined &&
    usuarioTieneAlgunoDeLosPermisos(
      usuario.permisos,
      item.visibleParaPermisos,
    );

  return visiblePorRol || visiblePorPermiso;
}

function obtenerEtiquetaRol(rol: string): string {
  const etiquetas: Record<string, string> = {
    ADMINISTRADOR: "Administrador",
    DIRECTOR: "Director",
    APROBADOR_1: "Aprobador nivel 1",
    APROBADOR_2: "Aprobador nivel 2",
    PAGOS: "Pagos",
    SOLICITANTE: "Solicitante",
    AUXILIAR_CONTABLE: "Auxiliar contable",
  };

  return etiquetas[rol] ?? rol;
}

export function PrivateLayout({ children, usuario }: PrivateLayoutProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const menuVisible = MENU_ITEMS.filter((item) =>
    menuItemEsVisible(item, usuario),
  );

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  return (
    <div className={styles.shell}>
      {menuAbierto ? (
        <button
          className={styles.backdrop}
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
        />
      ) : null}

      <aside
        className={`${styles.sidebar} ${
          menuAbierto ? styles.sidebarOpen : ""
        }`}
      >
        <div className={styles.brand}>
          <span className={styles.brandMark}>SO</span>

          <div>
            <p className={styles.brandTitle}>Sistema Obras</p>
            <p className={styles.brandSubtitle}>Gestión de solicitudes</p>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Menú principal">
          {menuVisible.map((item) => (
            <Link
              key={item.href}
              className={styles.navLink}
              href={item.href}
              onClick={cerrarMenu}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <p className={styles.userName}>{usuario.nombre}</p>
          <p className={styles.userEmail}>{usuario.correo}</p>

          <LogoutButton />
        </div>
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.topbar}>
          <button
            className={styles.menuButton}
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMenuAbierto(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <div>
            <p className={styles.topbarLabel}>Sesión activa</p>
            <p className={styles.topbarUser}>{usuario.nombre}</p>
          </div>

          <div className={styles.roles}>
            {usuario.roles.map((rol) => (
              <span key={rol} className={styles.roleBadge}>
                {obtenerEtiquetaRol(rol)}
              </span>
            ))}
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}