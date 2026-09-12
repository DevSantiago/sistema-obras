"use client";

import { BANCOS_COLOMBIA } from "@/modules/beneficiarios/bancos.constants";
import type {
  MedioPagoPreferido,
  TipoBeneficiario,
  TipoCuentaBancaria,
} from "@/modules/beneficiarios/beneficiarios.types";
import type { BeneficiarioSolicitudCatalogo } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { type FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import styles from "../SolicitudesPagoManager.module.css";
import { construirBeneficiarioContextualPayload } from "./crear-beneficiario.utils";

const TIPOS_DOCUMENTO = ["CC", "CE", "NIT"];

const ETIQUETAS_TIPO: Record<TipoBeneficiario, string> = {
  PROVEEDOR: "proveedor",
  TRABAJADOR: "trabajador",
  OTRO: "entidad recaudadora",
};

function soloNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

export function requiereDatosBancarios(
  medioPago: MedioPagoPreferido | "",
) {
  return medioPago === "TRANSFERENCIA" || medioPago === "CONSIGNACION";
}

type CrearBeneficiarioModalProps = {
  tipoBeneficiario: TipoBeneficiario;
  nombreInicial: string;
  onCerrar: () => void;
  onCreado: (beneficiario: BeneficiarioSolicitudCatalogo) => void;
};

export default function CrearBeneficiarioModal({
  tipoBeneficiario,
  nombreInicial,
  onCerrar,
  onCreado,
}: CrearBeneficiarioModalProps) {
  const [nombre, setNombre] = useState(nombreInicial.trim());
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPagoPreferido | "">("");
  const [banco, setBanco] = useState("");
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuentaBancaria | "">("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [conceptoPago, setConceptoPago] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  const etiquetaTipo = ETIQUETAS_TIPO[tipoBeneficiario];
  const requiereBanco = requiereDatosBancarios(medioPago);
  const esProveedor = tipoBeneficiario === "PROVEEDOR";
  const tiposDocumento =
    tipoBeneficiario === "TRABAJADOR"
      ? TIPOS_DOCUMENTO.filter((tipo) => tipo !== "NIT")
      : TIPOS_DOCUMENTO;

  function manejarCambioMedioPago(valor: MedioPagoPreferido | "") {
    setMedioPago(valor);

    if (!requiereDatosBancarios(valor)) {
      setBanco("");
      setTipoCuenta("");
      setNumeroCuenta("");
    }
  }

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensajeError("");

    if (!nombre.trim() || !tipoDocumento || !numeroDocumento || !medioPago) {
      setMensajeError("Complete los campos obligatorios.");
      return;
    }

    if (requiereBanco && (!banco || !tipoCuenta || !numeroCuenta)) {
      setMensajeError("Complete los datos bancarios.");
      return;
    }

    if (esProveedor && (!telefono.trim() || !correo.trim() || !conceptoPago.trim())) {
      setMensajeError(
        "Correo, teléfono y concepto de pago son obligatorios para proveedores.",
      );
      return;
    }

    const body = construirBeneficiarioContextualPayload({
      tipoBeneficiario,
      nombre,
      tipoDocumento,
      numeroDocumento,
      medioPago,
      banco,
      tipoCuenta,
      numeroCuenta,
      telefono,
      correo,
      conceptoPago,
    });

    setGuardando(true);

    try {
      const respuesta = await fetch("/api/v1/beneficiarios", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await respuesta.json()) as {
        ok: boolean;
        message?: string;
        data?: BeneficiarioSolicitudCatalogo;
      };

      if (!respuesta.ok || !data.ok || !data.data) {
        setMensajeError(data.message ?? `No fue posible crear el ${etiquetaTipo}.`);
        return;
      }

      onCreado(data.data);
    } catch {
      setMensajeError(`No fue posible crear el ${etiquetaTipo}. Intente nuevamente.`);
    } finally {
      setGuardando(false);
    }
  }

  return createPortal(
    <div
      className={`${styles.modalBackdrop} ${styles.createBeneficiaryBackdrop} appModalBackdrop`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !guardando) onCerrar();
      }}
    >
      <section
        className={`${styles.createBeneficiaryDialog} appModalDialog`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crear-beneficiario-titulo"
      >
        <header className={styles.detailHeader}>
          <div>
            <span className={styles.detailEyebrow}>Sin salir de la solicitud</span>
            <h2 id="crear-beneficiario-titulo">Crear {etiquetaTipo}</h2>
            <p className={styles.createBeneficiaryDescription}>
              Al guardar, quedará seleccionado automáticamente.
            </p>
          </div>
          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar creación de beneficiario"
          >
            ×
          </button>
        </header>

        <form className={styles.createBeneficiaryForm} onSubmit={manejarSubmit}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.label}>Nombre <strong>*</strong></span>
              <input
                className={styles.input}
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                autoFocus
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Tipo de identificación <strong>*</strong></span>
              <select
                className={styles.input}
                value={tipoDocumento}
                onChange={(event) => setTipoDocumento(event.target.value)}
                required
              >
                <option value="">Seleccione</option>
                {tiposDocumento.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Número de identificación <strong>*</strong></span>
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={numeroDocumento}
                onChange={(event) => setNumeroDocumento(soloNumeros(event.target.value))}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Medio de pago sugerido <strong>*</strong></span>
              <select
                className={styles.input}
                value={medioPago}
                onChange={(event) => manejarCambioMedioPago(event.target.value as MedioPagoPreferido | "")}
                required
              >
                <option value="">Seleccione</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="CONSIGNACION">Consignación</option>
                <option value="EFECTIVO">Efectivo</option>
              </select>
            </label>
          </div>

          {requiereBanco ? (
            <fieldset className={styles.createBeneficiarySection}>
              <legend>Datos bancarios</legend>
              <div className={styles.grid}>
                <label className={styles.field}>
                  <span className={styles.label}>Banco <strong>*</strong></span>
                  <select
                    className={styles.input}
                    value={banco}
                    onChange={(event) => setBanco(event.target.value)}
                    required
                  >
                    <option value="">Seleccione</option>
                    {BANCOS_COLOMBIA.map((bancoDisponible) => (
                      <option key={bancoDisponible} value={bancoDisponible}>
                        {bancoDisponible}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Tipo de cuenta <strong>*</strong></span>
                  <select
                    className={styles.input}
                    value={tipoCuenta}
                    onChange={(event) => setTipoCuenta(event.target.value as TipoCuentaBancaria | "")}
                    required
                  >
                    <option value="">Seleccione</option>
                    <option value="AHORROS">Ahorros</option>
                    <option value="CORRIENTE">Corriente</option>
                    <option value="CONVENIO">Convenio</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Número de cuenta o convenio <strong>*</strong></span>
                  <input
                    className={styles.input}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={numeroCuenta}
                    onChange={(event) => setNumeroCuenta(soloNumeros(event.target.value))}
                    required
                  />
                </label>
              </div>
            </fieldset>
          ) : null}

          {esProveedor ? (
            <fieldset className={styles.createBeneficiarySection}>
              <legend>Información del proveedor</legend>
              <div className={styles.grid}>
                <label className={styles.field}>
                  <span className={styles.label}>Teléfono <strong>*</strong></span>
                  <input
                    className={styles.input}
                    type="text"
                    value={telefono}
                    onChange={(event) => setTelefono(event.target.value)}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Correo <strong>*</strong></span>
                  <input
                    className={styles.input}
                    type="email"
                    value={correo}
                    onChange={(event) => setCorreo(event.target.value)}
                    required
                  />
                </label>

                <label className={`${styles.field} ${styles.createBeneficiaryWide}`}>
                  <span className={styles.label}>Concepto de pago <strong>*</strong></span>
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    value={conceptoPago}
                    onChange={(event) => setConceptoPago(event.target.value)}
                    required
                  />
                </label>
              </div>
            </fieldset>
          ) : null}

          {mensajeError ? <p className={styles.error}>{mensajeError}</p> : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.button} disabled={guardando}>
              {guardando ? "Guardando..." : `Crear ${etiquetaTipo}`}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}
