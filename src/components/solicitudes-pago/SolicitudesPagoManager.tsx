"use client";

import type {
  BeneficiarioSolicitudCatalogo,
  BeneficiariosSolicitudResponseData,
  CentroCostoSolicitudCatalogo,
  MedioPagoSolicitud,
  ProyectoBaseSolicitudCatalogo,
  ProyectosBaseSolicitudResponseData,
  SolicitudPagoFormularioState,
  SolicitudPagoListado,
  SolicitudesPagoApiResponse,
  SolicitudesPagoResponseData,
  UsuarioSesionSolicitudesPago,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./SolicitudesPagoManager.module.css";

type SolicitudesPagoManagerProps = {
  usuario: UsuarioSesionSolicitudesPago;
};

type ValoresSolicitudPago = {
  valorBruto: number;
  valorImpuestos: number;
  valorRetenciones: number;
  valorDescuentos: number;
  valorNeto: number;
};

const ESTADO_INICIAL_FORMULARIO: SolicitudPagoFormularioState = {
  proyecto_base_id: "",
  centro_costo_id: "",
  beneficiario_id: "",
  categoria_gasto: "",
  medio_pago: "",
  descripcion: "",
  valor_bruto: "",
  valor_impuestos: "0",
  valor_retenciones: "0",
  valor_descuentos: "0",
};

const CATEGORIAS_GASTO = [
  "MATERIALES",
  "MANO_OBRA",
  "EQUIPOS",
  "SERVICIOS",
  "TRANSPORTE",
  "ADMINISTRATIVO",
  "OTRO",
];

const MEDIOS_PAGO: MedioPagoSolicitud[] = [
  "TRANSFERENCIA",
  "CONSIGNACION",
  "EFECTIVO",
];

function extraerProyectos(data?: ProyectosBaseSolicitudResponseData) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data.proyectos ?? [];
}

function extraerBeneficiarios(data?: BeneficiariosSolicitudResponseData) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data.beneficiarios ?? [];
}

function extraerSolicitudes(data?: SolicitudesPagoResponseData) {
  return data?.solicitudes ?? [];
}

function obtenerCentrosCosto(proyecto?: ProyectoBaseSolicitudCatalogo | null) {
  return proyecto?.centros_costo ?? proyecto?.centrosCosto ?? [];
}

function obtenerValorFormulario(formData: FormData, campo: string) {
  const valor = formData.get(campo);

  return typeof valor === "string" ? valor.trim() : "";
}

function obtenerMedioPagoFormulario(
  formData: FormData,
): MedioPagoSolicitud | "" {
  const valor = obtenerValorFormulario(formData, "medio_pago");

  if (MEDIOS_PAGO.includes(valor as MedioPagoSolicitud)) {
    return valor as MedioPagoSolicitud;
  }

  return "";
}

function construirFormularioDesdeFormData(
  formData: FormData,
): SolicitudPagoFormularioState {
  return {
    proyecto_base_id: obtenerValorFormulario(formData, "proyecto_base_id"),
    centro_costo_id: obtenerValorFormulario(formData, "centro_costo_id"),
    beneficiario_id: obtenerValorFormulario(formData, "beneficiario_id"),
    categoria_gasto: obtenerValorFormulario(formData, "categoria_gasto"),
    medio_pago: obtenerMedioPagoFormulario(formData),
    descripcion: obtenerValorFormulario(formData, "descripcion"),
    valor_bruto: obtenerValorFormulario(formData, "valor_bruto"),
    valor_impuestos:
      obtenerValorFormulario(formData, "valor_impuestos") || "0",
    valor_retenciones:
      obtenerValorFormulario(formData, "valor_retenciones") || "0",
    valor_descuentos:
      obtenerValorFormulario(formData, "valor_descuentos") || "0",
  };
}

function limpiarSeparadoresNumericos(valor: string) {
  return valor.replace(/[^\d]/g, "");
}

function formatearValorEntrada(valor: string) {
  const valorLimpio = limpiarSeparadoresNumericos(valor);

  if (!valorLimpio) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(valorLimpio));
}

function convertirNumero(valor: string) {
  const valorLimpio = valor.replaceAll(",", "").trim();

  if (!valorLimpio) {
    return 0;
  }

  const numero = Number(valorLimpio);

  return Number.isFinite(numero) ? numero : 0;
}

