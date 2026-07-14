"use client";

import type {
  CentroCostoSolicitudCatalogo,
  ProyectoBaseSolicitudCatalogo,
  SolicitudesPagoApiResponse,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "../SolicitudesPagoManager.module.css";
import type {
  FilaNominaGrupalValidada,
  NominaGrupalCreacionResponseData,
  NominaGrupalFormularioState,
  NominaGrupalValidacionResponseData,
} from "../solicitudes-pago.types";

type NominaGrupalFormProps = {
  proyectos: ProyectoBaseSolicitudCatalogo[];
  centrosCostoDisponibles: CentroCostoSolicitudCatalogo[];
  cargandoCatalogos: boolean;
  mensajeExito: string;
  mensajeError: string;
  onProyectoChange: (proyectoBaseId: string) => void;
  onCreada: (mensaje: string) => Promise<void> | void;
  onLimpiarMensajes: () => void;
};

const ESTADO_INICIAL: NominaGrupalFormularioState = {
  proyecto_base_id: "",
  centro_costo_id: "",
  periodo_nomina: "",
  descripcion: "",
  archivo: null,
};

const MAX_TAMANO_ARCHIVO_BYTES = 10 * 1024 * 1024;

function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function etiquetaEstadoValidacion(
  estado: FilaNominaGrupalValidada["estado_validacion"],
): string {
  switch (estado) {
    case "VALIDO":
      return "Válida";

    case "INVALIDO":
      return "Inválida";

    case "PENDIENTE_BENEFICIARIO":
      return "Beneficiario pendiente";

    default:
      return estado;
  }
}

async function leerRespuesta<T>(
  response: Response,
): Promise<SolicitudesPagoApiResponse<T>> {
  let payload: SolicitudesPagoApiResponse<T>;

  try {
    payload = (await response.json()) as SolicitudesPagoApiResponse<T>;
  } catch {
    throw new Error("El servidor devolvió una respuesta inválida.");
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message ?? "La operación no fue exitosa.");
  }

  return payload;
}

function validarArchivoSeleccionado(archivo: File): string | null {
  const nombre = archivo.name.toLowerCase();

  if (!nombre.endsWith(".xlsx") && !nombre.endsWith(".xlsm")) {
    return "El archivo debe tener extensión .xlsx o .xlsm.";
  }

  if (archivo.size <= 0) {
    return "El archivo Excel está vacío.";
  }

  if (archivo.size > MAX_TAMANO_ARCHIVO_BYTES) {
    return "El archivo Excel supera el tamaño máximo permitido de 10 MB.";
  }

  return null;
}

