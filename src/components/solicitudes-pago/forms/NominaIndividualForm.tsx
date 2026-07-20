"use client";

import SelectorAdjuntos from "@/components/adjuntos/SelectorAdjuntos";
import type {
  BeneficiarioSolicitudCatalogo,
  CentroCostoSolicitudCatalogo,
  MedioPagoSolicitud,
  ProyectoBaseSolicitudCatalogo,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { type FormEvent, useMemo, useState } from "react";
import styles from "../SolicitudesPagoManager.module.css";
import type {
  CrearSolicitudNominaIndividualPayload,
  NominaIndividualFormularioState,
} from "../solicitudes-pago.types";
import {
  formatearMoneda,
  formatearTextoDominio,
  formatearValorEntrada,
  MEDIOS_PAGO,
  obtenerDocumentoBeneficiario,
  obtenerEtiquetaBeneficiario,
} from "../solicitudes-pago.utils";

type NominaIndividualFormProps = {
  proyectos: ProyectoBaseSolicitudCatalogo[];
  centrosCostoDisponibles: CentroCostoSolicitudCatalogo[];
  trabajadores: BeneficiarioSolicitudCatalogo[];
  cargandoCatalogos: boolean;
  guardando: boolean;
  mensajeExito: string;
  mensajeError: string;
  onProyectoChange: (proyectoBaseId: string) => void;
  onCrear: (
    payload: CrearSolicitudNominaIndividualPayload,
    archivos: File[],
  ) => Promise<void>;
  onLimpiarMensajes: () => void;
};

const CONCEPTOS_NOMINA = [
  "SALARIO",
  "HONORARIOS",
  "BONIFICACION",
  "AUXILIO",
  "LIQUIDACION",
  "OTRO",
] as const;

function obtenerPeriodoActualColombia(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const anio = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;

  if (!anio || !mes) {
    return "";
  }

  return `${anio}-${mes}`;
}

const PERIODO_ACTUAL = obtenerPeriodoActualColombia();

const ESTADO_INICIAL_NOMINA: NominaIndividualFormularioState = {
  proyecto_base_id: "",
  centro_costo_id: "",
  beneficiario_id: "",
  periodo_nomina: PERIODO_ACTUAL,
  concepto_nomina: "",
  medio_pago: "",
  descripcion: "",
  valor_bruto: "",
  valor_retenciones: "0",
  valor_descuentos: "0",
};

function convertirNumero(valor: string): number {
  const valorLimpio = valor.replaceAll(",", "").trim();

  if (!valorLimpio) {
    return 0;
  }

  const numero = Number(valorLimpio);

  return Number.isFinite(numero) ? numero : 0;
}

export default function NominaIndividualForm({
  proyectos,
  centrosCostoDisponibles,
  trabajadores,
  cargandoCatalogos,
  guardando,
  mensajeExito,
  mensajeError,
  onProyectoChange,
  onCrear,
  onLimpiarMensajes,
}: NominaIndividualFormProps) {
  const [form, setForm] = useState<NominaIndividualFormularioState>(
    ESTADO_INICIAL_NOMINA,
  );

  const [busquedaTrabajador, setBusquedaTrabajador] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);

  const trabajadoresFiltrados = useMemo(() => {
    const busqueda = busquedaTrabajador.trim().toLowerCase();

    if (!busqueda) {
      return trabajadores;
    }

    return trabajadores.filter((trabajador) => {
      const nombre = trabajador.nombre.toLowerCase();
      const tipoDocumento =
        trabajador.tipo_documento?.toLowerCase() ?? "";
      const numeroDocumento =
        trabajador.numero_documento?.toLowerCase() ?? "";
      const etiqueta = obtenerEtiquetaBeneficiario(trabajador).toLowerCase();

      return (
        nombre.includes(busqueda) ||
        tipoDocumento.includes(busqueda) ||
        numeroDocumento.includes(busqueda) ||
        etiqueta.includes(busqueda)
      );
    });
  }, [busquedaTrabajador, trabajadores]);

  const valores = useMemo(() => {
    const valorBruto = convertirNumero(form.valor_bruto);
    const valorRetenciones = convertirNumero(form.valor_retenciones);
    const valorDescuentos = convertirNumero(form.valor_descuentos);

    return {
      valorBruto,
      valorRetenciones,
      valorDescuentos,
      valorNeto: valorBruto - valorRetenciones - valorDescuentos,
    };
  }, [
    form.valor_bruto,
    form.valor_descuentos,
    form.valor_retenciones,
  ]);

  function actualizarCampo<K extends keyof NominaIndividualFormularioState>(
    campo: K,
    valor: NominaIndividualFormularioState[K],
  ) {
    setForm((formActual) => ({
      ...formActual,
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

  function actualizarCampoMoneda(
    campo:
      | "valor_bruto"
      | "valor_retenciones"
      | "valor_descuentos",
    valor: string,
  ) {
    actualizarCampo(campo, formatearValorEntrada(valor));
  }

  function manejarBusquedaTrabajador(valor: string) {
    setBusquedaTrabajador(valor);

    const valorNormalizado = valor.trim().toLowerCase();

    const trabajadorEncontrado =
      trabajadores.find(
        (trabajador) =>
          obtenerEtiquetaBeneficiario(trabajador).toLowerCase() ===
          valorNormalizado,
      ) ?? null;

    actualizarCampo(
      "beneficiario_id",
      trabajadorEncontrado?.id ?? "",
    );
  }

  function seleccionarTrabajador(
    trabajador: BeneficiarioSolicitudCatalogo,
  ) {
    setBusquedaTrabajador(obtenerEtiquetaBeneficiario(trabajador));
    actualizarCampo("beneficiario_id", trabajador.id);

    if (trabajador.medio_pago_preferido) {
      actualizarCampo(
        "medio_pago",
        trabajador.medio_pago_preferido,
      );
    }
  }

  function validarFormulario(): string | null {
    const camposFaltantes: string[] = [];

    if (!form.proyecto_base_id) {
      camposFaltantes.push("proyecto base");
    }

    if (!form.centro_costo_id) {
      camposFaltantes.push("centro de costo");
    }

    if (!form.beneficiario_id) {
      camposFaltantes.push("trabajador");
    }

    if (!form.periodo_nomina) {
      camposFaltantes.push("periodo de nómina");
    }

    if (!form.concepto_nomina) {
      camposFaltantes.push("concepto de nómina");
    }

    if (!form.medio_pago) {
      camposFaltantes.push("medio de pago");
    }

    if (!form.descripcion.trim()) {
      camposFaltantes.push("descripción");
    }

    if (camposFaltantes.length > 0) {
      return `Faltan campos obligatorios: ${camposFaltantes.join(", ")}.`;
    }

    const centroCostoSeleccionado = centrosCostoDisponibles.find(
      (centroCosto) => centroCosto.id === form.centro_costo_id,
    );

    if (!centroCostoSeleccionado) {
      return "El centro de costo seleccionado no está disponible para el proyecto base o para el usuario autenticado.";
    }

    const trabajadorSeleccionado = trabajadores.find(
      (trabajador) => trabajador.id === form.beneficiario_id,
    );

    if (!trabajadorSeleccionado) {
      return "Seleccione un trabajador válido.";
    }

    if (form.periodo_nomina > PERIODO_ACTUAL) {
      return "El periodo de nómina no puede ser posterior al mes actual.";
    }

    if (
      form.periodo_nomina.slice(0, 4) !== PERIODO_ACTUAL.slice(0, 4)
    ) {
      return "El periodo de nómina debe corresponder al año vigente.";
    }

    if (valores.valorBruto <= 0) {
      return "El valor bruto debe ser mayor a cero.";
    }

    if (
      valores.valorRetenciones < 0 ||
      valores.valorDescuentos < 0
    ) {
      return "Las retenciones y los descuentos no pueden ser negativos.";
    }

    if (valores.valorNeto < 0) {
      return "El valor neto de la nómina no puede ser negativo.";
    }

    return null;
  }

  async function manejarEnvio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errorFormulario = validarFormulario();

    if (errorFormulario) {
      throw new Error(errorFormulario);
    }

    const medioPago = form.medio_pago;

    if (!medioPago) {
      throw new Error("Seleccione un medio de pago válido.");
    }

    await onCrear(
      {
        tipo_solicitud: "PAGO_NOMINA",
        modalidad_nomina: "INDIVIDUAL",
        periodo_nomina: form.periodo_nomina,
        proyecto_base_id: form.proyecto_base_id,
        centro_costo_id: form.centro_costo_id,
        beneficiario_id: form.beneficiario_id,
        concepto_nomina: form.concepto_nomina,
        medio_pago: medioPago,
        descripcion: form.descripcion.trim(),
        valor_bruto: valores.valorBruto,
        valor_retenciones: valores.valorRetenciones,
        valor_descuentos: valores.valorDescuentos,
      },
      archivos,
    );

    setForm(ESTADO_INICIAL_NOMINA);
    setBusquedaTrabajador("");
    onProyectoChange("");
    setArchivos([]);
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
            Crear solicitud de nómina individual
          </h2>

          <p className={styles.formDescription}>
            Registra una solicitud en estado borrador para un trabajador.
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
              name="proyecto_base_id"
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
              name="centro_costo_id"
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
            <label
              className={styles.label}
              htmlFor="busqueda-trabajador"
            >
              Trabajador <strong aria-hidden="true">*</strong>
            </label>

            <div className={styles.combobox}>
              <input
                id="busqueda-trabajador"
                className={styles.input}
                type="text"
                value={busquedaTrabajador}
                onChange={(event) =>
                  manejarBusquedaTrabajador(event.target.value)
                }
                placeholder="Buscar por nombre o documento"
                autoComplete="off"
                disabled={cargandoCatalogos || guardando}
                required
              />

              <input
                type="hidden"
                name="beneficiario_id"
                value={form.beneficiario_id}
              />

              {busquedaTrabajador.trim() && !form.beneficiario_id ? (
                <div className={styles.comboboxDropdown}>
                  {trabajadoresFiltrados.length > 0 ? (
                    trabajadoresFiltrados
                      .slice(0, 8)
                      .map((trabajador) => {
                        const documento =
                          obtenerDocumentoBeneficiario(trabajador);

                        return (
                          <button
                            key={trabajador.id}
                            type="button"
                            className={styles.comboboxOption}
                            onClick={() =>
                              seleccionarTrabajador(trabajador)
                            }
                            disabled={guardando}
                          >
                            <strong className={styles.comboboxOptionName}>
                              {trabajador.nombre}
                            </strong>

                            <span className={styles.comboboxOptionDocument}>
                              {documento || "Sin documento registrado"}
                            </span>
                          </button>
                        );
                      })
                  ) : (
                    <p className={styles.comboboxEmpty}>
                      No se encontraron trabajadores.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>
              Periodo de nómina <strong aria-hidden="true">*</strong>
            </span>

            <input
              name="periodo_nomina"
              className={styles.input}
              type="month"
              value={form.periodo_nomina}
              max={PERIODO_ACTUAL}
              onChange={(event) =>
                actualizarCampo("periodo_nomina", event.target.value)
              }
              disabled={guardando}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              Concepto de nómina <strong aria-hidden="true">*</strong>
            </span>

            <select
              name="concepto_nomina"
              className={styles.input}
              value={form.concepto_nomina}
              onChange={(event) =>
                actualizarCampo("concepto_nomina", event.target.value)
              }
              disabled={guardando}
              required
            >
              <option value="">Selecciona un concepto</option>

              {CONCEPTOS_NOMINA.map((concepto) => (
                <option key={concepto} value={concepto}>
                  {formatearTextoDominio(concepto)}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              Medio de pago <strong aria-hidden="true">*</strong>
            </span>

            <select
              name="medio_pago"
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
              <option value="">Seleccione</option>

              {MEDIOS_PAGO.map((medioPago) => (
                <option key={medioPago} value={medioPago}>
                  {formatearTextoDominio(medioPago)}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              Valor bruto <strong aria-hidden="true">*</strong>
            </span>

            <input
              name="valor_bruto"
              className={styles.input}
              type="text"
              inputMode="numeric"
              value={form.valor_bruto}
              onChange={(event) =>
                actualizarCampoMoneda("valor_bruto", event.target.value)
              }
              disabled={guardando}
              placeholder="2,000,000"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Retenciones</span>

            <input
              name="valor_retenciones"
              className={styles.input}
              type="text"
              inputMode="numeric"
              value={form.valor_retenciones}
              onChange={(event) =>
                actualizarCampoMoneda(
                  "valor_retenciones",
                  event.target.value,
                )
              }
              disabled={guardando}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Descuentos</span>

            <input
              name="valor_descuentos"
              className={styles.input}
              type="text"
              inputMode="numeric"
              value={form.valor_descuentos}
              onChange={(event) =>
                actualizarCampoMoneda(
                  "valor_descuentos",
                  event.target.value,
                )
              }
              disabled={guardando}
            />
          </label>

          <div className={styles.netBox}>
            <strong className={styles.netLabel}>Valor neto</strong>

            <strong
              className={
                valores.valorNeto < 0 ? styles.netError : styles.net
              }
            >
              {formatearMoneda(valores.valorNeto)}
            </strong>
          </div>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>
            Descripción <strong aria-hidden="true">*</strong>
          </span>

          <textarea
            name="descripcion"
            className={styles.textarea}
            rows={4}
            value={form.descripcion}
            onChange={(event) =>
              actualizarCampo("descripcion", event.target.value)
            }
            disabled={guardando}
            placeholder="Describe el pago de nómina individual."
            required
          />
        </label>

        <SelectorAdjuntos
            id="soportes-nomina-individual"
            archivos={archivos}
            onChange={(archivosSeleccionados) => {
              setArchivos(archivosSeleccionados);
              onLimpiarMensajes();
            }}
            onError={(mensaje) => {
              window.dispatchEvent(
                new CustomEvent("solicitudes-pago-form-error", {
                  detail: mensaje,
                }),
              );
            }}
            disabled={guardando}
            titulo="Soportes de la nómina"
            ayuda="Adjunta contratos, cuentas de cobro, desprendibles, certificaciones bancarias u otros soportes. Formatos PDF, JPG, JPEG o PNG. Máximo 10 MB por archivo."
        />

        <div className={styles.actions}>
          <button className={styles.button} type="submit" disabled={guardando}>
            {guardando ? "Creando..." : "Crear solicitud"}
          </button>
        </div>
      </form>
    </section>
  );
}