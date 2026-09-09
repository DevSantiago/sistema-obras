"use client";

import type { SolicitudPagoListado } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { formatearNombrePropio } from "@/lib/text-format";
import styles from "./AprobacionesManager.module.css";

interface SolicitudesAprobacionListProps {
  solicitudes: SolicitudPagoListado[];
  idsSeleccionados: Set<string>;
  deshabilitado?: boolean;
  onCambiarSeleccion: (solicitudId: string) => void;
  onCambiarSeleccionTodas: () => void;
  onDevolver: (solicitud: SolicitudPagoListado) => void;
  onVerDetalle: (solicitud: SolicitudPagoListado) => void;
  onEditar?: (solicitud: SolicitudPagoListado) => void;
}

const FORMATEADOR_MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatearMoneda(valor: number): string {
  return FORMATEADOR_MONEDA.format(valor);
}

export function calcularTotalSolicitudes(
  solicitudes: SolicitudPagoListado[],
) {
  return solicitudes.reduce(
    (total, solicitud) => total + solicitud.valor_neto,
    0,
  );
}

function obtenerNombreTipoSolicitud(
  solicitud: SolicitudPagoListado,
): string {
  if (
    solicitud.tipo_solicitud === "PAGO_NOMINA" &&
    solicitud.modalidad_nomina === "INDIVIDUAL"
  ) {
    return "Nómina individual";
  }

  if (
    solicitud.tipo_solicitud === "PAGO_NOMINA" &&
    solicitud.modalidad_nomina === "AGRUPADA_EXCEL"
  ) {
    return "Nómina grupal";
  }

  switch (solicitud.tipo_solicitud) {
    case "PAGO_PROVEEDOR":
      return "Pago a proveedor";

    case "PAGO_IMPUESTO":
      return "Pago de impuesto";

    case "REEMBOLSO":
      return "Reembolso";

    case "OTRO_PAGO":
      return "Otro pago";

    default:
      return solicitud.tipo_solicitud;
  }
}

