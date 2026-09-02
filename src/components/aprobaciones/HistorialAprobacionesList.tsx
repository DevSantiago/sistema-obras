"use client";

import { formatearNombrePropio } from "@/lib/text-format";
import type {
  EstadoSolicitudPago,
  SolicitudPagoListado,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import {
  formatearEstadoSolicitud,
  formatearFechaHora,
  formatearMoneda,
  formatearTextoDominio,
} from "@/components/solicitudes-pago/solicitudes-pago.utils";
import styles from "./AprobacionesManager.module.css";

type HistorialAprobacionesListProps = {
  solicitudes: SolicitudPagoListado[];
  nivel: 1 | 2;
};

function obtenerClaseEstado(estado: EstadoSolicitudPago) {
  switch (estado) {
    case "PENDIENTE_APROBADOR_1":
      return styles.historyStatusPendingOne;
    case "PENDIENTE_APROBADOR_2":
      return styles.historyStatusPendingTwo;
    case "DEVUELTA_APROBADOR_1":
    case "DEVUELTA_SOLICITANTE":
      return styles.historyStatusReturned;
    case "PROGRAMADA_PAGO":
      return styles.historyStatusScheduled;
    case "PAGADA":
      return styles.historyStatusPaid;
    case "ANULADA":
      return styles.historyStatusCancelled;
    default:
      return styles.historyStatusDraft;
  }
}

export default function HistorialAprobacionesList({
  solicitudes,
  nivel,
}: HistorialAprobacionesListProps) {
  return (
    <section className={styles.historySection}>
      <div>
        <h2 className={styles.subtitle}>Solicitudes aprobadas por mí</h2>
        <p className={styles.helper}>
          Historial de solicitudes que aprobaste en el nivel {nivel}, con su
          estado actual dentro del proceso.
        </p>
      </div>

      {solicitudes.length === 0 ? (
        <div className={styles.estado}>
          Aún no has aprobado solicitudes en este nivel.
        </div>
      ) : (
        <>
          <div className={`${styles.tableWrapper} ${styles.historyDesktop}`}>
          <table className={`${styles.table} ${styles.historyTable}`}>
            <thead>
              <tr>
                <th>Solicitud</th>
                <th>Proyecto / Centro</th>
                <th>Beneficiario</th>
                <th>Tipo</th>
                <th>Valor neto</th>
                <th>Fecha de aprobación</th>
                <th>Estado actual</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((solicitud) => (
                <tr key={solicitud.id}>
                  <td>
                    <strong className={styles.historyRequestNumber}>
                      {solicitud.numero_solicitud ?? "Sin número"}
                    </strong>
                  </td>
                  <td>
                    <strong className={styles.historyPrimaryText}>
                      {solicitud.proyecto_base?.nombre ?? "Sin proyecto"}
                    </strong>
                    <span className={styles.historySecondaryText}>
                      {solicitud.centro_costo?.nombre ?? "Sin centro de costo"}
                    </span>
                  </td>
                  <td>
                    {solicitud.beneficiario?.nombre
                      ? formatearNombrePropio(solicitud.beneficiario.nombre)
                      : "Sin beneficiario"}
                  </td>
                  <td>{formatearTextoDominio(solicitud.tipo_solicitud)}</td>
                  <td className={styles.moneyCell}>
                    {formatearMoneda(solicitud.valor_neto)}
                  </td>
                  <td>
                    {formatearFechaHora(
                      nivel === 1
                        ? solicitud.aprobado_1_en
                        : solicitud.aprobado_2_en,
                    )}
                  </td>
                  <td>
                    <span
                      className={`${styles.detailStatus} ${obtenerClaseEstado(solicitud.estado_actual)}`}
                    >
                      {formatearEstadoSolicitud(solicitud.estado_actual)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className={styles.historyMobileList}>
            {solicitudes.map((solicitud) => (
              <article className={styles.historyMobileCard} key={solicitud.id}>
              <div className={styles.historyMobileHeader}>
                <strong className={styles.historyRequestNumber}>
                  {solicitud.numero_solicitud ?? "Sin número"}
                </strong>
                <span
                  className={`${styles.detailStatus} ${obtenerClaseEstado(solicitud.estado_actual)}`}
                >
                  {formatearEstadoSolicitud(solicitud.estado_actual)}
                </span>
              </div>
              <dl className={styles.historyMobileDetails}>
                <div>
                  <dt>Proyecto / Centro</dt>
                  <dd>
                    {solicitud.proyecto_base?.nombre ?? "Sin proyecto"}
                    <span>
                      {solicitud.centro_costo?.nombre ?? "Sin centro de costo"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Beneficiario</dt>
                  <dd>
                    {solicitud.beneficiario?.nombre
                      ? formatearNombrePropio(solicitud.beneficiario.nombre)
                      : "Sin beneficiario"}
                  </dd>
                </div>
                <div>
                  <dt>Tipo</dt>
                  <dd>{formatearTextoDominio(solicitud.tipo_solicitud)}</dd>
                </div>
                <div>
                  <dt>Fecha de aprobación</dt>
                  <dd>
                    {formatearFechaHora(
                      nivel === 1
                        ? solicitud.aprobado_1_en
                        : solicitud.aprobado_2_en,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Valor neto</dt>
                  <dd className={styles.historyMobileValue}>
                    {formatearMoneda(solicitud.valor_neto)}
                  </dd>
                </div>
              </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
