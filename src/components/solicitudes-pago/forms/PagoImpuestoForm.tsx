"use client";

import SelectorAdjuntos from "@/components/adjuntos/SelectorAdjuntos";
import {
  TIPOS_IMPUESTO_SOLICITUD,
  BeneficiarioSolicitudCatalogo,
  CentroCostoSolicitudCatalogo,
  MedioPagoSolicitud,
  ProyectoBaseSolicitudCatalogo,
  TipoImpuestoSolicitud,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { type FormEvent, useMemo, useState } from "react";
import styles from "../SolicitudesPagoManager.module.css";
import type {
  CrearSolicitudPagoImpuestoPayload,
  PagoImpuestoFormularioState,
} from "../solicitudes-pago.types";
import {
  formatearMoneda,
  formatearTextoDominio,
  formatearValorEntrada,
  MEDIOS_PAGO,
  obtenerDocumentoBeneficiario,
  obtenerEtiquetaBeneficiario,
} from "../solicitudes-pago.utils";

type PagoImpuestoFormProps = {
  proyectos: ProyectoBaseSolicitudCatalogo[];
  centrosCostoDisponibles: CentroCostoSolicitudCatalogo[];
  entidadesRecaudadoras: BeneficiarioSolicitudCatalogo[];
  cargandoCatalogos: boolean;
  guardando: boolean;
  mensajeExito: string;
  mensajeError: string;
  onProyectoChange: (proyectoBaseId: string) => void;
  onCrear: (
    payload: CrearSolicitudPagoImpuestoPayload,
    archivos: File[],
  ) => Promise<void>;
  onLimpiarMensajes: () => void;
};

function obtenerPeriodoActualColombia(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const anio = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;

  return anio && mes ? `${anio}-${mes}` : "";
}

const PERIODO_ACTUAL = obtenerPeriodoActualColombia();

const ESTADO_INICIAL: PagoImpuestoFormularioState = {
  proyecto_base_id: "",
  centro_costo_id: "",
  beneficiario_id: "",
  tipo_impuesto: "",
  periodo_impuesto: PERIODO_ACTUAL,
  medio_pago: "",
  descripcion: "",
  valor_bruto: "",
  archivos: [],
};

function convertirNumero(valor: string): number {
  const valorLimpio = valor.replaceAll(",", "").trim();

  if (!valorLimpio) {
    return 0;
  }

  const numero = Number(valorLimpio);

  return Number.isFinite(numero) ? numero : 0;
}

export default function PagoImpuestoForm({
  proyectos,
  centrosCostoDisponibles,
  entidadesRecaudadoras,
  cargandoCatalogos,
  guardando,
  mensajeExito,
  mensajeError,
  onProyectoChange,
  onCrear,
  onLimpiarMensajes,
}: PagoImpuestoFormProps) {
  const [form, setForm] = useState<PagoImpuestoFormularioState>(
    ESTADO_INICIAL,
  );
  const [busquedaEntidad, setBusquedaEntidad] = useState("");

  const entidadesFiltradas = useMemo(() => {
    const busqueda = busquedaEntidad.trim().toLowerCase();

    if (!busqueda) {
      return entidadesRecaudadoras;
    }

    return entidadesRecaudadoras.filter((entidad) => {
      const nombre = entidad.nombre.toLowerCase();
      const tipoDocumento = entidad.tipo_documento?.toLowerCase() ?? "";
      const numeroDocumento =
        entidad.numero_documento?.toLowerCase() ?? "";
      const etiqueta = obtenerEtiquetaBeneficiario(entidad).toLowerCase();

      return (
        nombre.includes(busqueda) ||
        tipoDocumento.includes(busqueda) ||
        numeroDocumento.includes(busqueda) ||
        etiqueta.includes(busqueda)
      );
    });
  }, [busquedaEntidad, entidadesRecaudadoras]);

  const valorBruto = useMemo(
    () => convertirNumero(form.valor_bruto),
    [form.valor_bruto],
  );

  function actualizarCampo<K extends keyof PagoImpuestoFormularioState>(
    campo: K,
    valor: PagoImpuestoFormularioState[K],
  ) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
      ...(campo === "proyecto_base_id"
        ? {
            centro_costo_id: "",
          }
        : {}),
    }));

    if (campo === "proyecto_base_id") {
      onProyectoChange(String(valor));
    }

    onLimpiarMensajes();
  }

  function manejarBusquedaEntidad(valor: string) {
    setBusquedaEntidad(valor);

    const valorNormalizado = valor.trim().toLowerCase();
    const entidadEncontrada =
      entidadesRecaudadoras.find(
        (entidad) =>
          obtenerEtiquetaBeneficiario(entidad).toLowerCase() ===
          valorNormalizado,
      ) ?? null;

    actualizarCampo(
      "beneficiario_id",
      entidadEncontrada?.id ?? "",
    );
  }

  function seleccionarEntidad(entidad: BeneficiarioSolicitudCatalogo) {
    setBusquedaEntidad(obtenerEtiquetaBeneficiario(entidad));
    actualizarCampo("beneficiario_id", entidad.id);

    if (entidad.medio_pago_preferido) {
      actualizarCampo("medio_pago", entidad.medio_pago_preferido);
    }
  }

  function validarFormulario(): string | null {
    const faltantes: string[] = [];

    if (!form.proyecto_base_id) faltantes.push("proyecto base");
    if (!form.centro_costo_id) faltantes.push("centro de costo");
    if (!form.beneficiario_id) faltantes.push("entidad recaudadora");
    if (!form.tipo_impuesto) faltantes.push("tipo de impuesto");
    if (!form.periodo_impuesto) faltantes.push("periodo del impuesto");
    if (!form.medio_pago) faltantes.push("medio de pago");
    if (!form.descripcion.trim()) faltantes.push("descripción");

    if (faltantes.length > 0) {
      return `Faltan campos obligatorios: ${faltantes.join(", ")}.`;
    }

    const centroCostoSeleccionado = centrosCostoDisponibles.find(
      (centroCosto) => centroCosto.id === form.centro_costo_id,
    );

    if (!centroCostoSeleccionado) {
      return "El centro de costo seleccionado no está disponible para el proyecto base o para el usuario autenticado.";
    }

    const entidadSeleccionada = entidadesRecaudadoras.find(
      (entidad) => entidad.id === form.beneficiario_id,
    );

    if (!entidadSeleccionada) {
      return "Seleccione una entidad recaudadora válida.";
    }

    if (form.periodo_impuesto > PERIODO_ACTUAL) {
      return "El periodo del impuesto no puede ser posterior al mes actual.";
    }

    if (
      form.periodo_impuesto.slice(0, 4) !== PERIODO_ACTUAL.slice(0, 4)
    ) {
      return "El periodo del impuesto debe corresponder al año vigente.";
    }

    if (valorBruto <= 0) {
      return "El valor del impuesto debe ser mayor a cero.";
    }

    return null;
  }

  async function manejarEnvio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validarFormulario();

    if (error) {
      throw new Error(error);
    }

    if (!form.tipo_impuesto || !form.medio_pago) {
      throw new Error("Seleccione un tipo de impuesto y medio de pago válidos.");
    }

    await onCrear(
      {
        tipo_solicitud: "PAGO_IMPUESTO",
        proyecto_base_id: form.proyecto_base_id,
        centro_costo_id: form.centro_costo_id,
        beneficiario_id: form.beneficiario_id,
        tipo_impuesto: form.tipo_impuesto,
        periodo_impuesto: form.periodo_impuesto,
        medio_pago: form.medio_pago,
        descripcion: form.descripcion.trim(),
        valor_bruto: valorBruto,
      },
      form.archivos,
    );

    setForm(ESTADO_INICIAL);
    setBusquedaEntidad("");
    onProyectoChange("");
  }

  async function manejarEnvioSeguro(event: FormEvent<HTMLFormElement>) {
    try {
      await manejarEnvio(event);
    } catch (error) {
      if (error instanceof Error) {
        window.dispatchEvent(
          new CustomEvent("solicitudes-pago-form-error", {
            detail: error.message,
          }),
        );
      }
    }
  }

  return (
    <section className={styles.card}>
      <form className={styles.form} onSubmit={manejarEnvioSeguro}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            Crear solicitud de pago de impuesto
          </h2>

          <p className={styles.formDescription}>
            Registra una obligación tributaria en estado borrador para una
            entidad recaudadora.
          </p>
        </div>

        {mensajeExito ? (
          <p className={styles.success}>{mensajeExito}</p>
        ) : null}

        {mensajeError ? <p className={styles.error}>{mensajeError}</p> : null}

        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>
              Proyecto base <strong aria-hidden="true">*</strong>
            </span>

            <select
              className={styles.input}
              value={form.proyecto_base_id}
              onChange={(event) =>
                actualizarCampo("proyecto_base_id", event.target.value)
              }
              disabled={cargandoCatalogos || guardando}
              required
            >
              <option value="">Selecciona un proyecto</option>

              {proyectos.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              Centro de costo <strong aria-hidden="true">*</strong>
            </span>

            <select
              className={styles.input}
              value={form.centro_costo_id}
              onChange={(event) =>
                actualizarCampo("centro_costo_id", event.target.value)
              }
              disabled={
                cargandoCatalogos ||
                guardando ||
                !form.proyecto_base_id ||
                centrosCostoDisponibles.length === 0
              }
              required
            >
              <option value="">
                {form.proyecto_base_id
                  ? "Selecciona un centro de costo"
                  : "Selecciona primero un proyecto"}
              </option>

              {centrosCostoDisponibles.map((centroCosto) => (
                <option key={centroCosto.id} value={centroCosto.id}>
                  {centroCosto.nombre} · {centroCosto.linea_negocio} ·{" "}
                  {centroCosto.fase_centro_costo}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="busqueda-entidad">
              Entidad recaudadora <strong aria-hidden="true">*</strong>
            </label>

            <div className={styles.combobox}>
              <input
                id="busqueda-entidad"
                className={styles.input}
                type="text"
                value={busquedaEntidad}
                onChange={(event) =>
                  manejarBusquedaEntidad(event.target.value)
                }
                placeholder="Busca por nombre o documento"
                autoComplete="off"
                disabled={cargandoCatalogos || guardando}
              />

              {busquedaEntidad && !form.beneficiario_id ? (
                <div className={styles.comboboxDropdown}>
                  {entidadesFiltradas.length > 0 ? (
                    entidadesFiltradas.map((entidad) => (
                      <button
                        key={entidad.id}
                        type="button"
                        className={styles.comboboxOption}
                        onClick={() => seleccionarEntidad(entidad)}
                      >
                        <span className={styles.comboboxOptionName}>
                          {entidad.nombre}
                        </span>

                        <span className={styles.comboboxOptionDocument}>
                          {obtenerDocumentoBeneficiario(entidad)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className={styles.comboboxEmpty}>
                      No se encontraron entidades recaudadoras.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>
              Tipo de impuesto <strong aria-hidden="true">*</strong>
            </span>

            <select
              className={styles.input}
              value={form.tipo_impuesto}
              onChange={(event) =>
                actualizarCampo(
                  "tipo_impuesto",
                  event.target.value as TipoImpuestoSolicitud | "",
                )
              }
              disabled={guardando}
              required
            >
              <option value="">Selecciona un tipo</option>

              {TIPOS_IMPUESTO_SOLICITUD.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {formatearTextoDominio(tipo)}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              Periodo del impuesto <strong aria-hidden="true">*</strong>
            </span>

            <input
              className={styles.input}
              type="month"
              value={form.periodo_impuesto}
              max={PERIODO_ACTUAL}
              onChange={(event) =>
                actualizarCampo("periodo_impuesto", event.target.value)
              }
              disabled={guardando}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              Medio de pago <strong aria-hidden="true">*</strong>
            </span>

            <select
              className={styles.input}
              value={form.medio_pago}
              onChange={(event) =>
                actualizarCampo(
                  "medio_pago",
                  event.target.value as MedioPagoSolicitud | "",
                )
              }
              disabled={guardando}
              required
            >
              <option value="">Selecciona un medio de pago</option>

              {MEDIOS_PAGO.map((medioPago) => (
                <option key={medioPago} value={medioPago}>
                  {formatearTextoDominio(medioPago)}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              Valor del impuesto <strong aria-hidden="true">*</strong>
            </span>

            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              value={form.valor_bruto}
              onChange={(event) =>
                actualizarCampo(
                  "valor_bruto",
                  formatearValorEntrada(event.target.value),
                )
              }
              placeholder="0"
              disabled={guardando}
              required
            />

            <span className={styles.muted}>
              {formatearMoneda(valorBruto)}
            </span>
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>
            Descripción <strong aria-hidden="true">*</strong>
          </span>

          <textarea
            className={styles.textarea}
            rows={3}
            value={form.descripcion}
            onChange={(event) =>
              actualizarCampo("descripcion", event.target.value)
            }
            placeholder="Describe la obligación tributaria que se pagará"
            disabled={guardando}
            required
          />
        </label>

        <div className={styles.netBox}>
          <span className={styles.netLabel}>Valor total solicitado</span>
          <strong className={styles.net}>
            {formatearMoneda(valorBruto)}
          </strong>
        </div>

        <SelectorAdjuntos
          id="soportes-impuesto"
          archivos={form.archivos}
          onChange={(archivos) => actualizarCampo("archivos", archivos)}
          onError={(mensaje) => {
            window.dispatchEvent(
              new CustomEvent("solicitudes-pago-form-error", {
                detail: mensaje,
              }),
            );
          }}
          disabled={guardando}
          titulo="Soportes del impuesto"
          ayuda="Adjunta declaraciones, recibos oficiales, formularios tributarios u otros soportes. Formatos PDF, JPG, JPEG o PNG. Máximo 10 MB por archivo."
        />

        <div className={styles.actions}>
          <button
            className={styles.button}
            type="submit"
            disabled={guardando || cargandoCatalogos}
          >
            {guardando ? "Creando solicitud..." : "Crear solicitud"}
          </button>
        </div>
      </form>
    </section>
  );
}
