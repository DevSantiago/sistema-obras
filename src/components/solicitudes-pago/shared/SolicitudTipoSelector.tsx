"use client";

import type {
  OpcionTipoSolicitud,
  TipoSolicitudFormulario,
} from "../solicitudes-pago.types";
import styles from "../SolicitudesPagoManager.module.css";

type SolicitudTipoSelectorProps = {
  opciones: OpcionTipoSolicitud[];
  tipoSeleccionado: TipoSolicitudFormulario;
  onChange: (tipo: TipoSolicitudFormulario) => void;
};

export default function SolicitudTipoSelector({
  opciones,
  tipoSeleccionado,
  onChange,
}: SolicitudTipoSelectorProps) {
  return (
    <section
      className={`${styles.card} ${styles.typeSelectorSection}`}
      aria-labelledby="tipo-solicitud-title"
    >
      <div className={styles.typeSelectorHeader}>
        <h2 id="tipo-solicitud-title" className={styles.sectionTitle}>
          Tipo de solicitud
        </h2>

        <p className={styles.typeSelectorDescription}>
          Selecciona el tipo de obligación que deseas registrar.
        </p>
      </div>

      <div
        className={styles.typeSelectorGrid}
        role="radiogroup"
        aria-label="Tipos de solicitud disponibles"
      >
        {opciones.map((opcion) => {
          const seleccionada = opcion.id === tipoSeleccionado;
          const deshabilitada = !opcion.habilitado;

          return (
            <button
              key={opcion.id}
              type="button"
              role="radio"
              aria-checked={seleccionada}
              aria-disabled={deshabilitada}
              disabled={deshabilitada}
              className={[
                styles.typeSelectorCard,
                seleccionada ? styles.typeSelectorCardSelected : "",
                deshabilitada ? styles.typeSelectorCardDisabled : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onChange(opcion.id)}
            >
              <span className={styles.typeSelectorCardHeader}>
                <strong className={styles.typeSelectorCardTitle}>
                  {opcion.titulo}
                </strong>

                {seleccionada ? (
                  <span className={styles.typeSelectorSelectedBadge}>
                    Seleccionado
                  </span>
                ) : opcion.etiquetaEstado ? (
                  <span className={styles.typeSelectorDisabledBadge}>
                    {opcion.etiquetaEstado}
                  </span>
                ) : null}
              </span>

              <span className={styles.typeSelectorCardDescription}>
                {opcion.descripcion}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}