export default function NominaGrupalForm({
  proyectos,
  centrosCostoDisponibles,
  cargandoCatalogos,
  mensajeExito,
  mensajeError,
  onProyectoChange,
  onCreada,
  onLimpiarMensajes,
}: NominaGrupalFormProps) {
  const archivoInputRef = useRef<HTMLInputElement | null>(null);

  const [formulario, setFormulario] =
    useState<NominaGrupalFormularioState>(ESTADO_INICIAL);

  const [validando, setValidando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [errorLocal, setErrorLocal] = useState("");
  const [mensajeValidacion, setMensajeValidacion] = useState("");
  const [crearBeneficiariosFaltantes, setCrearBeneficiariosFaltantes] =
    useState(false);

  const [resultadoValidacion, setResultadoValidacion] =
    useState<NominaGrupalValidacionResponseData | null>(null);

  const resumen = resultadoValidacion?.validacion.resumen ?? null;
  const filasValidadas = resultadoValidacion?.validacion.filas ?? [];

  const formularioBloqueado = validando || creando;

  const puedeValidar = useMemo(() => {
    return Boolean(
      formulario.proyecto_base_id &&
        formulario.centro_costo_id &&
        formulario.periodo_nomina &&
        formulario.descripcion.trim() &&
        formulario.archivo &&
        !formularioBloqueado,
    );
  }, [formulario, formularioBloqueado]);

  const puedeCrear = useMemo(() => {
    if (!resultadoValidacion || !resumen || formularioBloqueado) {
      return false;
    }

    if (resumen.total_filas <= 0 || resumen.filas_invalidas > 0) {
      return false;
    }

    if (
      resumen.filas_pendientes_beneficiario > 0 &&
      !crearBeneficiariosFaltantes
    ) {
      return false;
    }

    return true;
  }, [
    crearBeneficiariosFaltantes,
    formularioBloqueado,
    resultadoValidacion,
    resumen,
  ]);

  function limpiarValidacion() {
    setResultadoValidacion(null);
    setMensajeValidacion("");
    setCrearBeneficiariosFaltantes(false);
  }

  function limpiarErrores() {
    setErrorLocal("");
    onLimpiarMensajes();
  }

  function actualizarCampo(
    campo: Exclude<keyof NominaGrupalFormularioState, "archivo">,
    valor: string,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    limpiarErrores();
    limpiarValidacion();
  }

  function manejarProyectoChange(event: ChangeEvent<HTMLSelectElement>) {
    const proyectoBaseId = event.target.value;

    setFormulario((actual) => ({
      ...actual,
      proyecto_base_id: proyectoBaseId,
      centro_costo_id: "",
    }));

    onProyectoChange(proyectoBaseId);
    limpiarErrores();
    limpiarValidacion();
  }

  function manejarArchivoChange(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0] ?? null;

    limpiarErrores();
    limpiarValidacion();

    if (!archivo) {
      setFormulario((actual) => ({
        ...actual,
        archivo: null,
      }));

      return;
    }

    const errorArchivo = validarArchivoSeleccionado(archivo);

    if (errorArchivo) {
      setErrorLocal(errorArchivo);

      setFormulario((actual) => ({
        ...actual,
        archivo: null,
      }));

      event.target.value = "";
      return;
    }

    setFormulario((actual) => ({
      ...actual,
      archivo,
    }));
  }

  function validarCamposFormulario(): string | null {
    if (!formulario.proyecto_base_id) {
      return "Debe seleccionar un proyecto base.";
    }

    if (!formulario.centro_costo_id) {
      return "Debe seleccionar un centro de costo.";
    }

    if (!formulario.periodo_nomina) {
      return "Debe indicar el periodo de nómina.";
    }

    if (!formulario.descripcion.trim()) {
      return "Debe ingresar una descripción.";
    }

    if (!formulario.archivo) {
      return "Debe seleccionar el archivo Excel de nómina.";
    }

    return validarArchivoSeleccionado(formulario.archivo);
  }

  function construirFormDataBase(accion: "VALIDAR" | "CREAR"): FormData {
    const formData = new FormData();

    formData.append("accion", accion);
    formData.append("proyecto_base_id", formulario.proyecto_base_id);
    formData.append("centro_costo_id", formulario.centro_costo_id);
    formData.append("periodo_nomina", formulario.periodo_nomina);
    formData.append("descripcion", formulario.descripcion.trim());

    return formData;
  }

  async function validarNomina(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    limpiarErrores();
    limpiarValidacion();

    const errorFormulario = validarCamposFormulario();

    if (errorFormulario) {
      setErrorLocal(errorFormulario);
      return;
    }

    if (!formulario.archivo) {
      setErrorLocal("Debe seleccionar el archivo Excel de nómina.");
      return;
    }

    setValidando(true);

    try {
      const formData = construirFormDataBase("VALIDAR");
      formData.append("archivo", formulario.archivo);

      const response = await fetch(
        "/api/v1/solicitudes-pago/nomina-grupal",
        {
          method: "POST",
          body: formData,
        },
      );

      const payload =
        await leerRespuesta<NominaGrupalValidacionResponseData>(response);

      if (!payload.data) {
        throw new Error(
          "El servidor no devolvió el resultado de validación de la nómina.",
        );
      }

      setResultadoValidacion(payload.data);
      setMensajeValidacion(
        payload.message ?? "El archivo fue validado correctamente.",
      );
    } catch (error) {
      setErrorLocal(
        error instanceof Error
          ? error.message
          : "No fue posible validar el archivo de nómina.",
      );
    } finally {
      setValidando(false);
    }
  }

  async function crearSolicitudNominaGrupal() {
    limpiarErrores();

    if (!resultadoValidacion) {
      setErrorLocal(
        "Debe validar el archivo antes de crear la solicitud de nómina.",
      );
      return;
    }

    if (resultadoValidacion.validacion.resumen.filas_invalidas > 0) {
      setErrorLocal(
        "No es posible crear la solicitud mientras existan filas inválidas.",
      );
      return;
    }

    if (
      resultadoValidacion.validacion.resumen
        .filas_pendientes_beneficiario > 0 &&
      !crearBeneficiariosFaltantes
    ) {
      setErrorLocal(
        "Debe autorizar la creación de los beneficiarios faltantes.",
      );
      return;
    }

    setCreando(true);

    try {
      const formData = construirFormDataBase("CREAR");

      formData.append(
        "adjunto_archivo_origen_id",
        resultadoValidacion.adjunto_archivo_origen_id,
      );

      formData.append(
        "crear_beneficiarios_faltantes",
        String(crearBeneficiariosFaltantes),
      );

      formData.append(
        "filas",
        JSON.stringify(resultadoValidacion.filas),
      );

      const response = await fetch(
        "/api/v1/solicitudes-pago/nomina-grupal",
        {
          method: "POST",
          body: formData,
        },
      );

      const payload =
        await leerRespuesta<NominaGrupalCreacionResponseData>(response);

      const numeroSolicitud =
        payload.data?.solicitud?.numero_solicitud;

      const mensaje =
        payload.message ??
        (numeroSolicitud
          ? `La solicitud ${numeroSolicitud} fue creada correctamente.`
          : "La solicitud de nómina grupal fue creada correctamente.");

      setFormulario(ESTADO_INICIAL);
      setResultadoValidacion(null);
      setMensajeValidacion("");
      setCrearBeneficiariosFaltantes(false);
      onProyectoChange("");

      if (archivoInputRef.current) {
        archivoInputRef.current.value = "";
      }

      await onCreada(mensaje);
    } catch (error) {
      setErrorLocal(
        error instanceof Error
          ? error.message
          : "No fue posible crear la solicitud de nómina grupal.",
      );
    } finally {
      setCreando(false);
    }
  }

  function reiniciarFormulario() {
    setFormulario(ESTADO_INICIAL);
    setResultadoValidacion(null);
    setMensajeValidacion("");
    setCrearBeneficiariosFaltantes(false);
    setErrorLocal("");
    onProyectoChange("");
    onLimpiarMensajes();

    if (archivoInputRef.current) {
      archivoInputRef.current.value = "";
    }
  }

  return (
    <section className={styles.card}>
      <form className={styles.form} onSubmit={validarNomina}>
        <header className={styles.formHeader}>
          <h2 className={styles.formTitle}>Crear nómina grupal</h2>

          <p className={styles.formDescription}>
            Seleccione el proyecto, el centro de costo y el periodo. Después
            cargue el archivo Excel para validar los trabajadores y valores
            antes de crear la solicitud.
          </p>
        </header>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>Proyecto base</span>

            <select
              className={styles.input}
              value={formulario.proyecto_base_id}
              onChange={manejarProyectoChange}
              disabled={cargandoCatalogos || formularioBloqueado}
              required
            >
              <option value="">
                {cargandoCatalogos
                  ? "Cargando proyectos..."
                  : "Seleccione un proyecto"}
              </option>

              {proyectos.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Centro de costo</span>

            <select
              className={styles.input}
              value={formulario.centro_costo_id}
              onChange={(event) =>
                actualizarCampo("centro_costo_id", event.target.value)
              }
              disabled={
                cargandoCatalogos ||
                formularioBloqueado ||
                !formulario.proyecto_base_id
              }
              required
            >
              <option value="">
                {!formulario.proyecto_base_id
                  ? "Seleccione primero un proyecto"
                  : centrosCostoDisponibles.length === 0
                    ? "No hay centros de costo disponibles"
                    : "Seleccione un centro de costo"}
              </option>

              {centrosCostoDisponibles.map((centroCosto) => (
                <option key={centroCosto.id} value={centroCosto.id}>
                  {centroCosto.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Periodo de nómina</span>

            <input
              className={styles.input}
              type="month"
              value={formulario.periodo_nomina}
              onChange={(event) =>
                actualizarCampo("periodo_nomina", event.target.value)
              }
              disabled={formularioBloqueado}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Archivo Excel</span>

            <input
              ref={archivoInputRef}
              className={styles.input}
              type="file"
              accept=".xlsx,.xlsm"
              onChange={manejarArchivoChange}
              disabled={formularioBloqueado}
              required
            />

            <span className={styles.muted}>
              Formatos permitidos: .xlsx y .xlsm. Tamaño máximo: 10 MB.
            </span>
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Descripción</span>

          <textarea
            className={styles.textarea}
            rows={3}
            value={formulario.descripcion}
            onChange={(event) =>
              actualizarCampo("descripcion", event.target.value)
            }
            disabled={formularioBloqueado}
            placeholder="Ejemplo: Nómina correspondiente a julio de 2026"
            required
          />
        </label>

        {mensajeExito ? (
          <p className={styles.success}>{mensajeExito}</p>
        ) : null}

        {mensajeValidacion ? (
          <p className={styles.success}>{mensajeValidacion}</p>
        ) : null}

        {mensajeError ? (
          <p className={styles.error}>{mensajeError}</p>
        ) : null}

        {errorLocal ? (
          <p className={styles.error}>{errorLocal}</p>
        ) : null}

        <div className={styles.actions}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={reiniciarFormulario}
            disabled={formularioBloqueado}
          >
            Limpiar
          </button>

          <button
            className={styles.button}
            type="submit"
            disabled={!puedeValidar}
          >
            {validando ? "Validando archivo..." : "Validar archivo"}
          </button>
        </div>
      </form>

      {resultadoValidacion && resumen ? (
        <>
          <div className={styles.tableHeader}>
            <div>
              <h3 className={styles.sectionTitle}>
                Resultado de la validación
              </h3>

              <span className={styles.muted}>
                Archivo: {resultadoValidacion.nombre_archivo} · Hoja:{" "}
                {resultadoValidacion.nombre_hoja}
              </span>
            </div>
          </div>

          <div className={styles.form}>
            <div className={styles.grid}>
              <div className={styles.netBox}>
                <span className={styles.netLabel}>Total de filas</span>
                <strong className={styles.net}>
                  {resumen.total_filas}
                </strong>
              </div>

              <div className={styles.netBox}>
                <span className={styles.netLabel}>Filas válidas</span>
                <strong className={styles.net}>
                  {resumen.filas_validas}
                </strong>
              </div>

              <div className={styles.netBox}>
                <span className={styles.netLabel}>Filas inválidas</span>
                <strong
                  className={
                    resumen.filas_invalidas > 0
                      ? styles.netError
                      : styles.net
                  }
                >
                  {resumen.filas_invalidas}
                </strong>
              </div>

              <div className={styles.netBox}>
                <span className={styles.netLabel}>
                  Beneficiarios pendientes
                </span>
                <strong
                  className={
                    resumen.filas_pendientes_beneficiario > 0
                      ? styles.netError
                      : styles.net
                  }
                >
                  {resumen.filas_pendientes_beneficiario}
                </strong>
              </div>

              <div className={styles.netBox}>
                <span className={styles.netLabel}>Valor bruto total</span>
                <strong className={styles.net}>
                  {formatearMoneda(resumen.valor_bruto_total)}
                </strong>
              </div>

              <div className={styles.netBox}>
                <span className={styles.netLabel}>Valor neto total</span>
                <strong className={styles.net}>
                  {formatearMoneda(resumen.valor_neto_total)}
                </strong>
              </div>
            </div>

            {resumen.filas_pendientes_beneficiario > 0 ? (
              <label className={styles.field}>
                <span className={styles.label}>
                  <input
                    type="checkbox"
                    checked={crearBeneficiariosFaltantes}
                    onChange={(event) => {
                      setCrearBeneficiariosFaltantes(event.target.checked);
                      setErrorLocal("");
                    }}
                    disabled={formularioBloqueado}
                  />{" "}
                  Crear automáticamente los beneficiarios que no existen
                </span>

                <span className={styles.muted}>
                  Los trabajadores pendientes se registrarán como
                  beneficiarios usando la información contenida en el Excel.
                </span>
              </label>
            ) : null}
          </div>

          <div className={styles.desktopTable}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Trabajador</th>
                  <th>Documento</th>
                  <th>Concepto</th>
                  <th>Medio de pago</th>
                  <th>Valor bruto</th>
                  <th>Retenciones</th>
                  <th>Descuentos</th>
                  <th>Valor neto</th>
                  <th>Validación</th>
                </tr>
              </thead>

              <tbody>
                {filasValidadas.map((fila) => (
                  <tr key={`${fila.numero_fila}-${fila.numero_documento}`}>
                    <td>{fila.numero_fila}</td>

                    <td>
                      <strong className={styles.primaryText}>
                        {fila.nombre_trabajador || "Sin nombre"}
                      </strong>
                    </td>

                    <td>
                      <span className={styles.primaryText}>
                        {fila.tipo_documento || "—"}
                      </span>
                      <span className={styles.muted}>
                        {fila.numero_documento || "—"}
                      </span>
                    </td>

                    <td>{fila.concepto_nomina || "—"}</td>

                    <td>{fila.medio_pago || "—"}</td>

                    <td>{formatearMoneda(fila.valor_bruto)}</td>

                    <td>{formatearMoneda(fila.valor_retenciones)}</td>

                    <td>{formatearMoneda(fila.valor_descuentos)}</td>

                    <td>{formatearMoneda(fila.valor_neto)}</td>

                    <td>
                      <span className={styles.status}>
                        {etiquetaEstadoValidacion(
                          fila.estado_validacion,
                        )}
                      </span>

                      {fila.errores_validacion.length > 0 ? (
                        <span className={styles.muted}>
                          {fila.errores_validacion
                            .map((error) => error.mensaje)
                            .join(" · ")}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.form}>
            {resumen.filas_invalidas > 0 ? (
              <p className={styles.error}>
                Corrija las filas inválidas en el archivo Excel y vuelva a
                cargarlo antes de crear la solicitud.
              </p>
            ) : null}

            <div className={styles.actions}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={limpiarValidacion}
                disabled={formularioBloqueado}
              >
                Cargar otro archivo
              </button>

              <button
                className={styles.button}
                type="button"
                onClick={crearSolicitudNominaGrupal}
                disabled={!puedeCrear}
              >
                {creando
                  ? "Creando solicitud..."
                  : "Crear solicitud de nómina"}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}