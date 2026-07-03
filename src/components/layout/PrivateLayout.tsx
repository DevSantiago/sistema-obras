"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import styles from "./PrivateLayout.module.css";

type PrivateLayoutProps = {
  children: React.ReactNode;
  usuario: {
    nombre: string;
    correo: string;
    roles: string[];
  };
};

export function PrivateLayout({ children, usuario }: PrivateLayoutProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  return (
    <div className={styles.shell}>
      {menuAbierto && (
        <button
          className={styles.backdrop}
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
        />
      )}

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
          <Link className={styles.navLink} href="/dashboard" onClick={cerrarMenu}>
            Dashboard
          </Link>

          <Link className={styles.navLink} href="/usuarios" onClick={cerrarMenu}>
            Usuarios
          </Link>

          <Link
            className={styles.navLink}
            href="/proyectos-base"
            onClick={cerrarMenu}
          >
            Proyectos
          </Link>

          <Link
            className={styles.navLink}
            href="/beneficiarios"
            onClick={cerrarMenu}
          >
            Beneficiarios
          </Link>

          <Link
            className={styles.navLink}
            href="/solicitudes"
            onClick={cerrarMenu}
          >
            Solicitudes
          </Link>

          <Link className={styles.navLink} href="/pagos" onClick={cerrarMenu}>
            Pagos
          </Link>
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
