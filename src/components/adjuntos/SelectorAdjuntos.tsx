"use client";

import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./SelectorAdjuntos.module.css";

const MAXIMO_ARCHIVOS_PREDETERMINADO = 10;
const TAMANO_MAXIMO_PREDETERMINADO = 10 * 1024 * 1024;

const TIPOS_MIME_PREDETERMINADOS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

const EXTENSIONES_ACEPTADAS_PREDETERMINADAS =
  ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";

type SelectorAdjuntosProps = {
  id: string;
  archivos: File[];
  onChange: (archivos: File[]) => void;
  onError?: (mensaje: string) => void;
  disabled?: boolean;
  required?: boolean;
  titulo?: string;
  ayuda?: string;
  maximoArchivos?: number;
  tamanoMaximoBytes?: number;
  tiposMimePermitidos?: readonly string[];
  accept?: string;
};

function obtenerNombreArchivoSeguro(archivo: File): string {
  return archivo.name || "archivo-sin-nombre";
}

function formatearTamanoArchivo(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatearTamanoMaximo(bytes: number): string {
  const megabytes = bytes / 1024 / 1024;

  return Number.isInteger(megabytes)
    ? `${megabytes} MB`
    : `${megabytes.toFixed(2)} MB`;
}

export default function SelectorAdjuntos({
  id,
  archivos,
  onChange,
  onError,
  disabled = false,
  required = false,
  titulo = "Soportes",
  ayuda,
  maximoArchivos = MAXIMO_ARCHIVOS_PREDETERMINADO,
  tamanoMaximoBytes = TAMANO_MAXIMO_PREDETERMINADO,
  tiposMimePermitidos = TIPOS_MIME_PREDETERMINADOS,
  accept = EXTENSIONES_ACEPTADAS_PREDETERMINADAS,
}: SelectorAdjuntosProps) {
  const [inputKey, setInputKey] = useState(0);
  const cantidadAnteriorRef = useRef(archivos.length);

  useEffect(() => {
    const cantidadAnterior = cantidadAnteriorRef.current;

    if (cantidadAnterior > 0 && archivos.length === 0) {
      setInputKey((actual) => actual + 1);
    }

    cantidadAnteriorRef.current = archivos.length;
  }, [archivos.length]);

  function informarError(mensaje: string) {
    if (onError) {
      onError(mensaje);
    }
  }

  function validarArchivos(
    archivosSeleccionados: File[],
  ): string | null {
    if (archivosSeleccionados.length > maximoArchivos) {
      return `Puede adjuntar máximo ${maximoArchivos} soportes por solicitud.`;
    }

    const tiposPermitidos = new Set(tiposMimePermitidos);

    const archivoTipoInvalido = archivosSeleccionados.find(
      (archivo) => !tiposPermitidos.has(archivo.type),
    );

    if (archivoTipoInvalido) {
      return `El archivo "${obtenerNombreArchivoSeguro(
        archivoTipoInvalido,
      )}" no tiene un formato permitido. Use PDF, JPG, JPEG o PNG.`;
    }

    const archivoDemasiadoGrande = archivosSeleccionados.find(
      (archivo) => archivo.size > tamanoMaximoBytes,
    );

    if (archivoDemasiadoGrande) {
      return `El archivo "${obtenerNombreArchivoSeguro(
        archivoDemasiadoGrande,
      )}" supera el tamaño máximo de ${formatearTamanoMaximo(
        tamanoMaximoBytes,
      )}.`;
    }

    return null;
  }

  function manejarCambio(event: ChangeEvent<HTMLInputElement>) {
    const archivosSeleccionados = Array.from(event.target.files ?? []);

    if (archivosSeleccionados.length === 0) {
      onChange([]);
      return;
    }

    const errorValidacion = validarArchivos(archivosSeleccionados);

    if (errorValidacion) {
      event.target.value = "";
      informarError(errorValidacion);
      return;
    }

    onChange(archivosSeleccionados);
  }

  function eliminarArchivo(indice: number) {
    const archivosActualizados = archivos.filter(
      (_, indiceActual) => indiceActual !== indice,
    );

    onChange(archivosActualizados);
    setInputKey((actual) => actual + 1);
  }

  const textoAyuda =
    ayuda ??
    `Adjunta entre 1 y ${maximoArchivos} archivos PDF, JPG, JPEG o PNG. Máximo ${formatearTamanoMaximo(
      tamanoMaximoBytes,
    )} por archivo.`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {titulo}

        {required ? (
          <>
            {" "}
            <strong aria-hidden="true">*</strong>
          </>
        ) : null}
      </label>

      <input
        key={inputKey}
        id={id}
        className={styles.fileInput}
        type="file"
        accept={accept}
        multiple
        onChange={manejarCambio}
        disabled={disabled}
        required={required && archivos.length === 0}
      />

      <p className={styles.fieldHelp}>{textoAyuda}</p>

      {archivos.length > 0 ? (
        <ul className={styles.fileList}>
          {archivos.map((archivo, indice) => {
            const nombreArchivo = obtenerNombreArchivoSeguro(archivo);

            return (
              <li
                key={`${archivo.name}-${archivo.size}-${archivo.lastModified}-${indice}`}
                className={styles.fileItem}
              >
                <span className={styles.fileName}>{nombreArchivo}</span>

                <span className={styles.fileSize}>
                  {formatearTamanoArchivo(archivo.size)}
                </span>

                <button
                  type="button"
                  className={styles.fileRemoveButton}
                  onClick={() => eliminarArchivo(indice)}
                  disabled={disabled}
                  aria-label={`Eliminar ${nombreArchivo}`}
                >
                  Eliminar
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}