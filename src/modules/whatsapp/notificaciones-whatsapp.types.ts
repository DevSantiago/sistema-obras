export type TransicionNotificableWhatsApp = {
  solicitudId: string;
  estadoOrigen:
    | "BORRADOR"
    | "PENDIENTE_APROBADOR_1"
    | "PENDIENTE_APROBADOR_2"
    | "DEVUELTA_APROBADOR_1"
    | "DEVUELTA_SOLICITANTE";
  estadoDestino:
    | "PENDIENTE_APROBADOR_1"
    | "PENDIENTE_APROBADOR_2"
    | "DEVUELTA_APROBADOR_1"
    | "DEVUELTA_SOLICITANTE"
    | "PROGRAMADA_PAGO";
};

export type CrearNotificacionesTransicionesInput = {
  transiciones: TransicionNotificableWhatsApp[];
  fecha: Date;
};
