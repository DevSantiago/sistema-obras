// src/components/beneficiarios/BeneficiariosManager.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BANCOS_COLOMBIA } from "@/modules/beneficiarios/bancos.constants";
import type {
  BeneficiarioListado,
  MedioPagoPreferido,
  TipoBeneficiarioFormulario,
  TipoCuentaBancaria,
} from "@/modules/beneficiarios/beneficiarios.types";
import styles from "./BeneficiariosManager.module.css";

const TIPOS_DOCUMENTO = ["CC", "CE", "NIT"];

function limpiarOpcional(valor: string) {
  const valorLimpio = valor.trim();
  return valorLimpio === "" ? null : valorLimpio;
}

function soloNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function requiereDatosBancarios(medioPago: MedioPagoPreferido | "") {
  return medioPago === "TRANSFERENCIA" || medioPago === "CONSIGNACION";
}

function obtenerTextoCuenta(beneficiario: BeneficiarioListado) {
  if (
    !beneficiario.banco &&
    !beneficiario.tipo_cuenta_bancaria &&
    !beneficiario.numero_cuenta_bancaria
  ) {
    return "Sin datos bancarios";
  }

  return [
    beneficiario.banco,
    beneficiario.tipo_cuenta_bancaria,
    beneficiario.numero_cuenta_bancaria,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function BeneficiariosManager({
  beneficiarios,
}: {
  beneficiarios: BeneficiarioListado[];
}) {
  const router = useRouter();

  const [tipoBeneficiario, setTipoBeneficiario] =
    useState<TipoBeneficiarioFormulario | "">("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [medioPagoPreferido, setMedioPagoPreferido] =
    useState<MedioPagoPreferido | "">("");
  const [banco, setBanco] = useState("");
  const [tipoCuentaBancaria, setTipoCuentaBancaria] =
    useState<TipoCuentaBancaria | "">("");
  const [numeroCuentaBancaria, setNumeroCuentaBancaria] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [notas, setNotas] = useState("");
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function limpiarFormulario() {
    setTipoBeneficiario("");
    setTipoDocumento("");
    setNumeroDocumento("");
    setNombre("");
    setMedioPagoPreferido("");
    setBanco("");
    setTipoCuentaBancaria("");
    setNumeroCuentaBancaria("");
    setTelefono("");
    setCorreo("");
    setNotas("");
  }

  function manejarCambioMedioPago(valor: MedioPagoPreferido | "") {
    setMedioPagoPreferido(valor);

    if (!requiereDatosBancarios(valor)) {
      setBanco("");
      setTipoCuentaBancaria("");
      setNumeroCuentaBancaria("");
    }
  }

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);

    if (!tipoBeneficiario) {
      setMensajeError("Seleccione el tipo de beneficiario.");
      return;
    }

    if (!tipoDocumento) {
      setMensajeError("Seleccione el tipo de identificación.");
      return;
    }

    if (!medioPagoPreferido) {
      setMensajeError("Seleccione el medio de pago sugerido.");
      return;
    }

    if (requiereDatosBancarios(medioPagoPreferido) && !banco) {
      setMensajeError("Seleccione el banco.");
      return;
    }

    if (requiereDatosBancarios(medioPagoPreferido) && !tipoCuentaBancaria) {
      setMensajeError("Seleccione el tipo de cuenta bancaria.");
      return;
    }

    const bancoNormalizado = limpiarOpcional(banco);
    const numeroCuentaNormalizado = limpiarOpcional(numeroCuentaBancaria);
    const telefonoNormalizado = limpiarOpcional(telefono);
    const correoNormalizado = limpiarOpcional(correo);
    const notasNormalizadas = limpiarOpcional(notas);

    const datosBancarios = requiereDatosBancarios(medioPagoPreferido)
      ? {
          banco: bancoNormalizado,
          tipo_cuenta_bancaria: tipoCuentaBancaria,
          numero_cuenta_bancaria: numeroCuentaNormalizado,
        }
      : {
          banco: null,
          tipo_cuenta_bancaria: null,
          numero_cuenta_bancaria: null,
        };

    const body = {
      tipo_beneficiario: tipoBeneficiario,
      nombre,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      medio_pago_preferido: medioPagoPreferido,
      ...datosBancarios,
      telefono: telefonoNormalizado,
      correo: correoNormalizado,
      notas: notasNormalizadas,
      proveedor:
        tipoBeneficiario === "PROVEEDOR"
          ? {
              nombre,
              tipo_documento: tipoDocumento,
              numero_documento: numeroDocumento,
              correo: correoNormalizado,
              telefono: telefonoNormalizado,
              banco: datosBancarios.banco,
              tipo_cuenta_bancaria: datosBancarios.tipo_cuenta_bancaria,
              numero_cuenta_bancaria: datosBancarios.numero_cuenta_bancaria,
            }
          : undefined,
    };

    setGuardando(true);

    try {
      const respuesta = await fetch("/api/v1/beneficiarios", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await respuesta.json();

      if (!respuesta.ok || !data.ok) {
        setMensajeError(data.message || "No fue posible crear el beneficiario.");
        return;
      }

      limpiarFormulario();
      setMensajeExito(data.message || "Beneficiario creado correctamente.");
      router.refresh();
    } catch {
      setMensajeError("Ocurrió un error inesperado al crear el beneficiario.");
    } finally {
      setGuardando(false);
    }
  }

  function renderEstado(beneficiario: BeneficiarioListado) {
    return (
      <span
        className={
          beneficiario.activo ? styles.statusActive : styles.statusInactive
        }
      >
        {beneficiario.activo ? "ACTIVO" : "INACTIVO"}
      </span>
    );
  }

  return (
    <section className={styles.container}>
      <section className={styles.card}>
        <form className={styles.form} onSubmit={manejarSubmit}>
          <header className={styles.formHeader}>
            <h2 className={styles.formTitle}>Crear beneficiario</h2>
            <p className={styles.formDescription}>
              Registre la persona o proveedor que podrá ser usado como
              beneficiario en solicitudes de pago.
            </p>
          </header>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.label}>Tipo de beneficiario</span>
              <select
                className={styles.input}
                value={tipoBeneficiario}
                onChange={(event) =>
                  setTipoBeneficiario(
                    event.target.value as TipoBeneficiarioFormulario | "",
                  )
                }
                required
              >
                <option value="" disabled>
                  Seleccione
                </option>
                <option value="TRABAJADOR">Trabajador</option>
                <option value="PROVEEDOR">Proveedor</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Tipo de identificación</span>
              <select
                className={styles.input}
                value={tipoDocumento}
                onChange={(event) => setTipoDocumento(event.target.value)}
                required
              >
                <option value="" disabled>
                  Seleccione
                </option>
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Número de identificación</span>
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={numeroDocumento}
                onChange={(event) =>
                  setNumeroDocumento(soloNumeros(event.target.value))
                }
                placeholder="Número de documento"
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Nombre</span>
              <input
                className={styles.input}
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Nombre completo o razón social"
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Medio de pago sugerido</span>
              <select
                className={styles.input}
                value={medioPagoPreferido}
                onChange={(event) =>
                  manejarCambioMedioPago(
                    event.target.value as MedioPagoPreferido | "",
                  )
                }
                required
              >
                <option value="" disabled>
                  Seleccione
                </option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="CONSIGNACION">Consignación</option>
                <option value="EFECTIVO">Efectivo</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Banco</span>
              <select
                className={styles.input}
                value={banco}
                onChange={(event) => setBanco(event.target.value)}
                disabled={!requiereDatosBancarios(medioPagoPreferido)}
                required={requiereDatosBancarios(medioPagoPreferido)}
              >
                <option value="" disabled>
                  Seleccione
                </option>
                {BANCOS_COLOMBIA.map((bancoDisponible) => (
                  <option key={bancoDisponible} value={bancoDisponible}>
                    {bancoDisponible}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Tipo de cuenta</span>
              <select
                className={styles.input}
                value={tipoCuentaBancaria}
                onChange={(event) =>
                  setTipoCuentaBancaria(
                    event.target.value as TipoCuentaBancaria | "",
                  )
                }
                disabled={!requiereDatosBancarios(medioPagoPreferido)}
                required={requiereDatosBancarios(medioPagoPreferido)}
              >
                <option value="" disabled>
                  Seleccione
                </option>
                <option value="AHORROS">Ahorros</option>
                <option value="CORRIENTE">Corriente</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Número de cuenta</span>
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={numeroCuentaBancaria}
                onChange={(event) =>
                  setNumeroCuentaBancaria(soloNumeros(event.target.value))
                }
                placeholder="Número de cuenta"
                disabled={!requiereDatosBancarios(medioPagoPreferido)}
                required={requiereDatosBancarios(medioPagoPreferido)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Teléfono</span>
              <input
                className={styles.input}
                type="text"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                placeholder="Opcional"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Correo</span>
              <input
                className={styles.input}
                type="email"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                placeholder="correo@empresa.com"
              />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Notas</span>
            <textarea
              className={styles.textarea}
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              placeholder="Observaciones opcionales"
              rows={3}
            />
          </label>

          {mensajeError && <p className={styles.error}>{mensajeError}</p>}
          {mensajeExito && <p className={styles.success}>{mensajeExito}</p>}

          <div className={styles.actions}>
            <button className={styles.button} type="submit" disabled={guardando}>
              {guardando ? "Creando..." : "Crear beneficiario"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Beneficiarios creados</h2>

        {beneficiarios.length === 0 ? (
          <section className={styles.empty}>
            <h2>No hay beneficiarios registrados</h2>
            <p>Cuando cree beneficiarios, aparecerán en esta sección.</p>
          </section>
        ) : (
          <section className={styles.card}>
            <div className={styles.desktopTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Beneficiario</th>
                    <th>Tipo</th>
                    <th>Contacto</th>
                    <th>Pago sugerido</th>
                    <th>Estado</th>
                    <th>Creado</th>
                  </tr>
                </thead>

                <tbody>
                  {beneficiarios.map((beneficiario) => (
                    <tr key={beneficiario.id}>
                      <td>
                        <strong className={styles.beneficiaryName}>
                          {beneficiario.nombre}
                        </strong>
                        <span className={styles.document}>
                          {beneficiario.tipo_documento}{" "}
                          {beneficiario.numero_documento}
                        </span>
                      </td>

                      <td>
                        <span className={styles.type}>
                          {beneficiario.tipo_beneficiario}
                        </span>
                      </td>

                      <td>
                        <span className={styles.contact}>
                          {beneficiario.correo ?? "Sin correo"}
                        </span>
                        <span className={styles.contact}>
                          {beneficiario.telefono ?? "Sin teléfono"}
                        </span>
                      </td>

                      <td>
                        <div className={styles.bank}>
                          <span className={styles.payment}>
                            {beneficiario.medio_pago_preferido}
                          </span>
                          <span>{obtenerTextoCuenta(beneficiario)}</span>
                        </div>
                      </td>

                      <td>{renderEstado(beneficiario)}</td>

                      <td>{beneficiario.creado_en_formateado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileList}>
              {beneficiarios.map((beneficiario) => (
                <article className={styles.mobileCard} key={beneficiario.id}>
                  <div className={styles.mobileHeader}>
                    <div>
                      <h3>{beneficiario.nombre}</h3>
                      <p>
                        {beneficiario.tipo_documento}{" "}
                        {beneficiario.numero_documento}
                      </p>
                    </div>

                    {renderEstado(beneficiario)}
                  </div>

                  <dl className={styles.mobileDetails}>
                    <div>
                      <dt>Tipo</dt>
                      <dd>{beneficiario.tipo_beneficiario}</dd>
                    </div>

                    <div>
                      <dt>Medio sugerido</dt>
                      <dd>{beneficiario.medio_pago_preferido}</dd>
                    </div>

                    <div>
                      <dt>Cuenta</dt>
                      <dd>{obtenerTextoCuenta(beneficiario)}</dd>
                    </div>

                    <div>
                      <dt>Correo</dt>
                      <dd>{beneficiario.correo ?? "Sin correo"}</dd>
                    </div>

                    <div>
                      <dt>Teléfono</dt>
                      <dd>{beneficiario.telefono ?? "Sin teléfono"}</dd>
                    </div>

                    <div>
                      <dt>Creado</dt>
                      <dd>{beneficiario.creado_en_formateado}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </section>
  );
}