"use client";

import SelectorSoporteConCamara from "@/components/adjuntos/SelectorSoporteConCamara";
import { descargarTablaPdf } from "@/lib/pdf-export";
import { formatearNombrePropio } from "@/lib/text-format";
import type {
  MedioPagoSolicitud,
  SolicitudProgramadaPago,
  SolicitudesPagoApiResponse,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./PagosManager.module.css";

type FiltrosPagos = {
  busqueda: string;
  proyecto_base_id: string;
  centro_costo_id: string;
  medio_pago: MedioPagoSolicitud | "";
};

type DatosTransferencia = {
  numero_comprobante: string;
  observacion: string;
  soporte: File | null;
};

type DatosPagoRetiro = {
  numero_comprobante: string;
  observacion: string;
  soporte: File | null;
};

type VistaOperacion = "TODOS" | "TRANSFERENCIAS" | "RETIRO";
type TipoSeleccion = "TRANSFERENCIAS" | "RETIRO" | null;

const FILTROS_INICIALES: FiltrosPagos = {
  busqueda: "",
  proyecto_base_id: "",
  centro_costo_id: "",
  medio_pago: "",
};

const FORMATEADOR_MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const FORMATEADOR_FECHA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeZone: "America/Bogota",
});

function formatearFecha(valor: string | Date | null | undefined): string {
  return valor ? FORMATEADOR_FECHA.format(new Date(valor)) : "—";
}

function obtenerBeneficiario(solicitud: SolicitudProgramadaPago): string {
  const nombre =
    solicitud.beneficiario?.nombre ??
    solicitud.proveedor?.nombre ??
    (solicitud.modalidad_nomina === "AGRUPADA_EXCEL"
      ? "Trabajadores de nómina"
      : solicitud.tipo_solicitud === "PAGO_IMPUESTO"
        ? "Entidad recaudadora"
        : "—");

  return nombre === "—" ? nombre : formatearNombrePropio(nombre);
}

function obtenerTipo(solicitud: SolicitudProgramadaPago): string {
  if (solicitud.tipo_solicitud === "PAGO_NOMINA") {
    return solicitud.modalidad_nomina === "AGRUPADA_EXCEL"
      ? "Nómina grupal"
      : "Nómina individual";
  }

  const etiquetas = {
    PAGO_PROVEEDOR: "Pago a proveedor",
    REEMBOLSO: "Reembolso",
    PAGO_IMPUESTO: "Pago de impuesto",
    OTRO_PAGO: "Otro pago",
  };

  return etiquetas[solicitud.tipo_solicitud];
}

