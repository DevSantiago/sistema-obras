// src/components/beneficiarios/BeneficiariosManager.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BANCOS_COLOMBIA } from "@/modules/beneficiarios/bancos.constants";
import type {
  BeneficiarioListado,
  MedioPagoPreferido,
  TipoBeneficiario,
  TipoBeneficiarioFormulario,
  TipoCuentaBancaria,
  ResultadoCargaMasivaProveedores,
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

  const [beneficiarioEditando, setBeneficiarioEditando] =
    useState<BeneficiarioListado | null>(null);

  const [tipoBeneficiario, setTipoBeneficiario] =
    useState<TipoBeneficiario | "">("");

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
  const [activo, setActivo] = useState(true);

  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [archivoMasivo, setArchivoMasivo] = useState<File | null>(null);
  const [resultadoMasivo, setResultadoMasivo] =
    useState<(ResultadoCargaMasivaProveedores & { creados?: number }) | null>(null);
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);
  const [mensajeMasivo, setMensajeMasivo] = useState<string | null>(null);

  const esEdicion = Boolean(beneficiarioEditando);
  const requiereBanco =
    tipoBeneficiario === "PROVEEDOR" ||
    requiereDatosBancarios(medioPagoPreferido);

  const tiposDocumentoDisponibles =
    tipoBeneficiario === "TRABAJADOR"
      ? TIPOS_DOCUMENTO.filter((tipo) => tipo !== "NIT")
      : TIPOS_DOCUMENTO;

  function limpiarFormulario() {
    setBeneficiarioEditando(null);
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
    setActivo(true);
  }

  function cargarBeneficiarioParaEditar(beneficiario: BeneficiarioListado) {
    setBeneficiarioEditando(beneficiario);
    setTipoBeneficiario(beneficiario.tipo_beneficiario);
    setTipoDocumento(beneficiario.tipo_documento);
    setNumeroDocumento(beneficiario.numero_documento);
    setNombre(beneficiario.nombre);
    setMedioPagoPreferido(beneficiario.medio_pago_preferido);
    setBanco(beneficiario.banco ?? "");
    setTipoCuentaBancaria(beneficiario.tipo_cuenta_bancaria ?? "");
    setNumeroCuentaBancaria(beneficiario.numero_cuenta_bancaria ?? "");
    setTelefono(beneficiario.telefono ?? "");
    setCorreo(beneficiario.correo ?? "");
    setNotas(beneficiario.notas ?? "");
    setActivo(beneficiario.activo);
    setMensajeError(null);
    setMensajeExito(null);
  }

  function manejarCambioTipoBeneficiario(valor: TipoBeneficiario | "") {
    setTipoBeneficiario(valor);

    if (valor === "TRABAJADOR" && tipoDocumento === "NIT") {
      setTipoDocumento("");
    }
  }

  function manejarCambioMedioPago(valor: MedioPagoPreferido | "") {
    setMedioPagoPreferido(valor);

    if (tipoBeneficiario !== "PROVEEDOR" && !requiereDatosBancarios(valor)) {
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

    if (
      tipoBeneficiario === "TRABAJADOR" &&
      tipoDocumento.toUpperCase() === "NIT"
    ) {
      setMensajeError(
        "Un beneficiario tipo trabajador no puede tener identificación NIT.",
      );
      return;
    }

    if (!numeroDocumento.trim()) {
      setMensajeError("Ingrese el número de identificación.");
      return;
    }

    if (!nombre.trim()) {
      setMensajeError("Ingrese el nombre del beneficiario.");
      return;
    }

    if (!medioPagoPreferido) {
      setMensajeError("Seleccione el medio de pago sugerido.");
      return;
    }

    if (requiereBanco && !banco) {
      setMensajeError("Seleccione el banco.");
      return;
    }

    if (requiereBanco && !tipoCuentaBancaria) {
      setMensajeError("Seleccione el tipo de cuenta bancaria.");
      return;
    }

    if (
      requiereBanco &&
      !numeroCuentaBancaria.trim()
    ) {
      setMensajeError("Ingrese el número de cuenta bancaria.");
      return;
    }

    const bancoNormalizado = limpiarOpcional(banco);
    const numeroCuentaNormalizado = limpiarOpcional(numeroCuentaBancaria);
    const telefonoNormalizado = limpiarOpcional(telefono);
    const correoNormalizado = limpiarOpcional(correo);
    const notasNormalizadas = limpiarOpcional(notas);

    if (tipoBeneficiario === "PROVEEDOR") {
      if (!telefono.trim() || !correo.trim() || !notas.trim()) {
        setMensajeError(
          "Correo, teléfono y concepto de pago son obligatorios para proveedores.",
        );
        return;
      }
    }

    const datosBancarios = requiereBanco
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

    const body = esEdicion
      ? {
          tipo_beneficiario: tipoBeneficiario,
          tipo_documento: tipoDocumento,
          numero_documento: numeroDocumento,
          nombre,
          medio_pago_preferido: medioPagoPreferido,
          ...datosBancarios,
          telefono: telefonoNormalizado,
          correo: correoNormalizado,
          notas: notasNormalizadas,
          activo,
        }
      : {
          tipo_beneficiario: tipoBeneficiario as TipoBeneficiarioFormulario,
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
                  numero_cuenta_bancaria:
                    datosBancarios.numero_cuenta_bancaria,
                }
              : undefined,
        };

    setGuardando(true);

    try {
      const respuesta = await fetch(
        esEdicion
          ? `/api/v1/beneficiarios/${beneficiarioEditando?.id}`
          : "/api/v1/beneficiarios",
        {
          method: esEdicion ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await respuesta.json();

      if (!respuesta.ok || !data.ok) {
        setMensajeError(
          data.message ||
            (esEdicion
              ? "No fue posible actualizar el beneficiario."
              : "No fue posible crear el beneficiario."),
        );
        return;
      }

      limpiarFormulario();

      setMensajeExito(
        data.message ||
          (esEdicion
            ? "Beneficiario actualizado correctamente."
            : "Beneficiario creado correctamente."),
      );

      router.refresh();
    } catch {
      setMensajeError(
        esEdicion
          ? "Ocurrió un error inesperado al actualizar el beneficiario."
          : "Ocurrió un error inesperado al crear el beneficiario.",
      );
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

  async function procesarCargaMasiva(accion: "VALIDAR" | "IMPORTAR") {
    if (!archivoMasivo) {
      setMensajeMasivo("Seleccione un archivo Excel.");
      return;
    }

    setProcesandoMasivo(true);
    setMensajeMasivo(null);
    const formData = new FormData();
    formData.append("archivo", archivoMasivo);
    formData.append("accion", accion);

    try {
      const response = await fetch("/api/v1/beneficiarios/carga-masiva", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = (await response.json()) as {
        ok: boolean;
        message: string;
        data?: ResultadoCargaMasivaProveedores & { creados?: number };
      };
      if (!response.ok || !body.ok || !body.data) {
        throw new Error(body.message || "No fue posible procesar el archivo.");
      }

      setResultadoMasivo(body.data);
      setMensajeMasivo(body.message);
      if (accion === "IMPORTAR") router.refresh();
    } catch (error) {
      setMensajeMasivo(
        error instanceof Error ? error.message : "No fue posible procesar el archivo.",
      );
    } finally {
      setProcesandoMasivo(false);
    }
  }

  function descargarInformeErrores() {
    if (!resultadoMasivo) return;
    const filas = resultadoMasivo.filas.filter((fila) => !fila.valido);
    const escapar = (valor: string) => `"${valor.replaceAll('"', '""')}"`;
    const csv = [
      "FILA,IDENTIFICACION,NOMBRE,ERRORES",
      ...filas.map((fila) =>
        [fila.fila, fila.numero_documento, fila.nombre, fila.errores.join(" | ")]
          .map((valor) => escapar(String(valor)))
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
    );
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "errores-carga-proveedores.csv";
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={styles.container}>
      <section className={`${styles.card} ${styles.bulkCard}`}>
        <header className={styles.bulkHeader}>
          <div>
            <h2>Carga masiva de proveedores</h2>
            <p>Use la plantilla oficial. Los registros existentes se reportan y no se modifican.</p>
          </div>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => window.location.assign("/api/v1/beneficiarios/carga-masiva")}
          >
            Descargar plantilla
          </button>
        </header>
        <div className={styles.bulkControls}>
          <label className={styles.field}>
            <span className={styles.label}>Archivo Excel (.xlsx)</span>
            <input
              className={styles.input}
              type="file"
              accept=".xlsx"
              onChange={(event) => {
                setArchivoMasivo(event.target.files?.[0] ?? null);
                setResultadoMasivo(null);
                setMensajeMasivo(null);
              }}
            />
          </label>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={!archivoMasivo || procesandoMasivo}
            onClick={() => void procesarCargaMasiva("VALIDAR")}
          >
            {procesandoMasivo ? "Procesando..." : "Validar archivo"}
          </button>
        </div>
        {resultadoMasivo ? (
          <div className={styles.bulkResult}>
            <div><strong>{resultadoMasivo.total}</strong><span>Total</span></div>
            <div><strong>{resultadoMasivo.validos}</strong><span>Válidos</span></div>
            <div><strong>{resultadoMasivo.rechazados}</strong><span>Rechazados</span></div>
            <div className={styles.bulkActions}>
              {resultadoMasivo.rechazados > 0 ? (
                <button type="button" className={styles.secondaryButton} onClick={descargarInformeErrores}>
                  Descargar errores
                </button>
              ) : null}
              <button
                type="button"
                className={styles.button}
                disabled={
                  resultadoMasivo.validos === 0 ||
                  procesandoMasivo ||
                  resultadoMasivo.creados !== undefined
                }
                onClick={() => void procesarCargaMasiva("IMPORTAR")}
              >
                {resultadoMasivo.creados !== undefined
                  ? `${resultadoMasivo.creados} proveedor(es) importado(s)`
                  : `Importar ${resultadoMasivo.validos} proveedor(es)`}
              </button>
            </div>
          </div>
        ) : null}
        {mensajeMasivo ? <p className={styles.helpText}>{mensajeMasivo}</p> : null}
      </section>

      <section className={styles.card}>
        <form className={styles.form} onSubmit={manejarSubmit}>
          <header className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {esEdicion ? "Editar beneficiario" : "Crear beneficiario"}
            </h2>

            <p className={styles.formDescription}>
              {esEdicion
                ? "Actualice los datos de identificación, clasificación y pago del beneficiario."
                : "Registre la persona o proveedor que podrá ser usado como beneficiario en solicitudes de pago."}
            </p>
          </header>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.label}>
                Tipo de beneficiario <strong aria-hidden="true">*</strong>
              </span>

              <select
                className={styles.input}
                value={tipoBeneficiario}
                onChange={(event) =>
                  manejarCambioTipoBeneficiario(
                    event.target.value as TipoBeneficiario | "",
                  )
                }
                required
              >
                <option value="" disabled>
                  Seleccione
                </option>

                <option value="TRABAJADOR">Trabajador</option>
                <option value="PROVEEDOR">Proveedor</option>

                <option value="OTRO">Otro</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Tipo de identificación <strong aria-hidden="true">*</strong>
              </span>

              <select
                className={styles.input}
                value={tipoDocumento}
                onChange={(event) => setTipoDocumento(event.target.value)}
                required
              >
                <option value="" disabled>
                  Seleccione
                </option>

                {tiposDocumentoDisponibles.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}

                {esEdicion &&
                  tipoDocumento &&
                  !tiposDocumentoDisponibles.includes(tipoDocumento) && (
                    <option value={tipoDocumento}>{tipoDocumento}</option>
                  )}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Número de identificación <strong aria-hidden="true">*</strong>
              </span>

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
              <span className={styles.label}>
                Nombre <strong aria-hidden="true">*</strong>
              </span>

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
              <span className={styles.label}>
                Medio de pago sugerido <strong aria-hidden="true">*</strong>
              </span>

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
              <span className={styles.label}>
                Banco
                {requiereBanco && (
                  <>
                    {" "}
                    <strong aria-hidden="true">*</strong>
                  </>
                )}
              </span>

              <select
                className={styles.input}
                value={banco}
                onChange={(event) => setBanco(event.target.value)}
                disabled={!requiereBanco}
                required={requiereBanco}
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
              <span className={styles.label}>
                Tipo de cuenta
                {requiereBanco && (
                  <>
                    {" "}
                    <strong aria-hidden="true">*</strong>
                  </>
                )}
              </span>

              <select
                className={styles.input}
                value={tipoCuentaBancaria}
                onChange={(event) =>
                  setTipoCuentaBancaria(
                    event.target.value as TipoCuentaBancaria | "",
                  )
                }
                disabled={!requiereBanco}
                required={requiereBanco}
              >
                <option value="" disabled>
                  Seleccione
                </option>

                <option value="AHORROS">Ahorros</option>
                <option value="CORRIENTE">Corriente</option>

                {tipoCuentaBancaria === "OTRO" && (
                  <option value="OTRO">Otro</option>
                )}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Número de cuenta
                {requiereBanco && (
                  <>
                    {" "}
                    <strong aria-hidden="true">*</strong>
                  </>
                )}
              </span>

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
                disabled={!requiereBanco}
                required={requiereBanco}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Teléfono {tipoBeneficiario === "PROVEEDOR" ? <strong>*</strong> : null}
              </span>

              <input
                className={styles.input}
                type="text"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                placeholder="Opcional"
                required={tipoBeneficiario === "PROVEEDOR"}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Correo {tipoBeneficiario === "PROVEEDOR" ? <strong>*</strong> : null}
              </span>

              <input
                className={styles.input}
                type="email"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                placeholder="correo@empresa.com"
                required={tipoBeneficiario === "PROVEEDOR"}
              />
            </label>

            {esEdicion && (
              <label className={styles.field}>
                <span className={styles.label}>
                  Estado <strong aria-hidden="true">*</strong>
                </span>

                <select
                  className={styles.input}
                  value={activo ? "ACTIVO" : "INACTIVO"}
                  onChange={(event) =>
                    setActivo(event.target.value === "ACTIVO")
                  }
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </label>
            )}
          </div>

          <label className={styles.field}>
            <span className={styles.label}>
              Concepto de pago {tipoBeneficiario === "PROVEEDOR" ? <strong>*</strong> : null}
            </span>

            <textarea
              className={styles.textarea}
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              placeholder="Concepto u observaciones opcionales"
              rows={3}
              required={tipoBeneficiario === "PROVEEDOR"}
            />
          </label>

          {mensajeError && <p className={styles.error}>{mensajeError}</p>}

          {mensajeExito && <p className={styles.success}>{mensajeExito}</p>}

          <div className={styles.actions}>
            {esEdicion && (
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={limpiarFormulario}
                disabled={guardando}
              >
                Cancelar
              </button>
            )}

            <button
              className={styles.button}
              type="submit"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : esEdicion
                  ? "Guardar cambios"
                  : "Crear beneficiario"}
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
                    <th>Acciones</th>
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

                      <td>
                        <button
                          className={styles.editButton}
                          type="button"
                          onClick={() =>
                            cargarBeneficiarioParaEditar(beneficiario)
                          }
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileList}>
              {beneficiarios.map((beneficiario) => (
                <article
                  className={styles.mobileCard}
                  key={beneficiario.id}
                >
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

                  <div className={styles.mobileActions}>
                    <button
                      className={styles.editButton}
                      type="button"
                      onClick={() =>
                        cargarBeneficiarioParaEditar(beneficiario)
                      }
                    >
                      Editar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </section>
  );
}
