import type { MedioPagoSolicitud } from "@/modules/solicitudes-pago/solicitudes-pago.types";

export type TipoSolicitudFormulario =
  | "PAGO_PROVEEDOR"
  | "NOMINA_INDIVIDUAL"
  | "NOMINA_GRUPAL"
  | "PAGO_IMPUESTO"
  | "REEMBOLSO";

export type OpcionTipoSolicitud = {
  id: TipoSolicitudFormulario;
  titulo: string;
  descripcion: string;
  habilitado: boolean;
  etiquetaEstado?: string;
};

export type CrearSolicitudProveedorPayload = {
  tipo_solicitud: "PAGO_PROVEEDOR";
  proyecto_base_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  categoria_gasto: string;
  medio_pago: MedioPagoSolicitud;
  descripcion: string;
  valor_bruto: number;
  valor_impuestos: number;
  valor_retenciones: number;
  valor_descuentos: number;
};

export type CrearSolicitudNominaIndividualPayload = {
  tipo_solicitud: "PAGO_NOMINA";
  modalidad_nomina: "INDIVIDUAL";
  periodo_nomina: string;
  proyecto_base_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  concepto_nomina: string;
  medio_pago: MedioPagoSolicitud;
  descripcion: string;
  valor_bruto: number;
  valor_retenciones: number;
  valor_descuentos: number;
};

export type CrearSolicitudFrontendPayload =
  | CrearSolicitudProveedorPayload
  | CrearSolicitudNominaIndividualPayload;

export type NominaIndividualFormularioState = {
  proyecto_base_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  periodo_nomina: string;
  concepto_nomina: string;
  medio_pago: MedioPagoSolicitud | "";
  descripcion: string;
  valor_bruto: string;
  valor_retenciones: string;
  valor_descuentos: string;
};

export const OPCIONES_TIPO_SOLICITUD: OpcionTipoSolicitud[] = [
  {
    id: "PAGO_PROVEEDOR",
    titulo: "Pago a proveedor",
    descripcion:
      "Facturas, cuentas de cobro, materiales, servicios y demás obligaciones con proveedores.",
    habilitado: true,
  },
  {
    id: "NOMINA_INDIVIDUAL",
    titulo: "Nómina individual",
    descripcion:
      "Pago individual de nómina, honorarios u otros conceptos asociados a un trabajador.",
    habilitado: true,
  },
  {
    id: "NOMINA_GRUPAL",
    titulo: "Nómina grupal",
    descripcion:
      "Carga y procesamiento de pagos para varios trabajadores dentro de una misma solicitud.",
    habilitado: false,
    etiquetaEstado: "Próximamente",
  },
  {
    id: "PAGO_IMPUESTO",
    titulo: "Pago de impuestos",
    descripcion:
      "Obligaciones tributarias, retenciones y otros pagos asociados a entidades recaudadoras.",
    habilitado: false,
    etiquetaEstado: "Próximamente",
  },
  {
    id: "REEMBOLSO",
    titulo: "Reembolso",
    descripcion:
      "Devolución de gastos asumidos por ingenieros, directores u otros colaboradores del proyecto.",
    habilitado: false,
    etiquetaEstado: "Próximamente",
  },
];