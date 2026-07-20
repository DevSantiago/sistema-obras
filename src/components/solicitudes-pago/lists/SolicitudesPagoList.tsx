import type {
  SolicitudPagoListado,
  UsuarioSesionSolicitudesPago,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import styles from "../SolicitudesPagoManager.module.css";
import {
  formatearFecha,
  formatearMoneda,
  formatearTextoDominio,
} from "../solicitudes-pago.utils";

type SolicitudesPagoListProps = {
  solicitudes: SolicitudPagoListado[];
  usuario: UsuarioSesionSolicitudesPago;
  cargando: boolean;
  enviandoSolicitudId: string | null;
  onEnviar: (solicitudId: string) => void | Promise<void>;
  onActualizar: () => void | Promise<void>;
};

function obtenerCategoriaSolicitud(
  solicitud: SolicitudPagoListado,
): string | null {
  switch (solicitud.tipo_solicitud) {
    case "PAGO_PROVEEDOR":
      return solicitud.categoria_gasto;

    case "PAGO_IMPUESTO":
      return solicitud.tipo_impuesto;

    case "REEMBOLSO":
      return solicitud.categoria_reembolso;

    case "PAGO_NOMINA":
      if (solicitud.modalidad_nomina === "INDIVIDUAL") {
        return solicitud.concepto_nomina ?? "NOMINA_INDIVIDUAL";
      }

      return solicitud.concepto_nomina ?? "NOMINA_GRUPAL";

    default:
      return null;
  }
}

function usuarioPuedeEnviarSolicitud(
  solicitud: SolicitudPagoListado,
  usuario: UsuarioSesionSolicitudesPago,
): boolean {
  if (solicitud.estado_actual !== "BORRADOR") {
    return false;
  }

  return (
    solicitud.creado_por === usuario.id ||
    usuario.roles.includes("ADMINISTRADOR")
  );
}

function confirmarEnvio(solicitud: SolicitudPagoListado): boolean {
  return window.confirm(
    `¿Está seguro de enviar la solicitud ${solicitud.numero_solicitud} para aprobación?`,
  );
}

export default function SolicitudesPagoList({
  solicitudes,
  usuario,
  cargando,
  enviandoSolicitudId,
  onEnviar,
  onActualizar,
}: SolicitudesPagoListProps) {
  function manejarEnvio(solicitud: SolicitudPagoListado) {
    if (!confirmarEnvio(solicitud)) {
      return;
    }

    void onEnviar(solicitud.id);
  }

  return (
    <section className={styles.card}>
      <div className={styles.tableHeader}>
        <h2 className={styles.sectionTitle}>Solicitudes creadas</h2>

        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => void onActualizar()}
          disabled={cargando || enviandoSolicitudId !== null}
        >
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {cargando ? (
        <div className={styles.empty}>
          <h2>Cargando solicitudes</h2>
          <p>Estamos consultando las solicitudes de pago registradas.</p>
        </div>
      ) : solicitudes.length === 0 ? (
        <div className={styles.empty}>
          <h2>No hay solicitudes registradas</h2>

          <p>
            Cuando crees una solicitud de pago, aparecerá en este listado.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.desktopTable}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Solicitud</th>
                  <th>Proyecto / Centro</th>
                  <th>Beneficiario</th>
                  <th>Categoría</th>
                  <th>Valores</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {solicitudes.map((solicitud) => {
                  const puedeEnviar = usuarioPuedeEnviarSolicitud(
                    solicitud,
                    usuario,
                  );
                  const enviando = enviandoSolicitudId === solicitud.id;

                  return (
                    <tr key={solicitud.id}>
                      <td>
                        <strong className={styles.requestNumber}>
                          {solicitud.numero_solicitud}
                        </strong>

                        <span className={styles.muted}>
                          {formatearTextoDominio(solicitud.tipo_solicitud)}
                        </span>
                      </td>

                      <td>
                        <strong className={styles.primaryText}>
                          {solicitud.proyecto_base?.nombre ?? "Sin proyecto"}
                        </strong>

                        <span className={styles.muted}>
                          {solicitud.centro_costo?.nombre ?? "Sin centro"}
                        </span>

                        <span className={styles.muted}>
                          {solicitud.centro_costo?.linea_negocio ?? "-"} ·{" "}
                          {solicitud.centro_costo?.fase_centro_costo ?? "-"}
                        </span>
                      </td>

                      <td>
                        <strong className={styles.primaryText}>
                          {solicitud.beneficiario?.nombre ?? "Sin beneficiario"}
                        </strong>

                        <span className={styles.muted}>
                          {solicitud.beneficiario?.tipo_documento ?? "-"}{" "}
                          {solicitud.beneficiario?.numero_documento ?? ""}
                        </span>
                      </td>

                      <td>
                        <span className={styles.badge}>
                          {formatearTextoDominio(
                            obtenerCategoriaSolicitud(solicitud),
                          )}
                        </span>

                        <span className={styles.muted}>
                          {formatearTextoDominio(solicitud.medio_pago)}
                        </span>
                      </td>

                      <td>
                        <span className={styles.valueLine}>
                          Valor bruto: {formatearMoneda(solicitud.valor_bruto)}
                        </span>

                        <strong className={styles.valueLine}>
                          A pagar: {formatearMoneda(solicitud.valor_neto)}
                        </strong>
                      </td>

                      <td>
                        <span className={styles.status}>
                          {formatearTextoDominio(solicitud.estado_actual)}
                        </span>
                      </td>

                      <td>{formatearFecha(solicitud.creado_en)}</td>

                      <td>
                        <div className={styles.rowActions}>
                          {puedeEnviar ? (
                            <button
                              className={styles.sendButton}
                              type="button"
                              onClick={() => manejarEnvio(solicitud)}
                              disabled={enviandoSolicitudId !== null}
                            >
                              {enviando ? "Enviando..." : "Enviar solicitud"}
                            </button>
                          ) : (
                            <span className={styles.noActions}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileList}>
            {solicitudes.map((solicitud) => {
              const puedeEnviar = usuarioPuedeEnviarSolicitud(
                solicitud,
                usuario,
              );
              const enviando = enviandoSolicitudId === solicitud.id;

              return (
                <article className={styles.mobileCard} key={solicitud.id}>
                  <div className={styles.mobileHeader}>
                    <div>
                      <h3>{solicitud.numero_solicitud}</h3>
                      <p>{formatearFecha(solicitud.creado_en)}</p>
                    </div>

                    <span className={styles.status}>
                      {formatearTextoDominio(solicitud.estado_actual)}
                    </span>
                  </div>

                  <dl className={styles.mobileDetails}>
                    <div>
                      <dt>Tipo</dt>
                      <dd>
                        {formatearTextoDominio(solicitud.tipo_solicitud)}
                      </dd>
                    </div>

                    <div>
                      <dt>Proyecto</dt>
                      <dd>
                        {solicitud.proyecto_base?.nombre ?? "Sin proyecto"}
                      </dd>
                    </div>

                    <div>
                      <dt>Centro</dt>
                      <dd>{solicitud.centro_costo?.nombre ?? "Sin centro"}</dd>
                    </div>

                    <div>
                      <dt>Beneficiario</dt>
                      <dd>
                        {solicitud.beneficiario?.nombre ?? "Sin beneficiario"}
                      </dd>
                    </div>

                    <div>
                      <dt>Categoría</dt>
                      <dd>
                        {formatearTextoDominio(
                          obtenerCategoriaSolicitud(solicitud),
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Medio de pago</dt>
                      <dd>{formatearTextoDominio(solicitud.medio_pago)}</dd>
                    </div>

                    <div>
                      <dt>Valor bruto</dt>
                      <dd>{formatearMoneda(solicitud.valor_bruto)}</dd>
                    </div>

                    <div>
                      <dt>
                        <strong>Valor a pagar</strong>
                      </dt>

                      <dd>
                        <strong>{formatearMoneda(solicitud.valor_neto)}</strong>
                      </dd>
                    </div>
                  </dl>

                  {puedeEnviar ? (
                    <div className={styles.mobileActions}>
                      <button
                        className={styles.sendButton}
                        type="button"
                        onClick={() => manejarEnvio(solicitud)}
                        disabled={enviandoSolicitudId !== null}
                      >
                        {enviando ? "Enviando..." : "Enviar solicitud"}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