export default function SolicitudesAprobacionList({
  solicitudes,
  idsSeleccionados,
  deshabilitado = false,
  onCambiarSeleccion,
  onCambiarSeleccionTodas,
  onDevolver,
  onVerDetalle,
  onEditar,
}: SolicitudesAprobacionListProps) {
  const todasSeleccionadas =
    solicitudes.length > 0 &&
    solicitudes.every((solicitud) =>
      idsSeleccionados.has(solicitud.id),
    );
  const totalSolicitudes = calcularTotalSolicitudes(solicitudes);

  return (
    <>
    <div className={`${styles.tableWrapper} ${styles.approvalDesktop}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>
              <label>
                <span className={styles.visuallyHidden}>
                  Seleccionar todas las solicitudes
                </span>

                <input
                  type="checkbox"
                  checked={todasSeleccionadas}
                  disabled={deshabilitado || solicitudes.length === 0}
                  onChange={onCambiarSeleccionTodas}
                  aria-label="Seleccionar todas las solicitudes"
                />
              </label>
            </th>

            <th>Número</th>
            <th>Tipo</th>
            <th>Centro de costo</th>
            <th>Beneficiario</th>
            <th>Descripción</th>
            <th>Valor neto</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {solicitudes.map((solicitud) => {
            const seleccionada = idsSeleccionados.has(
              solicitud.id,
            );

            return (
              <tr
                key={solicitud.id}
                onClick={() => onVerDetalle(solicitud)}
                className={
                  `${styles.clickableRow} ${seleccionada ? styles.selectedRow : ""}`
                }
              >
                <td onClick={(event) => event.stopPropagation()}>
                  <label>
                    <span className={styles.visuallyHidden}>
                      Seleccionar solicitud{" "}
                      {solicitud.numero_solicitud}
                    </span>

                    <input
                      type="checkbox"
                      checked={seleccionada}
                      disabled={deshabilitado}
                      onChange={() =>
                        onCambiarSeleccion(solicitud.id)
                      }
                      aria-label={`Seleccionar solicitud ${solicitud.numero_solicitud}`}
                    />
                  </label>
                </td>

                <td>
                  <strong>{solicitud.numero_solicitud}</strong>
                </td>

                <td>
                  {obtenerNombreTipoSolicitud(solicitud)}
                </td>

                <td>
                  {solicitud.centro_costo?.nombre ?? "—"}
                </td>

                <td>
                  {solicitud.beneficiario?.nombre
                    ? formatearNombrePropio(solicitud.beneficiario.nombre)
                    : "—"}
                </td>

                <td>{solicitud.descripcion}</td>

                <td className={styles.moneyCell}>
                  {formatearMoneda(solicitud.valor_neto)}
                </td>
                <td onClick={(event) => event.stopPropagation()}>
                  <div className={styles.rowActions}>
                    {onEditar && solicitud.modalidad_nomina !== "AGRUPADA_EXCEL" ? (
                      <button
                        className={styles.editButton}
                        disabled={deshabilitado}
                        type="button"
                        onClick={() => onEditar(solicitud)}
                      >
                        Editar
                      </button>
                    ) : null}
                    <button
                      className={styles.returnButton}
                      disabled={deshabilitado}
                      type="button"
                      onClick={() => onDevolver(solicitud)}
                    >
                      Devolver
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6} className={styles.totalLabel}>
              Total solicitudes ({solicitudes.length})
            </td>
            <td className={styles.totalValue}>
              {formatearMoneda(totalSolicitudes)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
    <div className={styles.approvalMobileList}>
      <div className={styles.approvalMobileSummary}>
        <label className={styles.selectAll}>
          <input
            type="checkbox"
            checked={todasSeleccionadas}
            disabled={deshabilitado || solicitudes.length === 0}
            onChange={onCambiarSeleccionTodas}
          />
          Seleccionar todas
        </label>
        <strong>{formatearMoneda(totalSolicitudes)}</strong>
      </div>

      {solicitudes.map((solicitud) => {
        const seleccionada = idsSeleccionados.has(solicitud.id);

        return (
          <article
            key={solicitud.id}
            className={`${styles.approvalMobileCard} ${
              seleccionada ? styles.selectedRow : ""
            }`}
            onClick={() => onVerDetalle(solicitud)}
          >
            <div className={styles.approvalMobileHeader}>
              <label onClick={(event) => event.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={seleccionada}
                  disabled={deshabilitado}
                  onChange={() => onCambiarSeleccion(solicitud.id)}
                  aria-label={`Seleccionar solicitud ${solicitud.numero_solicitud}`}
                />
              </label>
              <strong className={styles.approvalRequestNumber}>
                {solicitud.numero_solicitud}
              </strong>
              <strong className={styles.approvalMobileValue}>
                {formatearMoneda(solicitud.valor_neto)}
              </strong>
            </div>

            <dl className={styles.approvalMobileDetails}>
              <div>
                <dt>Tipo</dt>
                <dd>{obtenerNombreTipoSolicitud(solicitud)}</dd>
              </div>
              <div>
                <dt>Centro de costo</dt>
                <dd>{solicitud.centro_costo?.nombre ?? "—"}</dd>
              </div>
              <div>
                <dt>Beneficiario</dt>
                <dd>
                  {solicitud.beneficiario?.nombre
                    ? formatearNombrePropio(solicitud.beneficiario.nombre)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Descripción</dt>
                <dd>{solicitud.descripcion}</dd>
              </div>
            </dl>

            <div
              className={styles.approvalMobileActions}
              onClick={(event) => event.stopPropagation()}
            >
              {onEditar && solicitud.modalidad_nomina !== "AGRUPADA_EXCEL" ? (
                <button
                  className={styles.editButton}
                  disabled={deshabilitado}
                  type="button"
                  onClick={() => onEditar(solicitud)}
                >
                  Editar
                </button>
              ) : null}
              <button
                className={styles.returnButton}
                disabled={deshabilitado}
                type="button"
                onClick={() => onDevolver(solicitud)}
              >
                Devolver
              </button>
            </div>
          </article>
        );
      })}
    </div>
    </>
  );
}
