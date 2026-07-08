"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";
import Link from "next/link";
import { useState } from "react";
import styles from "./PrivateLayout.module.css";

type PrivateLayoutProps = {
  children: React.ReactNode;
  usuario: {
    nombre: string;
    correo: string;
    roles: string[];
  };
};

type MenuItem = {
  label: string;
  href: string;
  visibleParaRoles: string[];
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
    label: "Aprobación",
    href: "/aprobacion",
    visibleParaRoles: [
      "ADMINISTRADOR",
      "DIRECTOR",
      "APROBADOR_1",
      "APROBADOR_2",
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

function menuItemEsVisible(item: MenuItem, usuarioRoles: string[]) {
  return usuarioTieneAlgunoDeLosRoles(usuarioRoles, item.visibleParaRoles);
}

export function PrivateLayout({ children, usuario }: PrivateLayoutProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const menuVisible = MENU_ITEMS.filter((item) =>
    menuItemEsVisible(item, usuario.roles),
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
                {rol}
              </span>
            ))}
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}