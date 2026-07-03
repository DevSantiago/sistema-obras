export type TipoBeneficiario = "PROVEEDOR" | "TRABAJADOR" | "OTRO";

export type MedioPagoPreferido = "TRANSFERENCIA" | "EFECTIVO";

export type TipoCuentaBancaria = "AHORROS" | "CORRIENTE" | "OTRO";

export type EstadoBeneficiario = "ACTIVO" | "INACTIVO";

export type BeneficiarioListFilters = {
  tipo_beneficiario?: TipoBeneficiario;
  activo?: boolean;
  busqueda?: string;
};

export type CrearProveedorInput = {
  nombre: string;
  tipo_documento: string;
  numero_documento: string;
  correo?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  banco: string;
  tipo_cuenta_bancaria: TipoCuentaBancaria;
  numero_cuenta_bancaria: string;
};

export type CrearBeneficiarioInput = {
  tipo_beneficiario: TipoBeneficiario;
  proveedor_id?: string | null;
  usuario_id?: string | null;
  nombre: string;
  tipo_documento: string;
  numero_documento: string;
  medio_pago_preferido: MedioPagoPreferido;
  banco: string;
  tipo_cuenta_bancaria: TipoCuentaBancaria;
  numero_cuenta_bancaria: string;
  telefono?: string | null;
  correo?: string | null;
  notas?: string | null;
  proveedor?: CrearProveedorInput | null;
};

export type BeneficiarioNormalizadoInput = {
  tipo_beneficiario: TipoBeneficiario;
  proveedor_id?: string | null;
  usuario_id?: string | null;
  nombre: string;
  tipo_documento: string;
  numero_documento: string;
  medio_pago_preferido: MedioPagoPreferido;
  banco: string;
  tipo_cuenta_bancaria: TipoCuentaBancaria;
  numero_cuenta_bancaria: string;
  telefono?: string | null;
  correo?: string | null;
  notas?: string | null;
};

export type ProveedorNormalizadoInput = {
  nombre: string;
  tipo_documento: string;
  numero_documento: string;
  correo?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  banco: string;
  tipo_cuenta_bancaria: TipoCuentaBancaria;
  numero_cuenta_bancaria: string;
};

export type CrearBeneficiarioRepositoryInput = {
  beneficiario: BeneficiarioNormalizadoInput;
  proveedor?: ProveedorNormalizadoInput | null;
};

export type BeneficiarioResponse = {
  id: string;
  tipo_beneficiario: TipoBeneficiario;
  proveedor_id: string | null;
  usuario_id: string | null;
  nombre: string;
  tipo_documento: string;
  numero_documento: string;
  medio_pago_preferido: MedioPagoPreferido;
  banco: string;
  tipo_cuenta_bancaria: TipoCuentaBancaria;
  numero_cuenta_bancaria: string;
  telefono: string | null;
  correo: string | null;
  notas: string | null;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
};

export type ActualizarBeneficiarioInput = {
  nombre?: string;
  medio_pago_preferido?: MedioPagoPreferido;
  banco?: string;
  tipo_cuenta_bancaria?: TipoCuentaBancaria;
  numero_cuenta_bancaria?: string;
  telefono?: string | null;
  correo?: string | null;
  notas?: string | null;
  activo?: boolean;
};

export type BeneficiarioActualizadoRepositoryInput = {
  nombre?: string;
  medio_pago_preferido?: MedioPagoPreferido;
  banco?: string;
  tipo_cuenta_bancaria?: TipoCuentaBancaria;
  numero_cuenta_bancaria?: string;
  telefono?: string | null;
  correo?: string | null;
  notas?: string | null;
  activo?: boolean;
};