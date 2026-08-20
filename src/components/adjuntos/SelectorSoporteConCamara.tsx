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
};

export default function SelectorSoporteConCamara({
  id,
  titulo,
  archivo,
  onChange,
  required = false,
  disabled = false,
}: SelectorSoporteConCamaraProps) {
  function seleccionarArchivo(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0] ?? null);
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
      {archivo ? <p className={styles.fileName}>Seleccionado: {archivo.name}</p> : null}
      <p className={styles.help}>Puede seleccionar un PDF o imagen, o tomar una foto del comprobante.</p>
    </div>
  );
}
