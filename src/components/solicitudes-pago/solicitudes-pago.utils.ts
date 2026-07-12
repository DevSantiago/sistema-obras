import type {
  BeneficiarioSolicitudCatalogo,
  CentroCostoSolicitudCatalogo,
  MedioPagoSolicitud,
  ProyectoBaseSolicitudCatalogo,
  SolicitudPagoFormularioState,
  UsuarioSesionSolicitudesPago,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";

export type ValoresSolicitudPago = {
  valorBruto: number;
  valorImpuestos: number;
  valorRetenciones: number;
  valorDescuentos: number;
  valorNeto: number;
};

export const ESTADO_INICIAL_FORMULARIO: SolicitudPagoFormularioState = {
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

export const CATEGORIAS_GASTO = [
  "MATERIALES",
  "MANO_OBRA",
  "EQUIPOS",
  "SERVICIOS",
  "TRANSPORTE",
  "ADMINISTRATIVO",
  "OTRO",
] as const;

export const MEDIOS_PAGO: MedioPagoSolicitud[] = [
  "TRANSFERENCIA",
  "CONSIGNACION",
  "EFECTIVO",
];

export function obtenerCentrosCosto(
  proyecto?: ProyectoBaseSolicitudCatalogo | null,
) {
  return proyecto?.centros_costo ?? proyecto?.centrosCosto ?? [];
}

export function obtenerValorFormulario(
  formData: FormData,
  campo: string,
): string {
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

export function construirFormularioDesdeFormData(
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

function limpiarSeparadoresNumericos(valor: string): string {
  return valor.replace(/[^\d]/g, "");
}

export function formatearValorEntrada(valor: string): string {
  const valorLimpio = limpiarSeparadoresNumericos(valor);

  if (!valorLimpio) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(valorLimpio));
}

function convertirNumero(valor: string): number {
  const valorLimpio = valor.replaceAll(",", "").trim();

  if (!valorLimpio) {
    return 0;
  }

  const numero = Number(valorLimpio);

  return Number.isFinite(numero) ? numero : 0;
}

export function calcularValoresSolicitudPago(
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

export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatearFecha(fecha: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(fecha));
}

export function formatearTextoDominio(valor?: string | null): string {
  return valor?.replaceAll("_", " ") ?? "No definido";
}

function usuarioTieneRol(
  usuario: UsuarioSesionSolicitudesPago,
  rol: string,
): boolean {
  return usuario.roles.includes(rol);
}

export function centroCostoPermitidoParaUsuario(
  centroCosto: CentroCostoSolicitudCatalogo,
  usuario: UsuarioSesionSolicitudesPago,
): boolean {
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

export function obtenerDocumentoBeneficiario(
  beneficiario: BeneficiarioSolicitudCatalogo,
): string {
  return [beneficiario.tipo_documento, beneficiario.numero_documento]
    .filter((valor): valor is string => Boolean(valor?.trim()))
    .map((valor) => valor.trim())
    .join(" ");
}

export function obtenerEtiquetaBeneficiario(
  beneficiario: BeneficiarioSolicitudCatalogo,
): string {
  const documento = obtenerDocumentoBeneficiario(beneficiario);

  return documento
    ? `${beneficiario.nombre} · ${documento}`
    : beneficiario.nombre;
}

export function buscarBeneficiarioPorEtiqueta(
  beneficiarios: BeneficiarioSolicitudCatalogo[],
  etiqueta: string,
): BeneficiarioSolicitudCatalogo | null {
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