"use client";

import type {
  BeneficiarioSolicitudCatalogo,
  SolicitudPagoListado,
  SolicitudesPagoApiResponse,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import {
  CATEGORIAS_REEMBOLSO,
  TIPOS_IMPUESTO_SOLICITUD,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { CATEGORIAS_GASTO, MEDIOS_PAGO } from "@/components/solicitudes-pago/solicitudes-pago.utils";
import SelectorAdjuntos from "@/components/adjuntos/SelectorAdjuntos";
import { formatearNombrePropio } from "@/lib/text-format";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./AprobacionesManager.module.css";

const CONCEPTOS_NOMINA = [
  "SALARIO",
  "HONORARIOS",
  "BONIFICACION",
  "AUXILIO",
  "LIQUIDACION",
  "OTRO",
];

type Props = {
  solicitud: SolicitudPagoListado;
  onCancelar: () => void;
  onGuardada: () => Promise<void>;
};

function obtenerCategoria(solicitud: SolicitudPagoListado) {
  return solicitud.categoria_gasto ??
    solicitud.categoria_reembolso ??
    solicitud.concepto_nomina ??
    solicitud.tipo_impuesto ??
    "";
}

function obtenerOpcionesCategoria(solicitud: SolicitudPagoListado): readonly string[] {
  switch (solicitud.tipo_solicitud) {
    case "PAGO_PROVEEDOR":
      return CATEGORIAS_GASTO;
    case "REEMBOLSO":
      return CATEGORIAS_REEMBOLSO;
    case "PAGO_NOMINA":
      return CONCEPTOS_NOMINA;
    case "PAGO_IMPUESTO":
      return TIPOS_IMPUESTO_SOLICITUD;
    default:
      return [];
  }
}

function etiquetaCategoria(solicitud: SolicitudPagoListado) {
  switch (solicitud.tipo_solicitud) {
    case "REEMBOLSO": return "Categoría de reembolso";
    case "PAGO_NOMINA": return "Concepto de nómina";
    case "PAGO_IMPUESTO": return "Tipo de impuesto";
    default: return "Categoría de gasto";
  }
}

export default function EdicionAprobadorNivel1Form({
  solicitud,
  onCancelar,
  onGuardada,
}: Props) {
  const [beneficiarios, setBeneficiarios] = useState<BeneficiarioSolicitudCatalogo[]>([]);
  const [beneficiarioId, setBeneficiarioId] = useState(solicitud.beneficiario_id ?? "");
  const [categoria, setCategoria] = useState(obtenerCategoria(solicitud));
  const [medioPago, setMedioPago] = useState(solicitud.medio_pago ?? "");
  const [descripcion, setDescripcion] = useState(solicitud.descripcion);
  const [valorBruto, setValorBruto] = useState(String(solicitud.valor_bruto));
  const [valorRetenciones, setValorRetenciones] = useState(String(solicitud.valor_retenciones));
  const [valorDescuentos, setValorDescuentos] = useState(String(solicitud.valor_descuentos));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/v1/beneficiarios?activo=true", {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json() as SolicitudesPagoApiResponse<
          BeneficiarioSolicitudCatalogo[] | { beneficiarios: BeneficiarioSolicitudCatalogo[] }
        >;
        if (!response.ok || !body.ok) throw new Error(body.message);
        const data = body.data;
        setBeneficiarios(Array.isArray(data) ? data : data?.beneficiarios ?? []);
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) {
          setError(cause instanceof Error ? cause.message : "No fue posible cargar los beneficiarios.");
        }
      });

    return () => controller.abort();
  }, []);

  const beneficiariosPermitidos = useMemo(() => {
    if (solicitud.tipo_solicitud === "PAGO_PROVEEDOR") {
      return beneficiarios.filter((beneficiario) =>
        ["PROVEEDOR", "OTRO"].includes(
          beneficiario.tipo_beneficiario,
        ),
      );
    }

    const tipoEsperado = solicitud.tipo_solicitud === "PAGO_NOMINA" || solicitud.tipo_solicitud === "REEMBOLSO"
        ? "TRABAJADOR"
        : null;

    return tipoEsperado
      ? beneficiarios.filter((beneficiario) => beneficiario.tipo_beneficiario === tipoEsperado)
      : beneficiarios;
  }, [beneficiarios, solicitud.tipo_solicitud]);

  const valorNeto = Math.max(
    0,
    Number(valorBruto || 0) - Number(valorRetenciones || 0) - Number(valorDescuentos || 0),
  );

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando) return;

    setGuardando(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("beneficiario_id", beneficiarioId);
      formData.append("categoria", categoria);
      formData.append("medio_pago", medioPago);
      formData.append("descripcion", descripcion);
      formData.append("valor_bruto", valorBruto);
      formData.append("valor_retenciones", valorRetenciones);
      formData.append("valor_descuentos", valorDescuentos);
      archivos.forEach((archivo) => formData.append("archivos", archivo));

      const response = await fetch(
        `/api/v1/solicitudes-pago/${solicitud.id}/editar-nivel-1`,
        {
          method: "PATCH",
          credentials: "include",
          body: formData,
        },
      );
      const body = await response.json() as SolicitudesPagoApiResponse<unknown>;
      if (!response.ok || !body.ok) {
        throw new Error(body.message ?? "No fue posible guardar los cambios.");
      }

      await onGuardada();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className={styles.modalBackdrop} role="presentation">
      <form className={styles.editDialog} role="dialog" aria-modal="true" onSubmit={guardar}>
        <div className={styles.detailHeader}>
          <div>
            <span className={styles.detailEyebrow}>Aprobación nivel 1</span>
            <h2>Editar solicitud</h2>
            <p className={styles.editReference}>{solicitud.numero_solicitud}</p>
          </div>
          <button className={styles.closeButton} type="button" onClick={onCancelar} aria-label="Cerrar edición">×</button>
        </div>

        <div className={styles.immutableNotice}>
          Proyecto, centro de costo, tipo, número y solicitante permanecen bloqueados.
        </div>

        <section className={styles.editSection}>
          <div className={styles.editSectionHeader}>
            <h3>Datos de la solicitud</h3>
            <p>Corrige la información funcional que revisará el siguiente nivel.</p>
          </div>
          <div className={styles.editGrid}>
            <label>
              <span>Beneficiario *</span>
              <select required value={beneficiarioId} onChange={(event) => setBeneficiarioId(event.target.value)}>
                <option value="">Seleccionar</option>
                {beneficiariosPermitidos.map((beneficiario) => (
                  <option key={beneficiario.id} value={beneficiario.id}>
                    {formatearNombrePropio(beneficiario.nombre)} · {beneficiario.numero_documento ?? "Sin documento"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{etiquetaCategoria(solicitud)} *</span>
              <select required value={categoria} onChange={(event) => setCategoria(event.target.value)}>
                <option value="">Seleccionar</option>
                {obtenerOpcionesCategoria(solicitud).map((opcion) => (
                  <option key={opcion} value={opcion}>{opcion.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Medio de pago *</span>
              <select required value={medioPago} onChange={(event) => setMedioPago(event.target.value)}>
                <option value="">Seleccionar</option>
                {MEDIOS_PAGO.map((medio) => <option key={medio} value={medio}>{medio}</option>)}
              </select>
            </label>
            <label className={styles.editWide}>
              <span>Concepto de pago *</span>
              <textarea required rows={3} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
            </label>
          </div>
        </section>

        <section className={styles.editSection}>
          <div className={styles.editSectionHeader}>
            <h3>Valores</h3>
            <p>El valor neto se actualiza automáticamente antes de guardar.</p>
          </div>
          <div className={styles.valuesEditGrid}>
            <label><span>Valor bruto *</span><input required min="0.01" step="0.01" type="number" value={valorBruto} onChange={(event) => setValorBruto(event.target.value)} /></label>
            <label><span>Impuestos y retenciones *</span><input required min="0" step="0.01" type="number" value={valorRetenciones} onChange={(event) => setValorRetenciones(event.target.value)} /></label>
            <label><span>Descuentos *</span><input required min="0" step="0.01" type="number" value={valorDescuentos} onChange={(event) => setValorDescuentos(event.target.value)} /></label>
            <div className={styles.netPreview}><span>Valor neto recalculado</span><strong>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valorNeto)}</strong></div>
          </div>
        </section>

        <section className={styles.editSection}>
          <div className={styles.editSectionHeader}>
            <h3>Soportes adicionales</h3>
            <p>Los archivos nuevos se agregan sin reemplazar los existentes.</p>
          </div>
          <SelectorAdjuntos
            id={`adjuntos-nivel-1-${solicitud.id}`}
            archivos={archivos}
            onChange={setArchivos}
            onError={setError}
            disabled={guardando}
            titulo="Seleccionar soportes"
            ayuda="Opcional. PDF, JPG, JPEG o PNG; máximo 10 MB por archivo."
          />
        </section>

        {error ? <div className={styles.returnError} role="alert">{error}</div> : null}

        <div className={`${styles.dialogActions} ${styles.editDialogActions}`}>
          <button className={styles.refreshButton} type="button" onClick={onCancelar} disabled={guardando}>Cancelar</button>
          <button className={styles.approveButton} type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</button>
        </div>
      </form>
    </div>
  );
}
