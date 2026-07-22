"use client";

import type { SolicitudPagoListado } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import styles from "./AprobacionesManager.module.css";

interface SolicitudesAprobacionListProps {
  solicitudes: SolicitudPagoListado[];
  idsSeleccionados: Set<string>;
  deshabilitado?: boolean;
  onCambiarSeleccion: (solicitudId: string) => void;
  onCambiarSeleccionTodas: () => void;
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
}: SolicitudesAprobacionListProps) {
  const todasSeleccionadas =
    solicitudes.length > 0 &&
    solicitudes.every((solicitud) =>
      idsSeleccionados.has(solicitud.id),
    );

  return (
    <div className={styles.tableWrapper}>
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
                className={
                  seleccionada ? styles.selectedRow : undefined
                }
              >
                <td>
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
                  {solicitud.beneficiario?.nombre ?? "—"}
                </td>

                <td>{solicitud.descripcion}</td>

                <td className={styles.moneyCell}>
                  {formatearMoneda(solicitud.valor_neto)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}