"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  async function manejarLogout() {
    setCerrandoSesion(true);

    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
      });

      router.push("/login");
      router.refresh();
    } catch {
      alert("No fue posible cerrar sesión.");
    } finally {
      setCerrandoSesion(false);
    }
  }

  return (
    <button type="button" onClick={manejarLogout} disabled={cerrandoSesion}>
      {cerrandoSesion ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}