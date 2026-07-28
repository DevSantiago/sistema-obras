"use client";

import { useState } from "react";
import AnticipoForm from "@/components/anticipos/AnticipoForm";
import PrestamosManager from "@/components/prestamos/PrestamosManager";
import styles from "./FinanciacionManager.module.css";

export default function FinanciacionManager() {
  const [vista, setVista] = useState<"ANTICIPOS" | "PRESTAMOS">(
    "ANTICIPOS",
  );

  return (
    <section className={styles.container}>
      <div className={styles.tabs} role="tablist">
        <button
          aria-selected={vista === "ANTICIPOS"}
          className={vista === "ANTICIPOS" ? styles.active : ""}
          role="tab"
          type="button"
          onClick={() => setVista("ANTICIPOS")}
        >
          Anticipos
        </button>
        <button
          aria-selected={vista === "PRESTAMOS"}
          className={vista === "PRESTAMOS" ? styles.active : ""}
          role="tab"
          type="button"
          onClick={() => setVista("PRESTAMOS")}
        >
          Préstamos
        </button>
      </div>
      {vista === "ANTICIPOS" ? <AnticipoForm /> : <PrestamosManager />}
    </section>
  );
}
