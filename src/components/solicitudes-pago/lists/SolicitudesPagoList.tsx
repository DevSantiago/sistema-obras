import type { SolicitudPagoListado } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import styles from "../SolicitudesPagoManager.module.css";
import {
  formatearFecha,
  formatearMoneda,
  formatearTextoDominio,
} from "../solicitudes-pago.utils";

type SolicitudesPagoListProps = {
  solicitudes: SolicitudPagoListado[];
  cargando: boolean;
  onActualizar: () => void | Promise<void>;
};

export default function SolicitudesPagoList({
  solicitudes,
  cargando,
  onActualizar,
}: SolicitudesPagoListProps) {
  return (
    <section className={styles.card}>
      <div className={styles.tableHeader}>
        <h2 className={styles.sectionTitle}>Solicitudes creadas</h2>

        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => void onActualizar()}
          disabled={cargando}
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
                </tr>
              </thead>

              <tbody>
                {solicitudes.map((solicitud) => (
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
                        {formatearTextoDominio(solicitud.categoria_gasto)}
                      </span>

                      <span className={styles.muted}>
                        {formatearTextoDominio(solicitud.medio_pago)}
                      </span>
                    </td>

                    <td>
                      <span className={styles.valueLine}>
                        Valor bruto:{" "}
                        {formatearMoneda(solicitud.valor_bruto)}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileList}>
            {solicitudes.map((solicitud) => (
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
                      {formatearTextoDominio(solicitud.categoria_gasto)}
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
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}