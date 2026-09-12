import type {
  MedioPagoPreferido,
  TipoBeneficiario,
  TipoCuentaBancaria,
} from "@/modules/beneficiarios/beneficiarios.types";

export type DatosBeneficiarioContextual = {
  tipoBeneficiario: TipoBeneficiario;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  medioPago: MedioPagoPreferido;
  banco: string;
  tipoCuenta: TipoCuentaBancaria | "";
  numeroCuenta: string;
  telefono: string;
  correo: string;
  conceptoPago: string;
};

function limpiarOpcional(valor: string) {
  const valorLimpio = valor.trim();

  return valorLimpio || null;
}

export function construirBeneficiarioContextualPayload(
  datos: DatosBeneficiarioContextual,
) {
  const requiereBanco =
    datos.medioPago === "TRANSFERENCIA" ||
    datos.medioPago === "CONSIGNACION";
  const esProveedor = datos.tipoBeneficiario === "PROVEEDOR";
  const datosBancarios = requiereBanco
    ? {
        banco: datos.banco,
        tipo_cuenta_bancaria: datos.tipoCuenta,
        numero_cuenta_bancaria: datos.numeroCuenta,
      }
    : {
        banco: null,
        tipo_cuenta_bancaria: null,
        numero_cuenta_bancaria: null,
      };
  const telefono = limpiarOpcional(datos.telefono);
  const correo = limpiarOpcional(datos.correo)?.toLowerCase() ?? null;

  return {
    tipo_beneficiario: datos.tipoBeneficiario,
    nombre: datos.nombre,
    tipo_documento: datos.tipoDocumento,
    numero_documento: datos.numeroDocumento,
    medio_pago_preferido: datos.medioPago,
    ...datosBancarios,
    telefono,
    correo,
    notas: limpiarOpcional(datos.conceptoPago),
    proveedor: esProveedor
      ? {
          nombre: datos.nombre,
          tipo_documento: datos.tipoDocumento,
          numero_documento: datos.numeroDocumento,
          correo,
          telefono,
          banco: datosBancarios.banco,
          tipo_cuenta_bancaria: datosBancarios.tipo_cuenta_bancaria,
          numero_cuenta_bancaria: datosBancarios.numero_cuenta_bancaria,
        }
      : undefined,
  };
}
