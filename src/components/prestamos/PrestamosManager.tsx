"use client";

import { useState } from "react";
import PrestamoEntreProyectosForm from "./PrestamoEntreProyectosForm";
import PrestamoForm from "./PrestamoForm";
import styles from "@/components/financiacion/FinanciacionManager.module.css";

export default function PrestamosManager() {
  const [tipo, setTipo] = useState<"PERSONA" | "PROYECTOS">("PERSONA");

  return (
    <>
      <div className={styles.tabs} role="tablist">
        <button
          aria-selected={tipo === "PERSONA"}
          className={tipo === "PERSONA" ? styles.active : ""}
          role="tab"
          type="button"
          onClick={() => setTipo("PERSONA")}
        >
          Persona a proyecto
        </button>
        <button
          aria-selected={tipo === "PROYECTOS"}
          className={tipo === "PROYECTOS" ? styles.active : ""}
          role="tab"
          type="button"
          onClick={() => setTipo("PROYECTOS")}
        >
          Entre proyectos
        </button>
      </div>
      {tipo === "PERSONA" ? (
        <PrestamoForm />
      ) : (
        <PrestamoEntreProyectosForm />
      )}
    </>
  );
}
