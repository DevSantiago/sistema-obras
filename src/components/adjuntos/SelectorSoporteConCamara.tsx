"use client";

import type { ChangeEvent } from "react";
import styles from "./SelectorSoporteConCamara.module.css";

type SelectorSoporteConCamaraProps = {
  id: string;
  titulo: string;
  archivo: File | null;
  onChange: (archivo: File | null) => void;
  required?: boolean;
  disabled?: boolean;
  removable?: boolean;
};

export default function SelectorSoporteConCamara({
  id,
  titulo,
  archivo,
  onChange,
  required = false,
  disabled = false,
  removable = false,
}: SelectorSoporteConCamaraProps) {
  function seleccionarArchivo(event: ChangeEvent<HTMLInputElement>) {
    const archivoSeleccionado = event.target.files?.[0] ?? null;
    event.target.value = "";
    onChange(archivoSeleccionado);
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {titulo}{required ? " *" : ""}
      </label>
      <div className={styles.actions}>
        <input
          id={id}
          className={styles.fileInput}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          onChange={seleccionarArchivo}
          required={required && !archivo}
          disabled={disabled}
        />
        <input
          id={`${id}-camera`}
          className={styles.cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={seleccionarArchivo}
          disabled={disabled}
        />
        <label
          className={disabled ? styles.cameraButtonDisabled : styles.cameraButton}
          htmlFor={`${id}-camera`}
        >
          Tomar foto
        </label>
      </div>
      {archivo ? (
        <div className={styles.fileSelection}>
          <p className={styles.fileName}>Seleccionado: {archivo.name}</p>
          {removable ? (
            <button
              className={styles.removeButton}
              type="button"
              disabled={disabled}
              aria-label={`Quitar ${titulo.toLocaleLowerCase("es")}`}
              onClick={() => onChange(null)}
            >
              Quitar
            </button>
          ) : null}
        </div>
      ) : null}
      <p className={styles.help}>Puede seleccionar un PDF o imagen, o tomar una foto del comprobante.</p>
    </div>
  );
}
