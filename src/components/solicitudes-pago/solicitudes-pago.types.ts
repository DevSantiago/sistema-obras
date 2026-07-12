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
    habilitado: false,
    etiquetaEstado: "Próximamente",
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