export default function PagosManager() {
  const [solicitudes, setSolicitudes] = useState<SolicitudProgramadaPago[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState<SolicitudProgramadaPago | null>(null);
  const [idsSeleccionados, setIdsSeleccionados] = useState<Set<string>>(
    new Set(),
  );
  const [datosTransferencias, setDatosTransferencias] = useState<
    Record<string, DatosTransferencia>
  >({});
  const [modalTransferenciasAbierto, setModalTransferenciasAbierto] =
    useState(false);
  const [modalRetiroAbierto, setModalRetiroAbierto] = useState(false);
  const [tipoSeleccion, setTipoSeleccion] = useState<TipoSeleccion>(null);
  const [valorRetirado, setValorRetirado] = useState("");
  const [soporteRetiro, setSoporteRetiro] = useState<File | null>(null);
  const [observacionRetiro, setObservacionRetiro] = useState("");
  const [reintegrarSobrante, setReintegrarSobrante] = useState(false);
  const [datosPagosRetiro, setDatosPagosRetiro] = useState<
    Record<string, DatosPagoRetiro>
  >({});
  const [registrando, setRegistrando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [vistaOperacion, setVistaOperacion] =
    useState<VistaOperacion>("TODOS");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");
  const seleccionarTodosRef = useRef<HTMLInputElement>(null);

  const cargarSolicitudes = useCallback(async () => {
    setCargando(true);
    setMensajeError("");

    try {
      const response = await fetch(
        "/api/v1/solicitudes-pago/programadas",
        {
        credentials: "include",
        cache: "no-store",
        },
      );
      const body =
        (await response.json()) as SolicitudesPagoApiResponse<{
          solicitudes: SolicitudProgramadaPago[];
        }>;

      if (!response.ok || !body.ok) {
        throw new Error(
          body.message ?? "No fue posible consultar la bandeja de pagos.",
        );
      }

      setSolicitudes(body.data?.solicitudes ?? []);
    } catch (error) {
      setSolicitudes([]);
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No fue posible consultar la bandeja de pagos.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const tareaCarga = window.setTimeout(() => {
      void cargarSolicitudes();
    }, 0);

    return () => window.clearTimeout(tareaCarga);
  }, [cargarSolicitudes]);

  useEffect(() => {
    if (!solicitudSeleccionada) {
      return;
    }

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSolicitudSeleccionada(null);
      }
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [solicitudSeleccionada]);

  const proyectos = useMemo(
    () =>
      Array.from(
        new Map(
          solicitudes
            .filter((solicitud) => solicitud.proyecto_base)
            .map((solicitud) => [
              solicitud.proyecto_base_id,
              solicitud.proyecto_base!,
            ]),
        ).values(),
      ).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [solicitudes],
  );

  const centrosCosto = useMemo(
    () =>
      Array.from(
        new Map(
          solicitudes
            .filter(
              (solicitud) =>
                solicitud.centro_costo &&
                (!filtros.proyecto_base_id ||
                  solicitud.proyecto_base_id === filtros.proyecto_base_id),
            )
            .map((solicitud) => [
              solicitud.centro_costo_id,
              solicitud.centro_costo!,
            ]),
        ).values(),
      ).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [filtros.proyecto_base_id, solicitudes],
  );

  const solicitudesFiltradas = useMemo(() => {
    const busqueda = filtros.busqueda.trim().toLocaleLowerCase("es");

    return solicitudes.filter((solicitud) => {
      const coincideBusqueda =
        !busqueda ||
        [
          solicitud.numero_solicitud,
          solicitud.descripcion,
          obtenerBeneficiario(solicitud),
          solicitud.proyecto_base?.nombre,
          solicitud.centro_costo?.nombre,
        ].some((valor) => valor?.toLocaleLowerCase("es").includes(busqueda));

      return (
        coincideBusqueda &&
        (vistaOperacion === "TODOS" ||
          (vistaOperacion === "TRANSFERENCIAS"
            ? solicitud.medio_pago === "TRANSFERENCIA" ||
              solicitud.medio_pago === "PSE" ||
              solicitud.medio_pago === "PORTAL"
            : solicitud.medio_pago === "CONSIGNACION" ||
              solicitud.medio_pago === "EFECTIVO")) &&
        (!filtros.proyecto_base_id ||
          solicitud.proyecto_base_id === filtros.proyecto_base_id) &&
        (!filtros.centro_costo_id ||
          solicitud.centro_costo_id === filtros.centro_costo_id) &&
        (!filtros.medio_pago ||
          solicitud.medio_pago === filtros.medio_pago)
      );
    });
  }, [filtros, solicitudes, vistaOperacion]);

  const totalSolicitudesFiltradas = useMemo(
    () =>
      solicitudesFiltradas.reduce(
        (total, solicitud) => total + solicitud.valor_neto,
        0,
      ),
    [solicitudesFiltradas],
  );

  const totalSolicitudesSeleccionadas = useMemo(
    () =>
      solicitudes.reduce(
        (total, solicitud) =>
          idsSeleccionados.has(solicitud.id)
            ? total + solicitud.valor_neto
            : total,
        0,
      ),
    [idsSeleccionados, solicitudes],
  );

  const transferenciasSeleccionadas = useMemo(
    () =>
      solicitudes.filter(
        (solicitud) =>
          idsSeleccionados.has(solicitud.id) &&
          (solicitud.medio_pago === "TRANSFERENCIA" ||
            solicitud.medio_pago === "PSE" ||
            solicitud.medio_pago === "PORTAL"),
      ),
    [idsSeleccionados, solicitudes],
  );

  const solicitudesRetiroSeleccionadas = useMemo(
    () =>
      solicitudes.filter(
        (solicitud) =>
          idsSeleccionados.has(solicitud.id) &&
          (solicitud.medio_pago === "CONSIGNACION" ||
            solicitud.medio_pago === "EFECTIVO"),
      ),
    [idsSeleccionados, solicitudes],
  );

  const solicitudesSeleccionablesVisibles = useMemo(() => {
    const referencia =
      solicitudes.find((solicitud) => idsSeleccionados.has(solicitud.id)) ??
      solicitudesFiltradas[0];

    if (!referencia) return [];

    const tipoReferencia =
      referencia.medio_pago === "TRANSFERENCIA" ||
      referencia.medio_pago === "PSE" ||
      referencia.medio_pago === "PORTAL"
        ? "TRANSFERENCIAS"
        : "RETIRO";

    return solicitudesFiltradas.filter((solicitud) => {
      const tipoSolicitud =
        solicitud.medio_pago === "TRANSFERENCIA" ||
        solicitud.medio_pago === "PSE" ||
        solicitud.medio_pago === "PORTAL"
          ? "TRANSFERENCIAS"
          : "RETIRO";

      if (tipoSolicitud !== tipoReferencia) return false;
      return (
        tipoSolicitud === "TRANSFERENCIAS" ||
        (solicitud.proyecto_base_id === referencia.proyecto_base_id &&
          solicitud.fondo_id === referencia.fondo_id)
      );
    });
  }, [idsSeleccionados, solicitudes, solicitudesFiltradas]);

  const todasVisiblesSeleccionadas =
    solicitudesSeleccionablesVisibles.length > 0 &&
    solicitudesSeleccionablesVisibles.every((solicitud) =>
      idsSeleccionados.has(solicitud.id),
    );
  const algunasVisiblesSeleccionadas =
    !todasVisiblesSeleccionadas &&
    solicitudesSeleccionablesVisibles.some((solicitud) =>
      idsSeleccionados.has(solicitud.id),
    );

  useEffect(() => {
    if (seleccionarTodosRef.current) {
      seleccionarTodosRef.current.indeterminate = algunasVisiblesSeleccionadas;
    }
  }, [algunasVisiblesSeleccionadas]);

  const resumenProyectos = useMemo(() => {
    const resumen = new Map<
      string,
      {
        nombre: string;
        saldoActual: number;
        totalSeleccionado: number;
      }
    >();

    for (const solicitud of transferenciasSeleccionadas) {
      const existente = resumen.get(solicitud.proyecto_base_id);

      if (existente) {
        existente.totalSeleccionado += solicitud.valor_neto;
      } else {
        resumen.set(solicitud.proyecto_base_id, {
          nombre: solicitud.proyecto_base?.nombre ?? "Proyecto",
          saldoActual: solicitud.saldo_fondo_actual,
          totalSeleccionado: solicitud.valor_neto,
        });
      }
    }

    return Array.from(resumen.entries()).map(([id, datos]) => ({
      id,
      ...datos,
      saldoProyectado: datos.saldoActual - datos.totalSeleccionado,
    }));
  }, [transferenciasSeleccionadas]);

  const loteCompleto =
    transferenciasSeleccionadas.length > 0 &&
    resumenProyectos.every((proyecto) => proyecto.saldoProyectado >= 0) &&
    transferenciasSeleccionadas.every((solicitud) => {
      const datos = datosTransferencias[solicitud.id];

      return Boolean(
        datos?.numero_comprobante.trim() &&
          datos.soporte,
      );
    });

  const valorRequeridoRetiro = solicitudesRetiroSeleccionadas.reduce(
    (total, solicitud) => total + solicitud.valor_neto,
    0,
  );
  const valorRetiradoNumero = Number(valorRetirado);
  const sobranteRetiro = Number.isFinite(valorRetiradoNumero)
    ? valorRetiradoNumero - valorRequeridoRetiro
    : -valorRequeridoRetiro;
  const solicitudBaseRetiro = solicitudesRetiroSeleccionadas[0];
  const saldoProyectadoRetiro = solicitudBaseRetiro
    ? solicitudBaseRetiro.saldo_fondo_actual -
      valorRetiradoNumero +
      (reintegrarSobrante && sobranteRetiro > 0 ? sobranteRetiro : 0)
    : 0;
  const retiroCompleto =
    solicitudesRetiroSeleccionadas.length > 0 &&
    soporteRetiro &&
    valorRetiradoNumero >= valorRequeridoRetiro &&
    valorRetiradoNumero <=
      (solicitudBaseRetiro?.saldo_fondo_actual ?? 0) &&
    solicitudesRetiroSeleccionadas.every((solicitud) => {
      const datos = datosPagosRetiro[solicitud.id];

      return Boolean(
        datos?.soporte &&
          (solicitud.medio_pago !== "CONSIGNACION" ||
            datos.numero_comprobante.trim()),
      );
    });

  function esSeleccionCompatible(solicitud: SolicitudProgramadaPago) {
    const tipoSolicitud =
      solicitud.medio_pago === "TRANSFERENCIA" ||
      solicitud.medio_pago === "PSE" ||
      solicitud.medio_pago === "PORTAL"
        ? "TRANSFERENCIAS"
        : "RETIRO";

    if (!tipoSeleccion || tipoSeleccion !== tipoSolicitud) {
      return !tipoSeleccion;
    }

    if (tipoSolicitud === "TRANSFERENCIAS") {
      return true;
    }

    return solicitudesRetiroSeleccionadas.every(
      (seleccionada) =>
        seleccionada.proyecto_base_id === solicitud.proyecto_base_id &&
        seleccionada.fondo_id === solicitud.fondo_id,
    );
  }

  function alternarSeleccion(solicitud: SolicitudProgramadaPago) {
    if (
      !idsSeleccionados.has(solicitud.id) &&
      !esSeleccionCompatible(solicitud)
    ) {
      return;
    }

    setIdsSeleccionados((actuales) => {
      const nuevos = new Set(actuales);

      if (nuevos.has(solicitud.id)) {
        nuevos.delete(solicitud.id);
      } else {
        nuevos.add(solicitud.id);
        setTipoSeleccion(
          solicitud.medio_pago === "TRANSFERENCIA" ||
          solicitud.medio_pago === "PSE" ||
          solicitud.medio_pago === "PORTAL"
            ? "TRANSFERENCIAS"
            : "RETIRO",
        );
      }

      if (nuevos.size === 0) {
        setTipoSeleccion(null);
      }

      return nuevos;
    });
  }

  function alternarSeleccionVisibles() {
    setIdsSeleccionados((actuales) => {
      const nuevos = new Set(actuales);

      solicitudesSeleccionablesVisibles.forEach((solicitud) => {
        if (todasVisiblesSeleccionadas) {
          nuevos.delete(solicitud.id);
        } else {
          nuevos.add(solicitud.id);
        }
      });

      if (nuevos.size === 0) {
        setTipoSeleccion(null);
      } else if (!tipoSeleccion && solicitudesSeleccionablesVisibles[0]) {
        const primera = solicitudesSeleccionablesVisibles[0];
        setTipoSeleccion(
          primera.medio_pago === "TRANSFERENCIA" ||
          primera.medio_pago === "PSE" ||
          primera.medio_pago === "PORTAL"
            ? "TRANSFERENCIAS"
            : "RETIRO",
        );
      }

      return nuevos;
    });
  }

  function cambiarVista(vista: VistaOperacion) {
    setVistaOperacion(vista);
    setIdsSeleccionados(new Set());
    setTipoSeleccion(null);
  }

  function abrirRegistroTransferencias() {
    setDatosTransferencias((actuales) => {
      const nuevos = { ...actuales };

      for (const solicitud of transferenciasSeleccionadas) {
        nuevos[solicitud.id] ??= {
          numero_comprobante: "",
          observacion: "",
          soporte: null,
        };
      }

      return nuevos;
    });
    setMensajeError("");
    setModalTransferenciasAbierto(true);
  }

  function actualizarDatosTransferencia(
    solicitudId: string,
    cambios: Partial<DatosTransferencia>,
  ) {
    setDatosTransferencias((actuales) => ({
      ...actuales,
      [solicitudId]: {
        ...actuales[solicitudId],
        ...cambios,
      },
    }));
  }

  function abrirRegistro() {
    if (tipoSeleccion === "TRANSFERENCIAS") {
      abrirRegistroTransferencias();
      return;
    }

    if (tipoSeleccion !== "RETIRO") {
      return;
    }

    setValorRetirado(String(valorRequeridoRetiro));
    setDatosPagosRetiro((actuales) => {
      const nuevos = { ...actuales };

      for (const solicitud of solicitudesRetiroSeleccionadas) {
        nuevos[solicitud.id] ??= {
          numero_comprobante: "",
          observacion: "",
          soporte: null,
        };
      }

      return nuevos;
    });
    setMensajeError("");
    setModalRetiroAbierto(true);
  }

  function actualizarDatosPagoRetiro(
    solicitudId: string,
    cambios: Partial<DatosPagoRetiro>,
  ) {
    setDatosPagosRetiro((actuales) => ({
      ...actuales,
      [solicitudId]: {
        ...actuales[solicitudId],
        ...cambios,
      },
    }));
  }

  async function registrarRetiroYPagos() {
    if (!retiroCompleto || registrando) {
      return;
    }

    setRegistrando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const formData = new FormData();
      formData.append("soporte_retiro", soporteRetiro!);
      const detalles = solicitudesRetiroSeleccionadas.map(
        (solicitud, indice) => {
          const datos = datosPagosRetiro[solicitud.id];
          const campoArchivo = `soporte_pago_${indice}`;

          formData.append(campoArchivo, datos.soporte!);

          return {
            solicitud_id: solicitud.id,
            numero_comprobante: datos.numero_comprobante,
            observacion: datos.observacion,
            archivo_campo: campoArchivo,
          };
        },
      );

      formData.append(
        "operacion",
        JSON.stringify({
          valor_retirado: valorRetiradoNumero,
          observacion: observacionRetiro,
          reintegrar_sobrante: reintegrarSobrante,
          archivo_retiro_campo: "soporte_retiro",
          detalles,
        }),
      );

      const response = await fetch(
        "/api/v1/solicitudes-pago/registrar-operacion-efectivo",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );
      const body =
        (await response.json()) as SolicitudesPagoApiResponse<unknown>;

      if (!response.ok || !body.ok) {
        throw new Error(
          body.message ?? "No fue posible registrar el retiro y los pagos.",
        );
      }

      setModalRetiroAbierto(false);
      setIdsSeleccionados(new Set());
      setTipoSeleccion(null);
      setDatosPagosRetiro({});
      setSoporteRetiro(null);
      setObservacionRetiro("");
      setReintegrarSobrante(false);
      setMensajeExito(
        body.message ?? "Retiro y pagos registrados correctamente.",
      );
      await cargarSolicitudes();
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar el retiro y los pagos.",
      );
    } finally {
      setRegistrando(false);
    }
  }

  async function registrarTransferencias() {
    if (!loteCompleto || registrando) {
      return;
    }

    setRegistrando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const formData = new FormData();
      const manifiesto = transferenciasSeleccionadas.map(
        (solicitud, indice) => {
          const datos = datosTransferencias[solicitud.id];
          const campoArchivo = `soporte_${indice}`;

          formData.append(campoArchivo, datos.soporte!);

          return {
            solicitud_id: solicitud.id,
            numero_comprobante: datos.numero_comprobante,
            observacion: datos.observacion,
            archivo_campo: campoArchivo,
          };
        },
      );

      formData.append("pagos", JSON.stringify(manifiesto));

      const response = await fetch(
        "/api/v1/solicitudes-pago/registrar-pagos",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );
      const body =
        (await response.json()) as SolicitudesPagoApiResponse<unknown>;

      if (!response.ok || !body.ok) {
        throw new Error(
          body.message ?? "No fue posible registrar las transferencias.",
        );
      }

      setModalTransferenciasAbierto(false);
      setIdsSeleccionados(new Set());
      setDatosTransferencias({});
      setMensajeExito(
        body.message ?? "Transferencias registradas correctamente.",
      );
      await cargarSolicitudes();
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar las transferencias.",
      );
    } finally {
      setRegistrando(false);
    }
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
  }

  function descargarRelacionExcel() {
    window.location.assign(
      "/api/v1/solicitudes-pago/programadas/exportar",
    );
  }

  function descargarRelacionPdf() {
    const proyecto = proyectos.find(
      (opcion) => opcion.id === filtros.proyecto_base_id,
    );
    const centro = centrosCosto.find(
      (opcion) => opcion.id === filtros.centro_costo_id,
    );
    descargarTablaPdf({
      titulo: "Solicitudes programadas para pago",
      nombreArchivo: "pagos-filtrados.pdf",
      filas: solicitudesFiltradas,
      filtros: [
        filtros.busqueda.trim() && `Búsqueda: ${filtros.busqueda.trim()}`,
        proyecto && `Proyecto: ${proyecto.nombre}`,
        centro && `Centro de costo: ${centro.nombre}`,
        filtros.medio_pago && `Medio de pago: ${filtros.medio_pago}`,
        vistaOperacion !== "TODOS" && `Operación: ${vistaOperacion}`,
      ].filter(Boolean) as string[],
      columnas: [
        { titulo: "Solicitud", ancho: 17, valor: (fila) => fila.numero_solicitud },
        { titulo: "Beneficiario", ancho: 17, valor: obtenerBeneficiario },
        { titulo: "Proyecto", ancho: 15, valor: (fila) => fila.proyecto_base?.nombre },
        { titulo: "Centro de costo", ancho: 15, valor: (fila) => fila.centro_costo?.nombre },
        { titulo: "Tipo", ancho: 12, valor: obtenerTipo },
        { titulo: "Medio", ancho: 9, valor: (fila) => fila.medio_pago },
        { titulo: "Aprobación", ancho: 9, valor: (fila) => formatearFecha(fila.aprobado_2_en) },
        { titulo: "Valor neto", ancho: 10, valor: (fila) => FORMATEADOR_MONEDA.format(fila.valor_neto) },
      ],
    });
  }

  return (
    <section className={styles.container}>
      <div className={styles.operationTabs} aria-label="Tipo de operación">
        <button
          className={vistaOperacion === "TODOS" ? styles.activeTab : ""}
          type="button"
          onClick={() => cambiarVista("TODOS")}
        >
          Todos
        </button>
        <button
          className={
            vistaOperacion === "TRANSFERENCIAS" ? styles.activeTab : ""
          }
          type="button"
          onClick={() => cambiarVista("TRANSFERENCIAS")}
        >
          Pagos directos
        </button>
        <button
          className={vistaOperacion === "RETIRO" ? styles.activeTab : ""}
          type="button"
          onClick={() => cambiarVista("RETIRO")}
        >
          Retiro y pagos
        </button>
      </div>

      <div className={styles.filters}>
        <label className={styles.field}>
          <span>Buscar</span>
          <input
            value={filtros.busqueda}
            onChange={(event) =>
              setFiltros((actuales) => ({
                ...actuales,
                busqueda: event.target.value,
              }))
            }
            placeholder="Número, beneficiario o descripción"
          />
        </label>

        <label className={styles.field}>
          <span>Proyecto base</span>
          <select
            value={filtros.proyecto_base_id}
            onChange={(event) =>
              setFiltros((actuales) => ({
                ...actuales,
                proyecto_base_id: event.target.value,
                centro_costo_id: "",
              }))
            }
          >
            <option value="">Todos los proyectos</option>
            {proyectos.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Centro de costo</span>
          <select
            value={filtros.centro_costo_id}
            onChange={(event) =>
              setFiltros((actuales) => ({
                ...actuales,
                centro_costo_id: event.target.value,
              }))
            }
          >
            <option value="">Todos los centros</option>
            {centrosCosto.map((centro) => (
              <option key={centro.id} value={centro.id}>
                {centro.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Medio de pago</span>
          <select
            value={filtros.medio_pago}
            onChange={(event) =>
              setFiltros((actuales) => ({
                ...actuales,
                medio_pago: event.target.value as MedioPagoSolicitud | "",
              }))
            }
          >
            <option value="">Todos</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="PSE">PSE</option>
            <option value="PORTAL">Portal</option>
            <option value="CONSIGNACION">Consignación</option>
            <option value="EFECTIVO">Efectivo</option>
          </select>
        </label>

        <button className={styles.secondaryButton} type="button" onClick={limpiarFiltros}>
          Limpiar filtros
        </button>
      </div>

      {mensajeError ? <p className={styles.error}>{mensajeError}</p> : null}
      {mensajeExito ? <p className={styles.success}>{mensajeExito}</p> : null}

      <div className={styles.summary}>
        <div>
          <strong>Solicitudes programadas</strong>
          <span>{solicitudesFiltradas.length} resultado(s)</span>
        </div>
        <div className={styles.summaryActions}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={descargarRelacionExcel}
          >
            Descargar relación Excel
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={descargarRelacionPdf}
            disabled={solicitudesFiltradas.length === 0}
          >
            Descargar relación PDF
          </button>
          <button
            className={styles.primaryButton}
            type="button"
            disabled={idsSeleccionados.size === 0}
            onClick={abrirRegistro}
          >
            Procesar pagos seleccionados ({idsSeleccionados.size})
          </button>
        </div>
      </div>

      <p className={styles.paymentHint}>
        La primera solicitud seleccionada define el flujo. Las
        consignaciones y pagos en efectivo de un mismo proyecto se agrupan
        en un solo retiro.
      </p>

      {cargando ? (
        <p className={styles.empty}>Cargando bandeja de pagos...</p>
      ) : solicitudesFiltradas.length === 0 ? (
        <p className={styles.empty}>
          No existen solicitudes programadas que coincidan con los filtros.
        </p>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <colgroup>
                <col className={styles.selectionColumn} />
                <col className={styles.requestColumn} />
                <col className={styles.beneficiaryColumn} />
                <col className={styles.projectColumn} />
                <col className={styles.costCenterColumn} />
                <col className={styles.typeColumn} />
                <col className={styles.paymentMethodColumn} />
                <col className={styles.approvalDateColumn} />
                <col className={styles.amountColumn} />
              </colgroup>
              <thead>
                <tr>
                  <th className={styles.selectionHeader}>
                    <input
                      ref={seleccionarTodosRef}
                      type="checkbox"
                      aria-label="Seleccionar todas las solicitudes visibles compatibles"
                      title="Seleccionar todas las solicitudes visibles compatibles"
                      checked={todasVisiblesSeleccionadas}
                      disabled={solicitudesSeleccionablesVisibles.length === 0}
                      onChange={alternarSeleccionVisibles}
                    />
                  </th>
                  <th>Número</th>
                  <th>Beneficiario</th>
                  <th>Proyecto base</th>
                  <th>Centro de costo</th>
                  <th>Tipo</th>
                  <th>Medio de pago</th>
                  <th>Fecha de aprobación</th>
                  <th className={styles.amountHeader}>Valor neto</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((solicitud) => (
                  <tr
                    key={solicitud.id}
                    className={styles.clickableRow}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSolicitudSeleccionada(solicitud)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSolicitudSeleccionada(solicitud);
                      }
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${solicitud.numero_solicitud}`}
                        checked={idsSeleccionados.has(solicitud.id)}
                        disabled={
                          !idsSeleccionados.has(solicitud.id) &&
                          !esSeleccionCompatible(solicitud)
                        }
                        title={
                          esSeleccionCompatible(solicitud) ||
                          idsSeleccionados.has(solicitud.id)
                            ? "Seleccionar solicitud."
                            : tipoSeleccion === "RETIRO"
                              ? "El retiro solo puede agrupar solicitudes del mismo proyecto y fondo."
                              : "Finalice o limpie la selección actual para cambiar de flujo."
                        }
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => alternarSeleccion(solicitud)}
                      />
                    </td>
                    <td><strong>{solicitud.numero_solicitud ?? "—"}</strong></td>
                    <td>{obtenerBeneficiario(solicitud)}</td>
                    <td>{solicitud.proyecto_base?.nombre ?? "—"}</td>
                    <td>{solicitud.centro_costo?.nombre ?? "—"}</td>
                    <td>{obtenerTipo(solicitud)}</td>
                    <td>{solicitud.medio_pago ?? "—"}</td>
                    <td>{formatearFecha(solicitud.aprobado_2_en)}</td>
                    <td className={styles.money}>
                      {FORMATEADOR_MONEDA.format(solicitud.valor_neto)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.totalRow}>
                  <td colSpan={8}>
                    Total visible ({solicitudesFiltradas.length} solicitudes)
                  </td>
                  <td className={styles.totalValue}>
                    {FORMATEADOR_MONEDA.format(totalSolicitudesFiltradas)}
                  </td>
                </tr>
                {idsSeleccionados.size > 0 ? (
                  <tr className={styles.selectedTotalRow}>
                    <td colSpan={8}>
                      Seleccionado para procesar ({idsSeleccionados.size} solicitudes)
                    </td>
                    <td className={styles.selectedTotalValue}>
                      {FORMATEADOR_MONEDA.format(totalSolicitudesSeleccionadas)}
                    </td>
                  </tr>
                ) : null}
              </tfoot>
            </table>
          </div>

          <div className={styles.cards}>
            {solicitudesFiltradas.map((solicitud) => (
              <article
                className={styles.card}
                key={solicitud.id}
              >
                <div className={styles.cardHeader}>
                  <label>
                    <input
                      type="checkbox"
                      checked={idsSeleccionados.has(solicitud.id)}
                      disabled={
                        !idsSeleccionados.has(solicitud.id) &&
                        !esSeleccionCompatible(solicitud)
                      }
                      onChange={() => alternarSeleccion(solicitud)}
                    />{" "}
                    <strong>{solicitud.numero_solicitud ?? "Sin número"}</strong>
                  </label>
                  <span>{solicitud.medio_pago ?? "—"}</span>
                </div>
                <dl>
                  <div><dt>Beneficiario</dt><dd>{obtenerBeneficiario(solicitud)}</dd></div>
                  <div><dt>Proyecto</dt><dd>{solicitud.proyecto_base?.nombre ?? "—"}</dd></div>
                  <div><dt>Centro de costo</dt><dd>{solicitud.centro_costo?.nombre ?? "—"}</dd></div>
                  <div><dt>Fecha de aprobación</dt><dd>{formatearFecha(solicitud.aprobado_2_en)}</dd></div>
                  <div><dt>Valor neto</dt><dd>{FORMATEADOR_MONEDA.format(solicitud.valor_neto)}</dd></div>
                </dl>
                <button
                  className={styles.detailButton}
                  type="button"
                  onClick={() => setSolicitudSeleccionada(solicitud)}
                >
                  Ver detalle
                </button>
              </article>
            ))}
            <section className={styles.mobileTotals} aria-label="Resumen de pagos">
              <div>
                <span>Total visible ({solicitudesFiltradas.length})</span>
                <strong>{FORMATEADOR_MONEDA.format(totalSolicitudesFiltradas)}</strong>
              </div>
              {idsSeleccionados.size > 0 ? (
                <div className={styles.mobileSelectedTotal}>
                  <span>Seleccionado para procesar ({idsSeleccionados.size})</span>
                  <strong>{FORMATEADOR_MONEDA.format(totalSolicitudesSeleccionadas)}</strong>
                </div>
              ) : null}
            </section>
          </div>
        </>
      )}

      {modalTransferenciasAbierto ? (
        <div className={styles.modalBackdrop}>
          <section
            className={`${styles.modal} ${styles.batchModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registro-transferencias-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Registro grupal</p>
                <h2 id="registro-transferencias-title">
                  Confirmar pagos directos
                </h2>
              </div>
              <button
                className={styles.closeButton}
                type="button"
                aria-label="Cerrar registro de pagos directos"
                disabled={registrando}
                onClick={() => setModalTransferenciasAbierto(false)}
              >
                ×
              </button>
            </header>

            <div className={styles.projectSummaries}>
              {resumenProyectos.map((proyecto) => (
                <article
                  key={proyecto.id}
                  className={
                    proyecto.saldoProyectado < 0
                      ? styles.insufficientSummary
                      : styles.projectSummary
                  }
                >
                  <strong>{proyecto.nombre}</strong>
                  <dl>
                    <div><dt>Saldo actual</dt><dd>{FORMATEADOR_MONEDA.format(proyecto.saldoActual)}</dd></div>
                    <div><dt>Total del lote</dt><dd>{FORMATEADOR_MONEDA.format(proyecto.totalSeleccionado)}</dd></div>
                    <div><dt>Saldo proyectado</dt><dd>{FORMATEADOR_MONEDA.format(proyecto.saldoProyectado)}</dd></div>
                  </dl>
                  {proyecto.saldoProyectado < 0 ? (
                    <p>El fondo no tiene saldo suficiente para este lote.</p>
                  ) : null}
                </article>
              ))}
            </div>

            <div className={styles.paymentForms}>
              {transferenciasSeleccionadas.map((solicitud) => {
                const datos = datosTransferencias[solicitud.id];

                if (!datos) {
                  return null;
                }

                return (
                  <fieldset key={solicitud.id} disabled={registrando}>
                    <legend>
                      {solicitud.numero_solicitud} ·{" "}
                      {FORMATEADOR_MONEDA.format(solicitud.valor_neto)}
                    </legend>
                    <p>{obtenerBeneficiario(solicitud)}</p>
                    <div className={styles.paymentGrid}>
                      <label className={styles.field}>
                        <span>Referencia bancaria</span>
                        <input
                          value={datos.numero_comprobante}
                          onChange={(event) =>
                            actualizarDatosTransferencia(solicitud.id, {
                              numero_comprobante: event.target.value,
                            })
                          }
                          maxLength={150}
                          required
                        />
                      </label>
                      <SelectorSoporteConCamara
                        id={`soporte-pago-directo-${solicitud.id}`}
                        titulo="Soporte de pago"
                        archivo={datos.soporte}
                        onChange={(soporte) =>
                          actualizarDatosTransferencia(solicitud.id, { soporte })
                        }
                        required
                      />
                      <label className={`${styles.field} ${styles.fullWidth}`}>
                        <span>Observación</span>
                        <textarea
                          value={datos.observacion}
                          onChange={(event) =>
                            actualizarDatosTransferencia(solicitud.id, {
                              observacion: event.target.value,
                            })
                          }
                          rows={2}
                        />
                      </label>
                    </div>
                  </fieldset>
                );
              })}
            </div>

            {mensajeError ? <p className={styles.error}>{mensajeError}</p> : null}

            <footer className={styles.modalActions}>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={registrando}
                onClick={() => setModalTransferenciasAbierto(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={!loteCompleto || registrando}
                onClick={() => void registrarTransferencias()}
              >
                {registrando
                  ? "Registrando transferencias..."
                  : `Confirmar ${transferenciasSeleccionadas.length} pago(s)`}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {modalRetiroAbierto ? (
        <div className={styles.modalBackdrop}>
          <section
            className={`${styles.modal} ${styles.batchModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registro-retiro-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Operación agrupada</p>
                <h2 id="registro-retiro-title">
                  Registrar retiro y pagos
                </h2>
              </div>
              <button
                className={styles.closeButton}
                type="button"
                aria-label="Cerrar registro del retiro"
                disabled={registrando}
                onClick={() => setModalRetiroAbierto(false)}
              >
                ×
              </button>
            </header>

            <div className={styles.projectSummaries}>
              <article
                className={
                  saldoProyectadoRetiro < 0 || sobranteRetiro < 0
                    ? styles.insufficientSummary
                    : styles.projectSummary
                }
              >
                <strong>
                  {solicitudBaseRetiro?.proyecto_base?.nombre ?? "Proyecto"}
                </strong>
                <dl>
                  <div><dt>Saldo actual</dt><dd>{FORMATEADOR_MONEDA.format(solicitudBaseRetiro?.saldo_fondo_actual ?? 0)}</dd></div>
                  <div><dt>Valor de los pagos</dt><dd>{FORMATEADOR_MONEDA.format(valorRequeridoRetiro)}</dd></div>
                  <div><dt>Valor retirado</dt><dd>{FORMATEADOR_MONEDA.format(Number.isFinite(valorRetiradoNumero) ? valorRetiradoNumero : 0)}</dd></div>
                  <div><dt>Sobrante</dt><dd>{FORMATEADOR_MONEDA.format(Math.max(0, sobranteRetiro))}</dd></div>
                  <div><dt>Saldo proyectado</dt><dd>{FORMATEADOR_MONEDA.format(Number.isFinite(saldoProyectadoRetiro) ? saldoProyectadoRetiro : 0)}</dd></div>
                </dl>
                {sobranteRetiro < 0 ? (
                  <p>El retiro no alcanza para cubrir todos los pagos.</p>
                ) : saldoProyectadoRetiro < 0 ? (
                  <p>El fondo no tiene saldo suficiente para este retiro.</p>
                ) : null}
              </article>
            </div>

            <div className={styles.paymentForms}>
              <fieldset disabled={registrando}>
                <legend>Datos generales del retiro</legend>
                <div className={styles.paymentGrid}>
                  <label className={styles.field}>
                    <span>Valor retirado</span>
                    <input
                      type="number"
                      min={valorRequeridoRetiro}
                      step="0.01"
                      value={valorRetirado}
                      onChange={(event) => setValorRetirado(event.target.value)}
                      required
                    />
                  </label>
                  <SelectorSoporteConCamara
                    id="soporte-retiro"
                    titulo="Soporte del retiro"
                    archivo={soporteRetiro}
                    onChange={setSoporteRetiro}
                    required
                  />
                  <label className={`${styles.field} ${styles.fullWidth}`}>
                    <span>Observación del retiro</span>
                    <textarea
                      value={observacionRetiro}
                      onChange={(event) =>
                        setObservacionRetiro(event.target.value)
                      }
                      rows={2}
                    />
                  </label>
                  {sobranteRetiro > 0 ? (
                    <label className={`${styles.checkField} ${styles.fullWidth}`}>
                      <input
                        type="checkbox"
                        checked={reintegrarSobrante}
                        onChange={(event) =>
                          setReintegrarSobrante(event.target.checked)
                        }
                      />
                      Reintegrar ahora el sobrante de{" "}
                      {FORMATEADOR_MONEDA.format(sobranteRetiro)} al fondo
                    </label>
                  ) : null}
                </div>
              </fieldset>

              {solicitudesRetiroSeleccionadas.map((solicitud) => {
                const datos = datosPagosRetiro[solicitud.id];

                if (!datos) {
                  return null;
                }

                return (
                  <fieldset key={solicitud.id} disabled={registrando}>
                    <legend>
                      {solicitud.numero_solicitud} ·{" "}
                      {FORMATEADOR_MONEDA.format(solicitud.valor_neto)}
                    </legend>
                    <p>
                      {obtenerBeneficiario(solicitud)} ·{" "}
                      {solicitud.medio_pago}
                    </p>
                    <div className={styles.paymentGrid}>
                      {solicitud.medio_pago === "CONSIGNACION" ? (
                        <label className={styles.field}>
                          <span>Referencia de consignación</span>
                          <input
                            value={datos.numero_comprobante}
                            onChange={(event) =>
                              actualizarDatosPagoRetiro(solicitud.id, {
                                numero_comprobante: event.target.value,
                              })
                            }
                            maxLength={150}
                            required
                          />
                        </label>
                      ) : null}
                      <SelectorSoporteConCamara
                        id={`soporte-pago-retiro-${solicitud.id}`}
                        titulo="Soporte del pago"
                        archivo={datos.soporte}
                        onChange={(soporte) =>
                          actualizarDatosPagoRetiro(solicitud.id, { soporte })
                        }
                        required
                      />
                      <label className={`${styles.field} ${styles.fullWidth}`}>
                        <span>Observación</span>
                        <textarea
                          value={datos.observacion}
                          onChange={(event) =>
                            actualizarDatosPagoRetiro(solicitud.id, {
                              observacion: event.target.value,
                            })
                          }
                          rows={2}
                        />
                      </label>
                    </div>
                  </fieldset>
                );
              })}
            </div>

            {mensajeError ? <p className={styles.error}>{mensajeError}</p> : null}

            <footer className={styles.modalActions}>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={registrando}
                onClick={() => setModalRetiroAbierto(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={!retiroCompleto || registrando}
                onClick={() => void registrarRetiroYPagos()}
              >
                {registrando
                  ? "Registrando retiro..."
                  : `Confirmar retiro y ${solicitudesRetiroSeleccionadas.length} pago(s)`}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {solicitudSeleccionada ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSolicitudSeleccionada(null);
            }
          }}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-pago-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Detalle para pago</p>
                <h2 id="detalle-pago-title">
                  {solicitudSeleccionada.numero_solicitud ?? "Sin número"}
                </h2>
              </div>
              <button
                className={styles.closeButton}
                type="button"
                aria-label="Cerrar detalle"
                onClick={() => setSolicitudSeleccionada(null)}
              >
                ×
              </button>
            </header>

            <div className={styles.modalGrid}>
              <div><span>Tipo de solicitud</span><strong>{obtenerTipo(solicitudSeleccionada)}</strong></div>
              <div><span>Medio de pago</span><strong>{solicitudSeleccionada.medio_pago ?? "—"}</strong></div>
              <div><span>Fecha de aprobación</span><strong>{formatearFecha(solicitudSeleccionada.aprobado_2_en)}</strong></div>
              <div><span>Beneficiario</span><strong>{obtenerBeneficiario(solicitudSeleccionada)}</strong></div>
              <div><span>Documento</span><strong>{solicitudSeleccionada.beneficiario?.tipo_documento ?? "—"} {solicitudSeleccionada.beneficiario?.numero_documento ?? ""}</strong></div>
              <div><span>Banco</span><strong>{solicitudSeleccionada.beneficiario?.banco ?? "No registrado"}</strong></div>
              <div><span>Tipo de cuenta</span><strong>{solicitudSeleccionada.beneficiario?.tipo_cuenta_bancaria ?? "No registrado"}</strong></div>
              <div className={styles.fullWidth}><span>Número de cuenta</span><strong>{solicitudSeleccionada.beneficiario?.numero_cuenta_bancaria ?? "No registrado"}</strong></div>
            </div>

            <div className={styles.values}>
              <div><span>Valor bruto</span><strong>{FORMATEADOR_MONEDA.format(solicitudSeleccionada.valor_bruto)}</strong></div>
              <div><span>Impuestos y retenciones</span><strong>{FORMATEADOR_MONEDA.format(solicitudSeleccionada.valor_retenciones)}</strong></div>
              <div><span>Descuentos</span><strong>{FORMATEADOR_MONEDA.format(solicitudSeleccionada.valor_descuentos)}</strong></div>
              <div className={styles.netValue}><span>Valor neto</span><strong>{FORMATEADOR_MONEDA.format(solicitudSeleccionada.valor_neto)}</strong></div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
