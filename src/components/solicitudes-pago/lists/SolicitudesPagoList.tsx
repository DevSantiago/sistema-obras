import type {
  SolicitudPagoListado,
  UsuarioSesionSolicitudesPago,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { useMemo, useState } from "react";
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
  onEditar: (solicitud: SolicitudPagoListado) => void;
  onDevolver: (solicitud: SolicitudPagoListado) => void | Promise<void>;
  onVerDetalle: (solicitud: SolicitudPagoListado) => void;
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
  const estadoPermitido =
    solicitud.estado_actual === "BORRADOR" ||
    solicitud.estado_actual === "DEVUELTA_SOLICITANTE" ||
    solicitud.estado_actual === "DEVUELTA_APROBADOR_1";

  if (!estadoPermitido) return false;

  if (solicitud.estado_actual === "DEVUELTA_APROBADOR_1") {
    return (
      usuario.permisos?.includes("APROBAR_NIVEL_1") ||
      usuario.roles.includes("ADMINISTRADOR")
    );
  }

  return (
    solicitud.creado_por === usuario.id ||
    usuario.roles.includes("ADMINISTRADOR")
  );
}

function usuarioPuedeEditarSolicitud(
  solicitud: SolicitudPagoListado,
  usuario: UsuarioSesionSolicitudesPago,
): boolean {
  if (
    solicitud.estado_actual !== "BORRADOR" &&
    solicitud.estado_actual !== "DEVUELTA_SOLICITANTE"
  ) {
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
  onEditar,
  onDevolver,
  onVerDetalle,
  onActualizar,
}: SolicitudesPagoListProps) {
  const [proyectoFiltro, setProyectoFiltro] = useState("");
  const [centroFiltro, setCentroFiltro] = useState("");

  const proyectosFiltro = useMemo(() => {
    const proyectos = new Map<string, string>();
    for (const solicitud of solicitudes) {
      proyectos.set(
        solicitud.proyecto_base_id,
        solicitud.proyecto_base?.nombre ?? "Proyecto sin nombre",
      );
    }
    return Array.from(proyectos, ([id, nombre]) => ({ id, nombre })).sort(
      (a, b) => a.nombre.localeCompare(b.nombre, "es"),
    );
  }, [solicitudes]);

  const centrosFiltro = useMemo(() => {
    const centros = new Map<string, string>();
    for (const solicitud of solicitudes) {
      if (proyectoFiltro && solicitud.proyecto_base_id !== proyectoFiltro) continue;
      centros.set(
        solicitud.centro_costo_id,
        solicitud.centro_costo?.nombre ?? "Centro sin nombre",
      );
    }
    return Array.from(centros, ([id, nombre]) => ({ id, nombre })).sort(
      (a, b) => a.nombre.localeCompare(b.nombre, "es"),
    );
  }, [proyectoFiltro, solicitudes]);

  const solicitudesFiltradas = useMemo(
    () =>
      solicitudes.filter(
        (solicitud) =>
          (!proyectoFiltro || solicitud.proyecto_base_id === proyectoFiltro) &&
          (!centroFiltro || solicitud.centro_costo_id === centroFiltro),
      ),
    [centroFiltro, proyectoFiltro, solicitudes],
  );

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

      <div className={styles.listFilters}>
        <label>
          <span>Proyecto</span>
          <select
            value={proyectoFiltro}
            onChange={(event) => {
              setProyectoFiltro(event.target.value);
              setCentroFiltro("");
            }}
          >
            <option value="">Todos los proyectos</option>
            {proyectosFiltro.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Centro de costo</span>
          <select
            value={centroFiltro}
            onChange={(event) => setCentroFiltro(event.target.value)}
          >
            <option value="">Todos los centros</option>
            {centrosFiltro.map((centro) => (
              <option key={centro.id} value={centro.id}>
                {centro.nombre}
              </option>
            ))}
          </select>
        </label>

        {(proyectoFiltro || centroFiltro) ? (
          <button
            className={styles.clearFiltersButton}
            type="button"
            onClick={() => {
              setProyectoFiltro("");
              setCentroFiltro("");
            }}
          >
            Limpiar filtros
          </button>
        ) : null}
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
      ) : solicitudesFiltradas.length === 0 ? (
        <div className={styles.empty}>
          <h2>Sin resultados</h2>
          <p>No hay solicitudes asociadas a los filtros seleccionados.</p>
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
                {solicitudesFiltradas.map((solicitud) => {
                  const puedeEnviar = usuarioPuedeEnviarSolicitud(
                    solicitud,
                    usuario,
                  );
                  const enviando = enviandoSolicitudId === solicitud.id;

                  return (
                    <tr
                      key={solicitud.id}
                      className={styles.clickableRow}
                      onClick={() => onVerDetalle(solicitud)}
                    >
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

                      <td onClick={(event) => event.stopPropagation()}>
                        <div className={styles.rowActions}>
                          {usuarioPuedeEditarSolicitud(solicitud, usuario) ? (
                            <button
                              className={styles.editButton}
                              type="button"
                              onClick={() => onEditar(solicitud)}
                              disabled={enviandoSolicitudId !== null}
                            >
                              Editar
                            </button>
                          ) : null}

                          {puedeEnviar ? (
                            <button
                              className={styles.sendButton}
                              type="button"
                              onClick={() => manejarEnvio(solicitud)}
                              disabled={enviandoSolicitudId !== null}
                            >
                              {enviando ? "Enviando..." : "Enviar solicitud"}
                            </button>
                          ) : null}

                          {solicitud.estado_actual === "DEVUELTA_APROBADOR_1" ? (
                            <button
                              className={styles.editButton}
                              type="button"
                              onClick={() => void onDevolver(solicitud)}
                              disabled={enviandoSolicitudId !== null}
                            >
                              Devolver al solicitante
                            </button>
                          ) : null}

                          {!usuarioPuedeEditarSolicitud(solicitud, usuario) &&
                          !puedeEnviar ? (
                            <span className={styles.noActions}>—</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileList}>
            {solicitudesFiltradas.map((solicitud) => {
              const puedeEnviar = usuarioPuedeEnviarSolicitud(
                solicitud,
                usuario,
              );
              const puedeEditar = usuarioPuedeEditarSolicitud(
                solicitud,
                usuario,
              );
              const enviando = enviandoSolicitudId === solicitud.id;

              return (
                <article
                  className={`${styles.mobileCard} ${styles.clickableCard}`}
                  key={solicitud.id}
                  onClick={() => onVerDetalle(solicitud)}
                >
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
                    {solicitud.ultima_devolucion ? (
                      <div>
                        <dt>Motivo de devolución</dt>
                        <dd>{solicitud.ultima_devolucion.motivo}</dd>
                      </div>
                    ) : null}
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

                  {puedeEditar || puedeEnviar ? (
                    <div
                      className={styles.mobileActions}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {puedeEditar ? (
                        <button
                          className={styles.editButton}
                          type="button"
                          onClick={() => onEditar(solicitud)}
                          disabled={enviandoSolicitudId !== null}
                        >
                          Editar
                        </button>
                      ) : null}

                      {puedeEnviar ? (
                        <button
                          className={styles.sendButton}
                          type="button"
                          onClick={() => manejarEnvio(solicitud)}
                          disabled={enviandoSolicitudId !== null}
                        >
                          {enviando ? "Enviando..." : "Enviar solicitud"}
                        </button>
                      ) : null}
                      {solicitud.estado_actual === "DEVUELTA_APROBADOR_1" ? (
                        <button
                          className={styles.editButton}
                          type="button"
                          onClick={() => void onDevolver(solicitud)}
                          disabled={enviandoSolicitudId !== null}
                        >
                          Devolver al solicitante
                        </button>
                      ) : null}
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
