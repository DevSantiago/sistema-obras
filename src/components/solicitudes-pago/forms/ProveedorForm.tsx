"use client";
import type { CrearSolicitudProveedorPayload } from "@/components/solicitudes-pago/solicitudes-pago.types";
import type {
  BeneficiarioSolicitudCatalogo,
  CentroCostoSolicitudCatalogo,
  MedioPagoSolicitud,
  ProyectoBaseSolicitudCatalogo,
  SolicitudPagoFormularioState,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { type FormEvent, useMemo, useState } from "react";
import styles from "../SolicitudesPagoManager.module.css";
import {
  buscarBeneficiarioPorEtiqueta,
  calcularValoresSolicitudPago,
  CATEGORIAS_GASTO,
  construirFormularioDesdeFormData,
  ESTADO_INICIAL_FORMULARIO,
  formatearMoneda,
  formatearTextoDominio,
  formatearValorEntrada,
  MEDIOS_PAGO,
  obtenerDocumentoBeneficiario,
  obtenerEtiquetaBeneficiario,
  type ValoresSolicitudPago,
} from "../solicitudes-pago.utils";


type ProveedorFormProps = {
  proyectos: ProyectoBaseSolicitudCatalogo[];
  centrosCostoDisponibles: CentroCostoSolicitudCatalogo[];
  beneficiarios: BeneficiarioSolicitudCatalogo[];
  cargandoCatalogos: boolean;
  guardando: boolean;
  mensajeExito: string;
  mensajeError: string;
  onProyectoChange: (proyectoBaseId: string) => void;
  onCrear: (payload: CrearSolicitudProveedorPayload) => Promise<void>;
  onLimpiarMensajes: () => void;
};

export default function ProveedorForm({
  proyectos,
  centrosCostoDisponibles,
  beneficiarios,
  cargandoCatalogos,
  guardando,
  mensajeExito,
  mensajeError,
  onProyectoChange,
  onCrear,
  onLimpiarMensajes,
}: ProveedorFormProps) {
  const [form, setForm] = useState<SolicitudPagoFormularioState>(
    ESTADO_INICIAL_FORMULARIO,
  );

  const [busquedaBeneficiario, setBusquedaBeneficiario] = useState("");

  const beneficiariosFiltrados = useMemo(() => {
    const busqueda = busquedaBeneficiario.trim().toLowerCase();

    if (!busqueda) {
      return beneficiarios;
    }

    return beneficiarios.filter((beneficiario) => {
      const nombre = beneficiario.nombre.toLowerCase();
      const tipoDocumento =
        beneficiario.tipo_documento?.toLowerCase() ?? "";
      const numeroDocumento =
        beneficiario.numero_documento?.toLowerCase() ?? "";
      const etiqueta = obtenerEtiquetaBeneficiario(beneficiario).toLowerCase();

      return (
        nombre.includes(busqueda) ||
        tipoDocumento.includes(busqueda) ||
        numeroDocumento.includes(busqueda) ||
        etiqueta.includes(busqueda)
      );
    });
  }, [beneficiarios, busquedaBeneficiario]);

  const { valorNeto } = calcularValoresSolicitudPago(form);

  function actualizarCampo<K extends keyof SolicitudPagoFormularioState>(
    campo: K,
    valor: SolicitudPagoFormularioState[K],
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
      | "valor_impuestos"
      | "valor_retenciones"
      | "valor_descuentos",
    valor: string,
  ) {
    actualizarCampo(campo, formatearValorEntrada(valor));
  }

  function manejarBusquedaBeneficiario(valor: string) {
    setBusquedaBeneficiario(valor);

    const beneficiarioEncontrado = buscarBeneficiarioPorEtiqueta(
      beneficiarios,
      valor,
    );

    actualizarCampo("beneficiario_id", beneficiarioEncontrado?.id ?? "");
  }

  function seleccionarBeneficiario(
    beneficiario: BeneficiarioSolicitudCatalogo,
  ) {
    setBusquedaBeneficiario(obtenerEtiquetaBeneficiario(beneficiario));
    actualizarCampo("beneficiario_id", beneficiario.id);
  }

  function validarFormulario(
    formulario: SolicitudPagoFormularioState,
    valores: ValoresSolicitudPago,
  ): string | null {
    const camposFaltantes: string[] = [];

    if (!formulario.proyecto_base_id) {
      camposFaltantes.push("proyecto base");
    }

    if (!formulario.centro_costo_id) {
      camposFaltantes.push("centro de costo");
    }

    if (!formulario.beneficiario_id) {
      camposFaltantes.push("beneficiario proveedor");
    }

    if (!formulario.categoria_gasto) {
      camposFaltantes.push("categoría de gasto");
    }

    if (!formulario.medio_pago) {
      camposFaltantes.push("medio de pago");
    }

    if (!formulario.descripcion.trim()) {
      camposFaltantes.push("concepto de pago");
    }

    if (camposFaltantes.length > 0) {
      return `Faltan campos obligatorios: ${camposFaltantes.join(", ")}.`;
    }

    const centroCostoSeleccionado = centrosCostoDisponibles.find(
      (centroCosto) => centroCosto.id === formulario.centro_costo_id,
    );

    if (!centroCostoSeleccionado) {
      return "El centro de costo seleccionado no está disponible para el proyecto base o para el usuario autenticado.";
    }

    const beneficiarioSeleccionado = beneficiarios.find(
      (beneficiario) => beneficiario.id === formulario.beneficiario_id,
    );

    if (!beneficiarioSeleccionado) {
      return "Seleccione un beneficiario proveedor válido.";
    }

    if (valores.valorBruto <= 0) {
      return "El valor de la factura debe ser mayor a cero.";
    }

    if (
      valores.valorImpuestos < 0 ||
      valores.valorRetenciones < 0 ||
      valores.valorDescuentos < 0
    ) {
      return "Impuestos, retenciones y descuentos no pueden ser negativos.";
    }

    if (valores.valorNeto < 0) {
      return "El valor a pagar no puede ser negativo.";
    }

    return null;
  }

  async function manejarEnvio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formulario = construirFormularioDesdeFormData(
      new FormData(event.currentTarget),
    );

    const valores = calcularValoresSolicitudPago(formulario);
    const errorFormulario = validarFormulario(formulario, valores);

    setForm(formulario);

    if (errorFormulario) {
      throw new Error(errorFormulario);
    }

    const medioPago = formulario.medio_pago;

    if (!medioPago) {
      throw new Error("Seleccione un medio de pago válido.");
    }

    await onCrear({
      tipo_solicitud: "PAGO_PROVEEDOR",
      proyecto_base_id: formulario.proyecto_base_id,
      centro_costo_id: formulario.centro_costo_id,
      beneficiario_id: formulario.beneficiario_id,
      categoria_gasto: formulario.categoria_gasto,
      medio_pago: medioPago,
      descripcion: formulario.descripcion.trim(),
      valor_bruto: valores.valorBruto,
      valor_impuestos: valores.valorImpuestos,
      valor_retenciones: valores.valorRetenciones,
      valor_descuentos: valores.valorDescuentos,
    });

    setForm(ESTADO_INICIAL_FORMULARIO);
    setBusquedaBeneficiario("");
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
            Crear solicitud de pago a proveedor
          </h2>

          <p className={styles.formDescription}>
            Registra una solicitud en estado borrador para un beneficiario tipo
            proveedor.
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
            <label className={styles.label} htmlFor="busqueda-beneficiario">
              Beneficiario proveedor <strong aria-hidden="true">*</strong>
            </label>

            <div className={styles.combobox}>
              <input
                id="busqueda-beneficiario"
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

              <input
                type="hidden"
                name="beneficiario_id"
                value={form.beneficiario_id}
              />

              {busquedaBeneficiario.trim() && !form.beneficiario_id ? (
                <div className={styles.comboboxDropdown}>
                  {beneficiariosFiltrados.length > 0 ? (
                    beneficiariosFiltrados
                      .slice(0, 8)
                      .map((beneficiario) => {
                        const documento =
                          obtenerDocumentoBeneficiario(beneficiario);

                        return (
                          <button
                            key={beneficiario.id}
                            type="button"
                            className={styles.comboboxOption}
                            onClick={() =>
                              seleccionarBeneficiario(beneficiario)
                            }
                            disabled={guardando}
                          >
                            <strong className={styles.comboboxOptionName}>
                              {beneficiario.nombre}
                            </strong>

                            <span className={styles.comboboxOptionDocument}>
                              {documento || "Sin documento registrado"}
                            </span>
                          </button>
                        );
                      })
                  ) : (
                    <p className={styles.comboboxEmpty}>
                      No se encontraron proveedores.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>
              Categoría de gasto <strong aria-hidden="true">*</strong>
            </span>

            <select
              name="categoria_gasto"
              className={styles.input}
              value={form.categoria_gasto}
              onChange={(event) =>
                actualizarCampo("categoria_gasto", event.target.value)
              }
              disabled={guardando}
              required
            >
              <option value="">Selecciona una categoría</option>

              {CATEGORIAS_GASTO.map((categoria) => (
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
              Valor factura <strong aria-hidden="true">*</strong>
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
              placeholder="100,000"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Impuestos</span>

            <input
              name="valor_impuestos"
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
              name="valor_retenciones"
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
              name="valor_descuentos"
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
            <strong className={styles.netLabel}>Valor a pagar</strong>

            <strong className={valorNeto < 0 ? styles.netError : styles.net}>
              {formatearMoneda(valorNeto)}
            </strong>
          </div>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>
            Concepto de pago <strong aria-hidden="true">*</strong>
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
            placeholder="Describe el concepto de la solicitud de pago."
            required
          />
        </label>

        <div className={styles.actions}>
          <button className={styles.button} type="submit" disabled={guardando}>
            {guardando ? "Creando..." : "Crear solicitud"}
          </button>
        </div>
      </form>
    </section>
  );
}