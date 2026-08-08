"use client";

import type {
  BeneficiariosSolicitudResponseData,
  BeneficiarioSolicitudCatalogo,
  ProyectoBaseSolicitudCatalogo,
  ProyectosBaseSolicitudResponseData,
  SolicitudPagoListado,
  SolicitudesPagoApiResponse,
  SolicitudesPagoResponseData,
  UsuarioSesionSolicitudesPago,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NominaGrupalForm from "./forms/NominaGrupalForm";
import NominaIndividualForm from "./forms/NominaIndividualForm";
import PagoImpuestoForm from "./forms/PagoImpuestoForm";
import ProveedorForm from "./forms/ProveedorForm";
import ReembolsoForm from "./forms/ReembolsoForm";
import SolicitudesPagoList from "./lists/SolicitudesPagoList";
import styles from "./SolicitudesPagoManager.module.css";
import {
  OPCIONES_TIPO_SOLICITUD,
  type CrearSolicitudFrontendPayload,
  type CrearSolicitudNominaIndividualPayload,
  type CrearSolicitudPagoImpuestoPayload,
  type CrearSolicitudProveedorPayload,
  type OpcionTipoSolicitud,
  type TipoSolicitudFormulario,
} from "./solicitudes-pago.types";
import {
  centroCostoPermitidoParaUsuario,
  formatearEstadoSolicitud,
  formatearFechaHora,
  formatearMoneda,
  formatearTextoDominio,
  obtenerCentrosCosto,
} from "./solicitudes-pago.utils";
import SolicitudTipoSelector from "./shared/SolicitudTipoSelector";

type SolicitudesPagoManagerProps = {
  usuario: UsuarioSesionSolicitudesPago;
};

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

function usuarioTienePermiso(
  usuario: UsuarioSesionSolicitudesPago,
  permiso: string,
): boolean {
  return usuario.permisos?.includes(permiso) ?? false;
}

function usuarioPuedeCrearNomina(
  usuario: UsuarioSesionSolicitudesPago,
): boolean {
  if (usuario.roles.includes("ADMINISTRADOR")) {
    return true;
  }

  return (
    usuario.roles.includes("DIRECTOR") &&
    usuarioTienePermiso(usuario, "CREAR_SOLICITUDES")
  );
}

function esTipoNomina(tipo: TipoSolicitudFormulario): boolean {
  return tipo === "NOMINA_INDIVIDUAL" || tipo === "NOMINA_GRUPAL";
}

function usuarioPuedeCrearPagoImpuesto(
  usuario: UsuarioSesionSolicitudesPago,
): boolean {
  return [
    "APROBADOR_1",
    "DIRECTOR",
    "AUXILIAR_CONTABLE",
    "ADMINISTRADOR",
  ].some((rol) => usuario.roles.includes(rol));
}


function usuarioPuedeCrearReembolso(
  usuario: UsuarioSesionSolicitudesPago,
): boolean {
  return [
    "SOLICITANTE",
    "APROBADOR_1",
    "DIRECTOR",
    "AUXILIAR_CONTABLE",
    "ADMINISTRADOR",
  ].some((rol) => usuario.roles.includes(rol));
}

function construirSolicitudFormData(
  payload: CrearSolicitudFrontendPayload,
  archivos: File[],
): FormData {
  const formData = new FormData();

  for (const [campo, valor] of Object.entries(payload)) {
    formData.append(campo, String(valor));
  }

  for (const archivo of archivos) {
    formData.append("archivos", archivo);
  }

  return formData;
}

export default function SolicitudesPagoManager({
  usuario,
}: SolicitudesPagoManagerProps) {
  const [tipoSeleccionado, setTipoSeleccionado] =
    useState<TipoSolicitudFormulario>("PAGO_PROVEEDOR");

  const [proyectos, setProyectos] = useState<
    ProyectoBaseSolicitudCatalogo[]
  >([]);

  const [beneficiariosProveedor, setBeneficiariosProveedor] = useState<
    BeneficiarioSolicitudCatalogo[]
  >([]);

  const [trabajadores, setTrabajadores] = useState<
    BeneficiarioSolicitudCatalogo[]
  >([]);

  const [entidadesRecaudadoras, setEntidadesRecaudadoras] = useState<
    BeneficiarioSolicitudCatalogo[]
  >([]);

  const [solicitudes, setSolicitudes] = useState<SolicitudPagoListado[]>([]);
  const [proyectoBaseSeleccionadoId, setProyectoBaseSeleccionadoId] =
    useState("");
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [enviandoSolicitudId, setEnviandoSolicitudId] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [solicitudEnEdicion, setSolicitudEnEdicion] =
    useState<SolicitudPagoListado | null>(null);
  const [solicitudDetalle, setSolicitudDetalle] =
    useState<SolicitudPagoListado | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const formularioRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!solicitudEnEdicion) {
      return;
    }

    let segundoFrame = 0;
    const primerFrame = window.requestAnimationFrame(() => {
      segundoFrame = window.requestAnimationFrame(() => {
        formularioRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(primerFrame);
      window.cancelAnimationFrame(segundoFrame);
    };
  }, [solicitudEnEdicion]);

  const opcionesTipoSolicitud = useMemo<OpcionTipoSolicitud[]>(() => {
    const puedeCrearNomina = usuarioPuedeCrearNomina(usuario);
    const puedeCrearImpuesto = usuarioPuedeCrearPagoImpuesto(usuario);
    const puedeCrearReembolso = usuarioPuedeCrearReembolso(usuario);

    return OPCIONES_TIPO_SOLICITUD.map((opcion) => {
      if (esTipoNomina(opcion.id)) {
        return {
          ...opcion,
          habilitado: opcion.habilitado && puedeCrearNomina,
          etiquetaEstado: puedeCrearNomina ? undefined : "Sin permiso",
        };
      }

      if (opcion.id === "PAGO_IMPUESTO") {
        return {
          ...opcion,
          habilitado: opcion.habilitado && puedeCrearImpuesto,
          etiquetaEstado: puedeCrearImpuesto ? undefined : "Sin permiso",
        };
      }

      if (opcion.id === "REEMBOLSO") {
        return {
          ...opcion,
          habilitado: opcion.habilitado && puedeCrearReembolso,
          etiquetaEstado: puedeCrearReembolso ? undefined : "Sin permiso",
        };
      }

      return opcion;
    });
  }, [usuario]);

  const proyectoSeleccionado = useMemo(
    () =>
      proyectos.find(
        (proyecto) => proyecto.id === proyectoBaseSeleccionadoId,
      ) ?? null,
    [proyectoBaseSeleccionadoId, proyectos],
  );

  const centrosCostoDisponibles = useMemo(() => {
    return obtenerCentrosCosto(proyectoSeleccionado).filter((centroCosto) =>
      centroCostoPermitidoParaUsuario(centroCosto, usuario),
    );
  }, [proyectoSeleccionado, usuario]);

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
      fetchJson<BeneficiariosSolicitudResponseData>(
        "/api/v1/beneficiarios?tipo_beneficiario=TRABAJADOR&activo=true",
        {
          signal: abortController.signal,
        },
      ),
      fetchJson<BeneficiariosSolicitudResponseData>(
        "/api/v1/beneficiarios?tipo_beneficiario=OTRO&activo=true",
        {
          signal: abortController.signal,
        },
      ),
      fetchJson<SolicitudesPagoResponseData>("/api/v1/solicitudes-pago", {
        signal: abortController.signal,
      }),
    ])
      .then(
        ([
          proyectosResponse,
          proveedoresResponse,
          trabajadoresResponse,
          entidadesResponse,
          solicitudesResponse,
        ]) => {
          setProyectos(extraerProyectos(proyectosResponse.data));

          setBeneficiariosProveedor(
            extraerBeneficiarios(proveedoresResponse.data),
          );

          setTrabajadores(
            extraerBeneficiarios(trabajadoresResponse.data),
          );

          setEntidadesRecaudadoras(
            extraerBeneficiarios(entidadesResponse.data),
          );

          setSolicitudes(extraerSolicitudes(solicitudesResponse.data));
        },
      )
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

  useEffect(() => {
    function manejarErrorFormulario(event: Event) {
      const customEvent = event as CustomEvent<string>;

      setMensajeError(
        customEvent.detail || "No fue posible validar el formulario.",
      );
      setMensajeExito("");
    }

    window.addEventListener(
      "solicitudes-pago-form-error",
      manejarErrorFormulario,
    );

    return () => {
      window.removeEventListener(
        "solicitudes-pago-form-error",
        manejarErrorFormulario,
      );
    };
  }, []);

  useEffect(() => {
    if (!solicitudDetalle) return;

    function cerrarDetalle(event: KeyboardEvent) {
      if (event.key === "Escape") setSolicitudDetalle(null);
    }

    window.addEventListener("keydown", cerrarDetalle);
    return () => window.removeEventListener("keydown", cerrarDetalle);
  }, [solicitudDetalle]);

  function limpiarMensajes() {
    setMensajeError("");
    setMensajeExito("");
  }

  function cambiarTipoSolicitud(tipo: TipoSolicitudFormulario) {
    setTipoSeleccionado(tipo);
    setSolicitudEnEdicion(null);
    setProyectoBaseSeleccionadoId("");
    limpiarMensajes();
  }

  function editarSolicitud(solicitud: SolicitudPagoListado) {
    switch (solicitud.tipo_solicitud) {
      case "PAGO_PROVEEDOR":
        setTipoSeleccionado("PAGO_PROVEEDOR");
        break;

      case "PAGO_NOMINA":
        setTipoSeleccionado(
          solicitud.modalidad_nomina === "AGRUPADA_EXCEL"
            ? "NOMINA_GRUPAL"
            : "NOMINA_INDIVIDUAL",
        );
        break;

      case "REEMBOLSO":
        setTipoSeleccionado("REEMBOLSO");
        break;

      case "PAGO_IMPUESTO":
        setTipoSeleccionado("PAGO_IMPUESTO");
        break;

      default:
        setMensajeError(
          "Por ahora este tipo de solicitud todavía no admite edición desde el formulario.",
        );
        setMensajeExito("");
        return;
    }

    setSolicitudEnEdicion(solicitud);
    setProyectoBaseSeleccionadoId(solicitud.proyecto_base_id);
    limpiarMensajes();
  }

  function cancelarEdicion() {
    setSolicitudEnEdicion(null);
    setProyectoBaseSeleccionadoId("");
    limpiarMensajes();
  }

  async function crearSolicitud(
    payload: CrearSolicitudFrontendPayload,
    archivos: File[] = [],
  ): Promise<void> {
    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const requestInit: RequestInit =
        archivos.length > 0
          ? {
              method: "POST",
              body: construirSolicitudFormData(payload, archivos),
            }
          : {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            };

      const response = await fetchJson<SolicitudesPagoResponseData>(
        "/api/v1/solicitudes-pago",
        requestInit,
      );

      const solicitudCreada = response.data?.solicitud;

      if (solicitudCreada) {
        setSolicitudes((actuales) => [solicitudCreada, ...actuales]);
      } else {
        await cargarSolicitudes();
      }

      setMensajeExito(
        response.message ?? "Solicitud creada correctamente.",
      );
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible crear la solicitud de pago.";

      setMensajeError(mensaje);
      throw new Error(mensaje);
    } finally {
      setGuardando(false);
    }
  }

  async function guardarSolicitudProveedor(
    payload:
      | CrearSolicitudProveedorPayload
      | CrearSolicitudPagoImpuestoPayload,
    archivos: File[] = [],
  ): Promise<void> {
    if (!solicitudEnEdicion) {
      await crearSolicitud(payload, archivos);
      return;
    }

    if (archivos.length > 0) {
      throw new Error(
        "Los adjuntos nuevos todavía no pueden agregarse durante la edición. Guarde primero los cambios sin seleccionar archivos.",
      );
    }

    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const response = await fetchJson<SolicitudesPagoResponseData>(
        `/api/v1/solicitudes-pago/${solicitudEnEdicion.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const solicitudActualizada = response.data?.solicitud;

      if (solicitudActualizada) {
        setSolicitudes((actuales) =>
          actuales.map((solicitud) =>
            solicitud.id === solicitudActualizada.id
              ? solicitudActualizada
              : solicitud,
          ),
        );
      } else {
        await cargarSolicitudes();
      }

      setSolicitudEnEdicion(null);
      setProyectoBaseSeleccionadoId("");
      setMensajeExito(
        response.message ?? "Solicitud actualizada correctamente.",
      );
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible actualizar la solicitud de pago.";

      setMensajeError(mensaje);
      throw new Error(mensaje);
    } finally {
      setGuardando(false);
    }
  }

  async function guardarSolicitudNominaIndividual(
    payload: CrearSolicitudNominaIndividualPayload,
    archivos: File[] = [],
  ): Promise<void> {
    if (!solicitudEnEdicion) {
      await crearSolicitud(payload, archivos);
      return;
    }

    if (archivos.length > 0) {
      throw new Error(
        "Los adjuntos nuevos todavía no pueden agregarse durante la edición. Guarde primero los cambios sin seleccionar archivos.",
      );
    }

    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const response = await fetchJson<SolicitudesPagoResponseData>(
        `/api/v1/solicitudes-pago/${solicitudEnEdicion.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const solicitudActualizada = response.data?.solicitud;

      if (solicitudActualizada) {
        setSolicitudes((actuales) =>
          actuales.map((solicitud) =>
            solicitud.id === solicitudActualizada.id
              ? solicitudActualizada
              : solicitud,
          ),
        );
      } else {
        await cargarSolicitudes();
      }

      setSolicitudEnEdicion(null);
      setProyectoBaseSeleccionadoId("");
      setMensajeExito(
        response.message ??
          "Solicitud de nómina individual actualizada correctamente.",
      );
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible actualizar la solicitud de nómina individual.";

      setMensajeError(mensaje);
      throw new Error(mensaje);
    } finally {
      setGuardando(false);
    }
  }

  async function crearSolicitudPagoImpuesto(
    payload: CrearSolicitudPagoImpuestoPayload,
    archivos: File[] = [],
  ): Promise<void> {
    if (!solicitudEnEdicion) {
      await crearSolicitud(payload, archivos);
      return;
    }

    await guardarSolicitudProveedor(payload, archivos);
  }

  async function crearSolicitudReembolso(
    formData: FormData,
  ): Promise<void> {
    if (solicitudEnEdicion) {
      setGuardando(true);
      setMensajeError("");
      setMensajeExito("");

      try {
        const response = await fetchJson<SolicitudesPagoResponseData>(
          `/api/v1/solicitudes-pago/${solicitudEnEdicion.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tipo_solicitud: "REEMBOLSO",
              proyecto_base_id: formData.get("proyecto_base_id"),
              centro_costo_id: formData.get("centro_costo_id"),
              beneficiario_id: formData.get("beneficiario_id"),
              categoria_reembolso: formData.get("categoria_reembolso"),
              medio_pago: formData.get("medio_pago"),
              descripcion: formData.get("descripcion"),
              valor_bruto: formData.get("valor_bruto"),
              valor_retenciones: formData.get("valor_retenciones"),
              valor_descuentos: formData.get("valor_descuentos"),
            }),
          },
        );

        const solicitudActualizada = response.data?.solicitud;

        if (solicitudActualizada) {
          setSolicitudes((actuales) =>
            actuales.map((solicitud) =>
              solicitud.id === solicitudActualizada.id
                ? solicitudActualizada
                : solicitud,
            ),
          );
        } else {
          await cargarSolicitudes();
        }

        setSolicitudEnEdicion(null);
        setProyectoBaseSeleccionadoId("");
        setMensajeExito(
          response.message ??
            "Solicitud de reembolso actualizada correctamente.",
        );
      } catch (error) {
        const mensaje =
          error instanceof Error
            ? error.message
            : "No fue posible actualizar la solicitud de reembolso.";

        setMensajeError(mensaje);
        throw new Error(mensaje);
      } finally {
        setGuardando(false);
      }

      return;
    }

    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const response = await fetchJson<SolicitudesPagoResponseData>(
        "/api/v1/solicitudes-pago/reembolsos",
        {
          method: "POST",
          body: formData,
        },
      );

      const solicitudCreada = response.data?.solicitud;

      if (solicitudCreada) {
        setSolicitudes((actuales) => [solicitudCreada, ...actuales]);
      } else {
        await cargarSolicitudes();
      }

      setMensajeExito(
        response.message ?? "Solicitud de reembolso creada correctamente.",
      );
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible crear la solicitud de reembolso.";

      setMensajeError(mensaje);
      throw new Error(mensaje);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarNominaGrupalCreada(
    mensaje: string,
  ): Promise<void> {
    setMensajeError("");
    setMensajeExito(mensaje);
    setProyectoBaseSeleccionadoId("");
    setSolicitudEnEdicion(null);

    await cargarSolicitudes();
  }

  async function enviarSolicitud(solicitudId: string): Promise<void> {
    setEnviandoSolicitudId(solicitudId);
    setMensajeError("");
    setMensajeExito("");

    try {
      const response = await fetchJson<SolicitudesPagoResponseData>(
        `/api/v1/solicitudes-pago/${solicitudId}/enviar`,
        {
          method: "POST",
        },
      );

      const solicitudActualizada = response.data?.solicitud;

      if (solicitudActualizada) {
        setSolicitudes((actuales) =>
          actuales.map((solicitud) =>
            solicitud.id === solicitudActualizada.id
              ? solicitudActualizada
              : solicitud,
          ),
        );
      } else {
        await cargarSolicitudes();
      }

      setMensajeExito(
        response.message ?? "Solicitud enviada para aprobación correctamente.",
      );
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No fue posible enviar la solicitud para aprobación.",
      );
    } finally {
      setEnviandoSolicitudId(null);
    }
  }

  async function devolverSolicitudAlSolicitante(
    solicitud: SolicitudPagoListado,
  ): Promise<void> {
    const motivo = window.prompt(
      `Motivo para devolver ${solicitud.numero_solicitud} al solicitante:`,
    )?.trim();

    if (!motivo) return;

    if (motivo.length < 5) {
      setMensajeError("El motivo debe tener al menos 5 caracteres.");
      return;
    }

    setEnviandoSolicitudId(solicitud.id);
    setMensajeError("");
    setMensajeExito("");

    try {
      const response = await fetchJson(
        `/api/v1/solicitudes-pago/${solicitud.id}/devolver`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motivo }),
        },
      );
      setMensajeExito(response.message ?? "Solicitud devuelta al solicitante.");
      await cargarSolicitudes();
    } catch (error) {
      setMensajeError(error instanceof Error ? error.message : "No fue posible devolver la solicitud.");
    } finally {
      setEnviandoSolicitudId(null);
    }
  }

  async function verDetalleSolicitud(
    solicitud: SolicitudPagoListado,
  ): Promise<void> {
    setSolicitudDetalle(solicitud);
    setCargandoDetalle(true);

    try {
      const response = await fetchJson<{ solicitud: SolicitudPagoListado }>(
        `/api/v1/solicitudes-pago/${solicitud.id}`,
        { cache: "no-store" },
      );

      if (response.data?.solicitud) {
        setSolicitudDetalle(response.data.solicitud);
      }
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No fue posible consultar el detalle de la solicitud.",
      );
    } finally {
      setCargandoDetalle(false);
    }
  }

  function renderizarFormulario() {
    switch (tipoSeleccionado) {
      case "PAGO_PROVEEDOR":
        return (
          <ProveedorForm
            proyectos={proyectos}
            centrosCostoDisponibles={centrosCostoDisponibles}
            beneficiarios={beneficiariosProveedor}
            cargandoCatalogos={cargandoCatalogos}
            guardando={guardando}
            mensajeExito={mensajeExito}
            mensajeError={mensajeError}
            onProyectoChange={setProyectoBaseSeleccionadoId}
            onCrear={guardarSolicitudProveedor}
            onLimpiarMensajes={limpiarMensajes}
            solicitudEnEdicion={solicitudEnEdicion}
            onCancelarEdicion={cancelarEdicion}
          />
        );

      case "NOMINA_INDIVIDUAL":
        return (
          <NominaIndividualForm
            proyectos={proyectos}
            centrosCostoDisponibles={centrosCostoDisponibles}
            trabajadores={trabajadores}
            cargandoCatalogos={cargandoCatalogos}
            guardando={guardando}
            mensajeExito={mensajeExito}
            mensajeError={mensajeError}
            onProyectoChange={setProyectoBaseSeleccionadoId}
            onCrear={guardarSolicitudNominaIndividual}
            onLimpiarMensajes={limpiarMensajes}
            solicitudEnEdicion={solicitudEnEdicion}
            onCancelarEdicion={cancelarEdicion}
          />
        );

      case "NOMINA_GRUPAL":
        return (
          <NominaGrupalForm
            proyectos={proyectos}
            centrosCostoDisponibles={centrosCostoDisponibles}
            cargandoCatalogos={cargandoCatalogos}
            mensajeExito={mensajeExito}
            mensajeError={mensajeError}
            onProyectoChange={setProyectoBaseSeleccionadoId}
            onCreada={manejarNominaGrupalCreada}
            onLimpiarMensajes={limpiarMensajes}
            solicitudEnEdicion={solicitudEnEdicion}
            onCancelarEdicion={cancelarEdicion}
          />
        );

      case "PAGO_IMPUESTO":
        return (
          <PagoImpuestoForm
            proyectos={proyectos}
            centrosCostoDisponibles={centrosCostoDisponibles}
            entidadesRecaudadoras={entidadesRecaudadoras}
            cargandoCatalogos={cargandoCatalogos}
            guardando={guardando}
            mensajeExito={mensajeExito}
            mensajeError={mensajeError}
            onProyectoChange={setProyectoBaseSeleccionadoId}
            onCrear={crearSolicitudPagoImpuesto}
            onLimpiarMensajes={limpiarMensajes}
            solicitudEnEdicion={solicitudEnEdicion}
            onCancelarEdicion={cancelarEdicion}
          />
        );

      case "REEMBOLSO":
        return (
          <ReembolsoForm
            proyectos={proyectos}
            centrosCostoDisponibles={centrosCostoDisponibles}
            trabajadores={trabajadores}
            cargandoCatalogos={cargandoCatalogos}
            guardando={guardando}
            mensajeExito={mensajeExito}
            mensajeError={mensajeError}
            onProyectoChange={setProyectoBaseSeleccionadoId}
            onCrear={crearSolicitudReembolso}
            onLimpiarMensajes={limpiarMensajes}
            solicitudEnEdicion={solicitudEnEdicion}
            onCancelarEdicion={cancelarEdicion}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className={styles.container}>
      <SolicitudTipoSelector
        opciones={opcionesTipoSolicitud}
        tipoSeleccionado={tipoSeleccionado}
        onChange={cambiarTipoSolicitud}
      />

      <div
        id="formulario-solicitud"
        ref={formularioRef}
        className={styles.formAnchor}
      >
        {renderizarFormulario()}
      </div>

      <SolicitudesPagoList
        solicitudes={solicitudes}
        usuario={usuario}
        cargando={cargandoSolicitudes}
        enviandoSolicitudId={enviandoSolicitudId}
        onEnviar={enviarSolicitud}
        onEditar={editarSolicitud}
        onDevolver={devolverSolicitudAlSolicitante}
        onVerDetalle={(solicitud) => void verDetalleSolicitud(solicitud)}
        onActualizar={cargarSolicitudes}
      />

      {solicitudDetalle ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSolicitudDetalle(null);
            }
          }}
        >
          <section
            className={styles.detailDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="solicitud-detail-title"
          >
            <header className={styles.detailHeader}>
              <div>
                <span className={styles.detailEyebrow}>Detalle de solicitud</span>
                <h2 id="solicitud-detail-title">
                  {solicitudDetalle.numero_solicitud ?? "Borrador sin número"}
                </h2>
                <div className={styles.detailMeta}>
                  <span className={styles.detailStatus}>
                    {formatearEstadoSolicitud(solicitudDetalle.estado_actual)}
                  </span>
                  <span>{formatearTextoDominio(solicitudDetalle.tipo_solicitud)}</span>
                </div>
              </div>
              <button
                className={styles.modalCloseButton}
                type="button"
                aria-label="Cerrar detalle de la solicitud"
                onClick={() => setSolicitudDetalle(null)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>

            {cargandoDetalle ? (
              <div className={styles.detailLoading}>Actualizando información…</div>
            ) : null}

            <section className={styles.detailSection}>
              <h3>Información general</h3>
              <dl className={styles.detailGrid}>
                <div><dt>Proyecto</dt><dd>{solicitudDetalle.proyecto_base?.nombre ?? "—"}</dd></div>
                <div><dt>Centro de costo</dt><dd>{solicitudDetalle.centro_costo?.nombre ?? "—"}</dd></div>
                <div><dt>Beneficiario</dt><dd>{solicitudDetalle.beneficiario?.nombre ?? "—"}</dd></div>
                <div><dt>Medio de pago</dt><dd>{formatearTextoDominio(solicitudDetalle.medio_pago)}</dd></div>
                {solicitudDetalle.categoria_gasto ? <div><dt>Categoría</dt><dd>{formatearTextoDominio(solicitudDetalle.categoria_gasto)}</dd></div> : null}
                {solicitudDetalle.categoria_reembolso ? <div><dt>Categoría</dt><dd>{formatearTextoDominio(solicitudDetalle.categoria_reembolso)}</dd></div> : null}
                {solicitudDetalle.concepto_nomina ? <div><dt>Concepto de nómina</dt><dd>{formatearTextoDominio(solicitudDetalle.concepto_nomina)}</dd></div> : null}
                {solicitudDetalle.periodo_nomina ? <div><dt>Periodo de nómina</dt><dd>{solicitudDetalle.periodo_nomina}</dd></div> : null}
                {solicitudDetalle.tipo_impuesto ? <div><dt>Tipo de impuesto</dt><dd>{formatearTextoDominio(solicitudDetalle.tipo_impuesto)}</dd></div> : null}
                {solicitudDetalle.periodo_impuesto ? <div><dt>Periodo de impuesto</dt><dd>{solicitudDetalle.periodo_impuesto}</dd></div> : null}
                <div><dt>Solicitante</dt><dd>{solicitudDetalle.creador?.nombre ?? "—"}</dd></div>
                <div className={styles.detailWide}><dt>Descripción</dt><dd>{solicitudDetalle.descripcion}</dd></div>
              </dl>
            </section>

            <section className={styles.detailSection}>
              <h3>Resumen de valores</h3>
              <dl className={`${styles.detailGrid} ${styles.valuesGrid}`}>
                <div><dt>Valor bruto</dt><dd>{formatearMoneda(solicitudDetalle.valor_bruto)}</dd></div>
                <div><dt>Impuestos y retenciones</dt><dd>{formatearMoneda(solicitudDetalle.valor_retenciones)}</dd></div>
                <div><dt>Descuentos</dt><dd>{formatearMoneda(solicitudDetalle.valor_descuentos)}</dd></div>
                <div className={styles.detailNet}><dt>Valor neto a pagar</dt><dd>{formatearMoneda(solicitudDetalle.valor_neto)}</dd></div>
              </dl>
            </section>

            <section className={styles.detailSection}>
              <h3>Fechas del proceso</h3>
              <dl className={styles.processTimeline}>
                <div><dt>Creación</dt><dd>{formatearFechaHora(solicitudDetalle.creado_en)}</dd></div>
                <div><dt>Aprobación nivel 1</dt><dd>{formatearFechaHora(solicitudDetalle.aprobado_1_en)}</dd></div>
                <div><dt>Aprobación nivel 2</dt><dd>{formatearFechaHora(solicitudDetalle.aprobado_2_en)}</dd></div>
                <div><dt>Pago</dt><dd>{formatearFechaHora(solicitudDetalle.pagado_en)}</dd></div>
              </dl>
            </section>

            {solicitudDetalle.estado_actual === "PAGADA" &&
            solicitudDetalle.comprobante_pago ? (
              <section className={styles.detailSection}>
                <h3>Comprobante de pago</h3>
                <a
                  className={styles.receiptLink}
                  href={`/api/v1/solicitudes-pago/${solicitudDetalle.id}/comprobante`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{solicitudDetalle.comprobante_pago.nombre_archivo}</span>
                  <strong>Ver comprobante</strong>
                </a>
              </section>
            ) : null}

            {solicitudDetalle.ultima_devolucion ? (
              <aside className={styles.returnReason}>
                <strong>Último motivo de devolución</strong>
                <p>{solicitudDetalle.ultima_devolucion.motivo}</p>
              </aside>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