function calcularValoresSolicitudPago(
  formulario: SolicitudPagoFormularioState,
): ValoresSolicitudPago {
  const valorBruto = convertirNumero(formulario.valor_bruto);
  const valorImpuestos = convertirNumero(formulario.valor_impuestos);
  const valorRetenciones = convertirNumero(formulario.valor_retenciones);
  const valorDescuentos = convertirNumero(formulario.valor_descuentos);

  return {
    valorBruto,
    valorImpuestos,
    valorRetenciones,
    valorDescuentos,
    valorNeto:
      valorBruto - valorImpuestos - valorRetenciones - valorDescuentos,
  };
}

function formatearMoneda(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function formatearFecha(fecha: string | Date) {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(fecha));
}

function formatearTextoDominio(valor?: string | null) {
  return valor?.replaceAll("_", " ") ?? "No definido";
}

function usuarioTieneRol(usuario: UsuarioSesionSolicitudesPago, rol: string) {
  return usuario.roles.includes(rol);
}

function centroCostoPermitidoParaUsuario(
  centroCosto: CentroCostoSolicitudCatalogo,
  usuario: UsuarioSesionSolicitudesPago,
) {
  if (centroCosto.activo === false) {
    return false;
  }

  if (usuarioTieneRol(usuario, "ADMINISTRADOR")) {
    return true;
  }

  if (usuarioTieneRol(usuario, "SOLICITANTE")) {
    return centroCosto.linea_negocio === "OBRA";
  }

  return true;
}

function obtenerEtiquetaBeneficiario(
  beneficiario: BeneficiarioSolicitudCatalogo,
) {
  return `${beneficiario.nombre} · ${beneficiario.tipo_documento} ${beneficiario.numero_documento}`;
}

function buscarBeneficiarioPorEtiqueta(
  beneficiarios: BeneficiarioSolicitudCatalogo[],
  etiqueta: string,
) {
  const etiquetaNormalizada = etiqueta.trim().toLowerCase();

  if (!etiquetaNormalizada) {
    return null;
  }

  return (
    beneficiarios.find(
      (beneficiario) =>
        obtenerEtiquetaBeneficiario(beneficiario).toLowerCase() ===
        etiquetaNormalizada,
    ) ?? null
  );
}

async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<SolicitudesPagoApiResponse<T>> {
  const response = await fetch(url, options);
  const payload = (await response.json()) as SolicitudesPagoApiResponse<T>;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message ?? "La operación no fue exitosa.");
  }

  return payload;
}

