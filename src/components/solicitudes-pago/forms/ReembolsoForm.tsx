"use client";

import type { ReembolsoFormularioState } from "@/components/solicitudes-pago/solicitudes-pago.types";
import {
  CATEGORIAS_REEMBOLSO,
  type BeneficiarioSolicitudCatalogo,
  type CategoriaReembolso,
  type CentroCostoSolicitudCatalogo,
  type MedioPagoSolicitud,
  type ProyectoBaseSolicitudCatalogo,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import styles from "../SolicitudesPagoManager.module.css";
import {
  buscarBeneficiarioPorEtiqueta,
  formatearMoneda,
  formatearTextoDominio,
  formatearValorEntrada,
  MEDIOS_PAGO,
  obtenerDocumentoBeneficiario,
  obtenerEtiquetaBeneficiario,
} from "../solicitudes-pago.utils";

const MAXIMO_ARCHIVOS = 10;
const TAMANO_MAXIMO_ARCHIVO = 10 * 1024 * 1024;

const TIPOS_MIME_PERMITIDOS = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

const ESTADO_INICIAL: ReembolsoFormularioState = {
  proyecto_base_id: "",
  centro_costo_id: "",
  beneficiario_id: "",
  categoria_reembolso: "",
  medio_pago: "",
  descripcion: "",
  valor_bruto: "",
  valor_impuestos: "",
  valor_retenciones: "",
  valor_descuentos: "",
  archivos: [],
};

type ReembolsoFormProps = {
  proyectos: ProyectoBaseSolicitudCatalogo[];
  centrosCostoDisponibles: CentroCostoSolicitudCatalogo[];
  trabajadores: BeneficiarioSolicitudCatalogo[];
  cargandoCatalogos: boolean;
  guardando: boolean;
  mensajeExito: string;
  mensajeError: string;
  onProyectoChange: (proyectoBaseId: string) => void;
  onCrear: (formData: FormData) => Promise<void>;
  onLimpiarMensajes: () => void;
};

function convertirValorMoneda(valor: string): number {
  const valorNormalizado = valor.replace(/[^\d]/g, "");

  if (!valorNormalizado) {
    return 0;
  }

  return Number(valorNormalizado);
}

function obtenerNombreArchivoSeguro(archivo: File): string {
  return archivo.name || "archivo-sin-nombre";
}

export default function ReembolsoForm({
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
}: ReembolsoFormProps) {
  const [form, setForm] = useState<ReembolsoFormularioState>(ESTADO_INICIAL);
  const [busquedaBeneficiario, setBusquedaBeneficiario] = useState("");
  const [inputArchivosKey, setInputArchivosKey] = useState(0);

  const trabajadoresFiltrados = useMemo(() => {
    const busqueda = busquedaBeneficiario.trim().toLowerCase();

    if (!busqueda) {
      return trabajadores;
    }

    return trabajadores.filter((trabajador) => {
      const nombre = trabajador.nombre.toLowerCase();
      const tipoDocumento = trabajador.tipo_documento?.toLowerCase() ?? "";
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
  }, [busquedaBeneficiario, trabajadores]);

  const valores = useMemo(() => {
    const valorBruto = convertirValorMoneda(form.valor_bruto);
    const valorImpuestos = convertirValorMoneda(form.valor_impuestos);
    const valorRetenciones = convertirValorMoneda(form.valor_retenciones);
    const valorDescuentos = convertirValorMoneda(form.valor_descuentos);
    const valorNeto =
      valorBruto + valorImpuestos - valorRetenciones - valorDescuentos;

    return {
      valorBruto,
      valorImpuestos,
      valorRetenciones,
      valorDescuentos,
      valorNeto,
    };
  }, [
    form.valor_bruto,
    form.valor_descuentos,
    form.valor_impuestos,
    form.valor_retenciones,
  ]);

  function actualizarCampo<K extends keyof ReembolsoFormularioState>(
    campo: K,
    valor: ReembolsoFormularioState[K],
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

  function actualizarCampoMoneda(
    campo:
      | "valor_bruto"
      | "valor_impuestos"
      | "valor_retenciones"
      | "valor_descuentos",
    valor: string,
  ) {
    actualizarCampo(campo, formatearValorEntrada(valor));
  }

  function manejarBusquedaBeneficiario(valor: string) {
    setBusquedaBeneficiario(valor);

    const trabajadorEncontrado = buscarBeneficiarioPorEtiqueta(
      trabajadores,
      valor,
    );

    actualizarCampo("beneficiario_id", trabajadorEncontrado?.id ?? "");
  }

  function seleccionarBeneficiario(
    trabajador: BeneficiarioSolicitudCatalogo,
  ) {
    setBusquedaBeneficiario(obtenerEtiquetaBeneficiario(trabajador));
    actualizarCampo("beneficiario_id", trabajador.id);
  }

  function manejarArchivos(event: ChangeEvent<HTMLInputElement>) {
    const archivosSeleccionados = Array.from(event.target.files ?? []);

    if (archivosSeleccionados.length === 0) {
      actualizarCampo("archivos", []);
      return;
    }

    if (archivosSeleccionados.length > MAXIMO_ARCHIVOS) {
      throw new Error(
        `Puede adjuntar máximo ${MAXIMO_ARCHIVOS} soportes por solicitud.`,
      );
    }

    const archivoTipoInvalido = archivosSeleccionados.find(
      (archivo) => !TIPOS_MIME_PERMITIDOS.has(archivo.type),
    );

    if (archivoTipoInvalido) {
      throw new Error(
        `El archivo "${obtenerNombreArchivoSeguro(
          archivoTipoInvalido,
        )}" no tiene un formato permitido. Use PDF, JPG, JPEG o PNG.`,
      );
    }

    const archivoDemasiadoGrande = archivosSeleccionados.find(
      (archivo) => archivo.size > TAMANO_MAXIMO_ARCHIVO,
    );

    if (archivoDemasiadoGrande) {
      throw new Error(
        `El archivo "${obtenerNombreArchivoSeguro(
          archivoDemasiadoGrande,
        )}" supera el tamaño máximo de 10 MB.`,
      );
    }

    actualizarCampo("archivos", archivosSeleccionados);
  }

  function eliminarArchivo(indice: number) {
    actualizarCampo(
      "archivos",
      form.archivos.filter((_, indiceActual) => indiceActual !== indice),
    );
    setInputArchivosKey((actual) => actual + 1);
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
      camposFaltantes.push("beneficiario trabajador");
    }

    if (!form.categoria_reembolso) {
      camposFaltantes.push("categoría de reembolso");
    }

    if (!form.medio_pago) {
      camposFaltantes.push("medio de pago");
    }

    if (!form.descripcion.trim()) {
      camposFaltantes.push("descripción del gasto");
    }

    if (form.archivos.length === 0) {
      camposFaltantes.push("al menos un soporte");
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
      return "Seleccione un beneficiario trabajador válido.";
    }

    if (valores.valorBruto <= 0) {
      return "El valor del gasto debe ser mayor a cero.";
    }

    if (
      valores.valorImpuestos < 0 ||
      valores.valorRetenciones < 0 ||
      valores.valorDescuentos < 0
    ) {
      return "Impuestos, retenciones y descuentos no pueden ser negativos.";
    }

    if (valores.valorNeto < 0) {
      return "El valor a reembolsar no puede ser negativo.";
    }

    return null;
  }

  async function manejarEnvio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errorFormulario = validarFormulario();

    if (errorFormulario) {
      throw new Error(errorFormulario);
    }

    const formData = new FormData();

    formData.set("proyecto_base_id", form.proyecto_base_id);
    formData.set("centro_costo_id", form.centro_costo_id);
    formData.set("beneficiario_id", form.beneficiario_id);
    formData.set("categoria_reembolso", form.categoria_reembolso);
    formData.set("medio_pago", form.medio_pago);
    formData.set("descripcion", form.descripcion.trim());
    formData.set("valor_bruto", String(valores.valorBruto));
    formData.set("valor_impuestos", String(valores.valorImpuestos));
    formData.set("valor_retenciones", String(valores.valorRetenciones));
    formData.set("valor_descuentos", String(valores.valorDescuentos));

    form.archivos.forEach((archivo) => {
      formData.append("archivos", archivo);
    });

    await onCrear(formData);

    setForm(ESTADO_INICIAL);
    setBusquedaBeneficiario("");
    setInputArchivosKey((actual) => actual + 1);
    onProyectoChange("");
  }

  async function manejarEnvioSeguro(event: FormEvent<HTMLFormElement>) {
    try {
      await manejarEnvio(event);
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent("solicitudes-pago-form-error", {
          detail:
            error instanceof Error
              ? error.message
              : "No fue posible validar el formulario de reembolso.",
        }),
      );
    }
  }

  function manejarArchivosSeguro(event: ChangeEvent<HTMLInputElement>) {
    try {
      manejarArchivos(event);
    } catch (error) {
      event.target.value = "";

      window.dispatchEvent(
        new CustomEvent("solicitudes-pago-form-error", {
          detail:
            error instanceof Error
              ? error.message
              : "No fue posible validar los soportes seleccionados.",
        }),
      );
    }
  }

  return (
    <section className={styles.card}>
      <form className={styles.form} onSubmit={manejarEnvioSeguro}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            Crear solicitud de reembolso
          </h2>

          <p className={styles.formDescription}>
            Registra el reintegro de gastos asumidos por un trabajador y
            adjunta los soportes correspondientes.
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
            <label className={styles.label} htmlFor="busqueda-reembolsado">
              Beneficiario trabajador <strong aria-hidden="true">*</strong>
            </label>

            <div className={styles.combobox}>
              <input
                id="busqueda-reembolsado"
                className={styles.input}
                type="text"
                value={busquedaBeneficiario}
                onChange={(event) =>
                  manejarBusquedaBeneficiario(event.target.value)
                }
                placeholder="Buscar por nombre o documento"
                autoComplete="off"
                disabled={cargandoCatalogos || guardando}
                required
              />

              {busquedaBeneficiario.trim() && !form.beneficiario_id ? (
                <div className={styles.comboboxDropdown}>
                  {trabajadoresFiltrados.length > 0 ? (
                    trabajadoresFiltrados.slice(0, 8).map((trabajador) => {
                      const documento =
                        obtenerDocumentoBeneficiario(trabajador);

                      return (
                        <button
                          key={trabajador.id}
                          type="button"
                          className={styles.comboboxOption}
                          onClick={() => seleccionarBeneficiario(trabajador)}
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
              Categoría de reembolso <strong aria-hidden="true">*</strong>
            </span>

            <select
              className={styles.input}
              value={form.categoria_reembolso}
              onChange={(event) =>
                actualizarCampo(
                  "categoria_reembolso",
                  event.target.value as CategoriaReembolso | "",
                )
              }
              disabled={guardando}
              required
            >
              <option value="">Selecciona una categoría</option>

              {CATEGORIAS_REEMBOLSO.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {formatearTextoDominio(categoria)}
                </option>
              ))}
            </select>
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
              Valor del gasto <strong aria-hidden="true">*</strong>
            </span>

            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              value={form.valor_bruto}
              onChange={(event) =>
                actualizarCampoMoneda("valor_bruto", event.target.value)
              }
              disabled={guardando}
              placeholder="100,000"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Impuestos</span>

            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              value={form.valor_impuestos}
              onChange={(event) =>
                actualizarCampoMoneda("valor_impuestos", event.target.value)
              }
              disabled={guardando}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Retenciones</span>

            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              value={form.valor_retenciones}
              onChange={(event) =>
                actualizarCampoMoneda("valor_retenciones", event.target.value)
              }
              disabled={guardando}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Descuentos</span>

            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              value={form.valor_descuentos}
              onChange={(event) =>
                actualizarCampoMoneda("valor_descuentos", event.target.value)
              }
              disabled={guardando}
            />
          </label>

          <div className={styles.netBox}>
            <strong className={styles.netLabel}>Valor a reembolsar</strong>

            <strong
              className={valores.valorNeto < 0 ? styles.netError : styles.net}
            >
              {formatearMoneda(valores.valorNeto)}
            </strong>
          </div>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>
            Descripción del gasto <strong aria-hidden="true">*</strong>
          </span>

          <textarea
            className={styles.textarea}
            rows={4}
            value={form.descripcion}
            onChange={(event) =>
              actualizarCampo("descripcion", event.target.value)
            }
            disabled={guardando}
            placeholder="Describe el gasto realizado y el motivo del reembolso."
            required
          />
        </label>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="soportes-reembolso">
            Soportes <strong aria-hidden="true">*</strong>
          </label>

          <input
            key={inputArchivosKey}
            id="soportes-reembolso"
            className={styles.fileInput}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            multiple
            onChange={manejarArchivosSeguro}
            disabled={guardando}
            required={form.archivos.length === 0}
          />

          <p className={styles.fieldHelp}>
            Adjunta entre 1 y 10 archivos PDF, JPG, JPEG o PNG. Máximo 10 MB
            por archivo.
          </p>

          {form.archivos.length > 0 ? (
            <ul className={styles.fileList}>
              {form.archivos.map((archivo, indice) => (
                <li
                  key={`${archivo.name}-${archivo.size}-${indice}`}
                  className={styles.fileItem}
                >
                  <span className={styles.fileName}>
                    {obtenerNombreArchivoSeguro(archivo)}
                  </span>

                  <span className={styles.fileSize}>
                    {(archivo.size / 1024 / 1024).toFixed(2)} MB
                  </span>

                  <button
                    type="button"
                    className={styles.fileRemoveButton}
                    onClick={() => eliminarArchivo(indice)}
                    disabled={guardando}
                    aria-label={`Eliminar ${obtenerNombreArchivoSeguro(
                      archivo,
                    )}`}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button className={styles.button} type="submit" disabled={guardando}>
            {guardando ? "Creando..." : "Crear solicitud"}
          </button>
        </div>
      </form>
    </section>
  );
}
