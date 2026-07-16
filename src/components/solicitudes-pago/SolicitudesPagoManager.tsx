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
import { useCallback, useEffect, useMemo, useState } from "react";
import NominaGrupalForm from "./forms/NominaGrupalForm";
import NominaIndividualForm from "./forms/NominaIndividualForm";
import PagoImpuestoForm from "./forms/PagoImpuestoForm";
import ProveedorForm from "./forms/ProveedorForm";
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
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  const opcionesTipoSolicitud = useMemo<OpcionTipoSolicitud[]>(() => {
    const puedeCrearNomina = usuarioPuedeCrearNomina(usuario);
    const puedeCrearImpuesto = usuarioPuedeCrearPagoImpuesto(usuario);

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

  function limpiarMensajes() {
    setMensajeError("");
    setMensajeExito("");
  }

  function cambiarTipoSolicitud(tipo: TipoSolicitudFormulario) {
    setTipoSeleccionado(tipo);
    setProyectoBaseSeleccionadoId("");
    limpiarMensajes();
  }

  async function crearSolicitud(
    payload: CrearSolicitudFrontendPayload,
  ): Promise<void> {
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
          body: JSON.stringify(payload),
        },
      );

      const solicitudCreada = response.data?.solicitud;

      if (solicitudCreada) {
        setSolicitudes((actuales) => [solicitudCreada, ...actuales]);
      } else {
        await cargarSolicitudes();
      }

      setMensajeExito(response.message ?? "Solicitud creada correctamente.");
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

  async function crearSolicitudProveedor(
    payload: CrearSolicitudProveedorPayload,
  ): Promise<void> {
    await crearSolicitud(payload);
  }

  async function crearSolicitudNominaIndividual(
    payload: CrearSolicitudNominaIndividualPayload,
  ): Promise<void> {
    await crearSolicitud(payload);
  }

  async function crearSolicitudPagoImpuesto(
    payload: CrearSolicitudPagoImpuestoPayload,
  ): Promise<void> {
    await crearSolicitud(payload);
  }

  async function manejarNominaGrupalCreada(
    mensaje: string,
  ): Promise<void> {
    setMensajeError("");
    setMensajeExito(mensaje);
    setProyectoBaseSeleccionadoId("");

    await cargarSolicitudes();
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
            onCrear={crearSolicitudProveedor}
            onLimpiarMensajes={limpiarMensajes}
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
            onCrear={crearSolicitudNominaIndividual}
            onLimpiarMensajes={limpiarMensajes}
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
          />
        );

      case "REEMBOLSO":
        return null;

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

      {renderizarFormulario()}

      <SolicitudesPagoList
        solicitudes={solicitudes}
        cargando={cargandoSolicitudes}
        onActualizar={cargarSolicitudes}
      />
    </div>
  );
}