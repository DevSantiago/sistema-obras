import type { EventoHistorialSolicitudPago } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import styles from "./HistorialSolicitud.module.css";

const TITULOS: Record<string, string> = {
  CREACION_BORRADOR: "Solicitud creada",
  ENVIO_APROBACION: "Enviada a aprobación",
  APROBACION_NIVEL_1: "Aprobada en nivel 1",
  APROBACION_NIVEL_2: "Aprobada en nivel 2",
  DEVOLUCION: "Solicitud devuelta",
  REENVIO_APROBACION: "Solicitud reenviada",
  EDICION_SOLICITANTE: "Editada por el solicitante",
  EDICION_APROBADOR_1: "Editada por el aprobador nivel 1",
  ADJUNTO_CARGADO: "Adjunto cargado",
  PAGO_REGISTRADO: "Pago registrado",
  ANULACION: "Solicitud anulada",
};

const CAMPOS: Record<string, string> = {
  beneficiario_id: "Beneficiario",
  proveedor_id: "Proveedor",
  categoria_gasto: "Categoría de gasto",
  categoria_reembolso: "Categoría de reembolso",
  concepto_nomina: "Concepto de nómina",
  tipo_impuesto: "Tipo de impuesto",
  periodo_impuesto: "Periodo de impuesto",
  periodo_nomina: "Periodo de nómina",
  proyecto_base_id: "Proyecto",
  centro_costo_id: "Centro de costo",
  medio_pago: "Medio de pago",
  descripcion: "Descripción",
  valor_bruto: "Valor bruto",
  valor_retenciones: "Impuestos y retenciones",
  valor_descuentos: "Descuentos",
  valor_neto: "Valor neto",
};

type Cambio = { anterior?: unknown; nuevo?: unknown };

function obtenerCambios(cambios: unknown) {
  if (!cambios || typeof cambios !== "object" || Array.isArray(cambios)) {
    return [];
  }

  return Object.entries(cambios as Record<string, Cambio>);
}

function mostrarValor(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return "Sin dato";
  return String(valor).replaceAll("_", " ");
}

function formatearFecha(fecha: string | Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(fecha));
}

export default function HistorialSolicitud({
  eventos,
}: {
  eventos: EventoHistorialSolicitudPago[] | undefined;
}) {
  return (
    <section className={styles.section}>
      <h3>Historial de la solicitud</h3>
      {!eventos?.length ? (
        <p className={styles.empty}>Todavía no hay eventos registrados.</p>
      ) : (
        <ol className={styles.timeline}>
          {eventos.map((evento) => {
            const cambios = obtenerCambios(evento.cambios);
            return (
              <li className={styles.event} key={evento.id}>
                <span className={styles.dot} aria-hidden="true" />
                <div className={styles.content}>
                  <div className={styles.header}>
                    <strong>{TITULOS[evento.accion] ?? evento.accion.replaceAll("_", " ")}</strong>
                    <time dateTime={new Date(evento.creado_en).toISOString()}>
                      {formatearFecha(evento.creado_en)}
                    </time>
                  </div>
                  <p className={styles.description}>{evento.descripcion}</p>
                  <div className={styles.meta}>
                    {evento.usuario?.nombre ?? "Sistema"}
                    {evento.estado_anterior && evento.estado_nuevo && evento.estado_anterior !== evento.estado_nuevo
                      ? ` · ${evento.estado_anterior.replaceAll("_", " ")} → ${evento.estado_nuevo.replaceAll("_", " ")}`
                      : ""}
                  </div>
                  {cambios.length ? (
                    <details className={styles.changes}>
                      <summary>Ver campos modificados ({cambios.length})</summary>
                      <ul>
                        {cambios.map(([campo, cambio]) => (
                          <li key={campo}>
                            <strong>{CAMPOS[campo] ?? campo}:</strong>{" "}
                            {mostrarValor(cambio.anterior)} → {mostrarValor(cambio.nuevo)}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