export default function SolicitudesPagoManager({
  usuario,
}: SolicitudesPagoManagerProps) {
  const [form, setForm] = useState<SolicitudPagoFormularioState>(
    ESTADO_INICIAL_FORMULARIO,
  );

  const [proyectos, setProyectos] = useState<
    ProyectoBaseSolicitudCatalogo[]
  >([]);

  const [beneficiarios, setBeneficiarios] = useState<
    BeneficiarioSolicitudCatalogo[]
  >([]);

  const [solicitudes, setSolicitudes] = useState<SolicitudPagoListado[]>([]);
  const [busquedaBeneficiario, setBusquedaBeneficiario] = useState("");
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  const proyectoSeleccionado = useMemo(
    () =>
      proyectos.find((proyecto) => proyecto.id === form.proyecto_base_id) ??
      null,
    [form.proyecto_base_id, proyectos],
  );

  const centrosCostoDisponibles = useMemo(() => {
    return obtenerCentrosCosto(proyectoSeleccionado).filter((centroCosto) =>
      centroCostoPermitidoParaUsuario(centroCosto, usuario),
    );
  }, [proyectoSeleccionado, usuario]);

  const beneficiariosFiltrados = useMemo(() => {
    const busqueda = busquedaBeneficiario.trim().toLowerCase();

    if (!busqueda) {
      return beneficiarios;
    }

    return beneficiarios.filter((beneficiario) => {
      const nombre = beneficiario.nombre.toLowerCase();
      const tipoDocumento = beneficiario.tipo_documento.toLowerCase();
      const numeroDocumento = beneficiario.numero_documento.toLowerCase();
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

  const cargarSolicitudes = useCallback(async () => {
    setCargandoSolicitudes(true);

    try {
      const response = await fetchJson<SolicitudesPagoResponseData>(
        "/api/v1/solicitudes-pago",
      );

      setSolicitudes(extraerSolicitudes(response.data));
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar las solicitudes de pago.",
      );
    } finally {
      setCargandoSolicitudes(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    Promise.all([
      fetchJson<ProyectosBaseSolicitudResponseData>("/api/v1/proyectos-base", {
        signal: abortController.signal,
      }),
      fetchJson<BeneficiariosSolicitudResponseData>(
        "/api/v1/beneficiarios?tipo_beneficiario=PROVEEDOR&activo=true",
        {
          signal: abortController.signal,
        },
      ),
      fetchJson<SolicitudesPagoResponseData>("/api/v1/solicitudes-pago", {
        signal: abortController.signal,
      }),
    ])
      .then(([proyectosResponse, beneficiariosResponse, solicitudesResponse]) => {
        setProyectos(extraerProyectos(proyectosResponse.data));
        setBeneficiarios(extraerBeneficiarios(beneficiariosResponse.data));
        setSolicitudes(extraerSolicitudes(solicitudesResponse.data));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setMensajeError(
          error instanceof Error
            ? error.message
            : "No fue posible cargar la información inicial de solicitudes.",
        );
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setCargandoCatalogos(false);
          setCargandoSolicitudes(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, []);

  function actualizarCampo<K extends keyof SolicitudPagoFormularioState>(
    campo: K,
    valor: SolicitudPagoFormularioState[K],
  ) {
    setForm((formActual) => ({
      ...formActual,
      [campo]: valor,
      ...(campo === "proyecto_base_id" ? { centro_costo_id: "" } : {}),
    }));

    setMensajeError("");
    setMensajeExito("");
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
  ) {
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
      setMensajeError(errorFormulario);
      setMensajeExito("");
      return;
    }

    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const response = await fetchJson<SolicitudesPagoResponseData>(
        "/api/v1/solicitudes-pago",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            proyecto_base_id: formulario.proyecto_base_id,
            centro_costo_id: formulario.centro_costo_id,
            beneficiario_id: formulario.beneficiario_id,
            categoria_gasto: formulario.categoria_gasto,
            medio_pago: formulario.medio_pago as MedioPagoSolicitud,
            descripcion: formulario.descripcion.trim(),
            valor_bruto: valores.valorBruto,
            valor_impuestos: valores.valorImpuestos,
            valor_retenciones: valores.valorRetenciones,
            valor_descuentos: valores.valorDescuentos,
          }),
        },
      );

      const solicitudCreada = response.data?.solicitud;

      if (solicitudCreada) {
        setSolicitudes((actuales) => [solicitudCreada, ...actuales]);
      } else {
        await cargarSolicitudes();
      }

      setForm(ESTADO_INICIAL_FORMULARIO);
      setBusquedaBeneficiario("");
      setMensajeExito(response.message ?? "Solicitud creada correctamente.");
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No fue posible crear la solicitud de pago.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className={styles.container}>
      <section className={styles.card}>
        <form className={styles.form} onSubmit={manejarEnvio}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              Crear solicitud de pago a proveedor
            </h2>

            <p className={styles.formDescription}>
              Registra una solicitud en estado borrador para un beneficiario
              tipo proveedor.
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
                htmlFor="busqueda-beneficiario"
              >
                Beneficiario proveedor{" "}
                <strong aria-hidden="true">*</strong>
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
                        .map((beneficiario) => (
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
                              {beneficiario.tipo_documento}{" "}
                              {beneficiario.numero_documento}
                            </span>
                          </button>
                        ))
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

      <section className={styles.card}>
        <div className={styles.tableHeader}>
          <h2 className={styles.sectionTitle}>Solicitudes creadas</h2>

          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => void cargarSolicitudes()}
            disabled={cargandoSolicitudes}
          >
            {cargandoSolicitudes ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {cargandoSolicitudes ? (
          <div className={styles.empty}>
            <h2>Cargando solicitudes</h2>
            <p>Estamos consultando las solicitudes de pago registradas.</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className={styles.empty}>
            <h2>No hay solicitudes registradas</h2>

            <p>
              Cuando crees una solicitud de pago a proveedor, aparecerá en este
              listado.
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
                          Factura: {formatearMoneda(solicitud.valor_bruto)}
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
                      <dt>Valor factura</dt>
                      <dd>{formatearMoneda(solicitud.valor_bruto)}</dd>
                    </div>

                    <div>
                      <dt>
                        <strong>Valor a pagar</strong>
                      </dt>
                      <dd>
                        <strong>
                          {formatearMoneda(solicitud.valor_neto)}
                        </strong>
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}