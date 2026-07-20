"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type {
  AccesoUsuarioInput,
  LineaNegocioAcceso,
  UsuarioListado,
} from "@/modules/usuarios/usuarios.types";
import styles from "./UserForm.module.css";

const ROLES_DISPONIBLES = [
  "ADMINISTRADOR",
  "DIRECTOR",
  "APROBADOR_1",
  "APROBADOR_2",
  "AUXILIAR_CONTABLE",
  "PAGOS",
  "SOLICITANTE",
];

const ETIQUETAS_ROL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  DIRECTOR: "Director",
  APROBADOR_1: "Aprobador de primer nivel",
  APROBADOR_2: "Aprobador de segundo nivel",
  AUXILIAR_CONTABLE: "Auxiliar contable",
  PAGOS: "Pagos",
  SOLICITANTE: "Solicitante",
};

const ETIQUETAS_LINEA: Record<LineaNegocioAcceso, string> = {
  OBRA: "PRO-OBRA y OBRA",
  INTERVENTORIA: "PRO-INT e INT",
};

export type ProyectoAccesoDisponible = {
  id: string;
  nombre: string;
  lineas_negocio: LineaNegocioAcceso[];
};

type UsuarioResponse = {
  ok: boolean;
  message: string;
};

type UserFormProps = {
  usuarioEditando?: UsuarioListado | null;
  proyectos: ProyectoAccesoDisponible[];
  onCancelarEdicion?: () => void;
  onGuardado?: () => void;
};

function crearClaveAcceso(acceso: AccesoUsuarioInput) {
  return `${acceso.proyecto_base_id}:${acceso.linea_negocio}`;
}

export function UserForm({
  usuarioEditando,
  proyectos,
  onCancelarEdicion,
  onGuardado,
}: UserFormProps) {
  const router = useRouter();
  const esEdicion = Boolean(usuarioEditando);

  const [tipoDocumento, setTipoDocumento] = useState(
    usuarioEditando?.tipo_documento ?? "CC",
  );
  const [numeroDocumento, setNumeroDocumento] = useState(
    usuarioEditando?.numero_documento ?? "",
  );
  const [nombre, setNombre] = useState(usuarioEditando?.nombre ?? "");
  const [correo, setCorreo] = useState(usuarioEditando?.correo ?? "");
  const [telefono, setTelefono] = useState(usuarioEditando?.telefono ?? "");
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState<"ACTIVO" | "INACTIVO">(
    usuarioEditando?.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
  );
  const [rolSeleccionado, setRolSeleccionado] = useState(
    usuarioEditando?.rol ?? "",
  );
  const [accesosSeleccionados, setAccesosSeleccionados] = useState<
    AccesoUsuarioInput[]
  >(
    usuarioEditando?.accesos.map((acceso) => ({
      proyecto_base_id: acceso.proyecto_base_id,
      linea_negocio: acceso.linea_negocio,
    })) ?? [],
  );
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const rolActualEsObsoleto = Boolean(
    usuarioEditando?.rol &&
      !ROLES_DISPONIBLES.includes(usuarioEditando.rol),
  );

  function manejarCambioRol(nuevoRol: string) {
    setRolSeleccionado(nuevoRol);

    if (nuevoRol === "SOLICITANTE") {
      setAccesosSeleccionados((accesos) =>
        accesos.filter((acceso) => acceso.linea_negocio === "OBRA"),
      );
    }
  }

  function manejarCambioAcceso(
    proyectoBaseId: string,
    lineaNegocio: LineaNegocioAcceso,
  ) {
    const acceso = {
      proyecto_base_id: proyectoBaseId,
      linea_negocio: lineaNegocio,
    };
    const clave = crearClaveAcceso(acceso);

    setAccesosSeleccionados((accesos) => {
      const seleccionado = accesos.some(
        (accesoActual) => crearClaveAcceso(accesoActual) === clave,
      );

      return seleccionado
        ? accesos.filter(
            (accesoActual) => crearClaveAcceso(accesoActual) !== clave,
          )
        : [...accesos, acceso];
    });
  }

  function estaSeleccionado(
    proyectoBaseId: string,
    lineaNegocio: LineaNegocioAcceso,
  ) {
    return accesosSeleccionados.some(
      (acceso) =>
        acceso.proyecto_base_id === proyectoBaseId &&
        acceso.linea_negocio === lineaNegocio,
    );
  }

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);

    if (!rolSeleccionado) {
      setMensajeError("Seleccione un rol para el usuario.");
      return;
    }

    setGuardando(true);

    try {
      const url = esEdicion
        ? `/api/v1/usuarios/${usuarioEditando?.id}`
        : "/api/v1/usuarios";
      const method = esEdicion ? "PATCH" : "POST";
      const datosComunes = {
        nombre,
        correo,
        telefono: telefono.trim() === "" ? null : telefono,
        rol: rolSeleccionado,
        accesos: accesosSeleccionados,
      };
      const body = esEdicion
        ? datosComunes
        : {
            ...datosComunes,
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento,
            password,
            estado,
          };

      const respuesta = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data: UsuarioResponse = await respuesta.json();

      if (!respuesta.ok || !data.ok) {
        setMensajeError(data.message || "No fue posible guardar el usuario.");
        return;
      }

      setMensajeExito(data.message || "Usuario guardado correctamente.");

      if (!esEdicion) {
        setTipoDocumento("CC");
        setNumeroDocumento("");
        setNombre("");
        setCorreo("");
        setTelefono("");
        setPassword("");
        setEstado("ACTIVO");
        setRolSeleccionado("");
        setAccesosSeleccionados([]);
      }

      onGuardado?.();
      router.refresh();
    } catch {
      setMensajeError("Ocurrió un error inesperado al guardar el usuario.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {esEdicion ? "Editar usuario" : "Crear usuario"}
        </h2>
        <p className={styles.description}>
          {esEdicion
            ? "Actualice los datos, el rol y los proyectos asignados. La identificación no se puede modificar."
            : "Registre el usuario y defina los proyectos y líneas donde podrá operar."}
        </p>
      </header>

      <form className={styles.form} onSubmit={manejarSubmit}>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tipo_documento">
              Tipo de identificación
            </label>
            <select
              className={styles.input}
              id="tipo_documento"
              value={tipoDocumento}
              onChange={(event) => setTipoDocumento(event.target.value)}
              disabled={esEdicion}
              required
            >
              <option value="CC">Cédula de ciudadanía</option>
              <option value="CE">Cédula de extranjería</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="numero_documento">
              Número de identificación
            </label>
            <input
              className={styles.input}
              id="numero_documento"
              type="number"
              value={numeroDocumento}
              onChange={(event) => setNumeroDocumento(event.target.value)}
              placeholder="Número de documento"
              disabled={esEdicion}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="nombre">
              Nombre
            </label>
            <input
              className={styles.input}
              id="nombre"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="correo">
              Correo
            </label>
            <input
              className={styles.input}
              id="correo"
              type="email"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              placeholder="usuario@correo.com"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="telefono">
              Teléfono
            </label>
            <input
              className={styles.input}
              id="telefono"
              type="text"
              value={telefono}
              onChange={(event) => setTelefono(event.target.value)}
              placeholder="Opcional"
            />
          </div>

          {!esEdicion && (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">
                  Contraseña
                </label>
                <input
                  className={styles.input}
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Contraseña temporal"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="estado">
                  Estado
                </label>
                <select
                  className={styles.input}
                  id="estado"
                  value={estado}
                  onChange={(event) =>
                    setEstado(event.target.value as "ACTIVO" | "INACTIVO")
                  }
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>
            </>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="rol">
              Rol
            </label>
            <select
              className={styles.input}
              id="rol"
              value={rolSeleccionado}
              onChange={(event) => manejarCambioRol(event.target.value)}
              required
            >
              <option value="">Seleccione un rol</option>
              {rolActualEsObsoleto && usuarioEditando?.rol && (
                <option value={usuarioEditando.rol} disabled>
                  {usuarioEditando.rol} (inactivo)
                </option>
              )}
              {ROLES_DISPONIBLES.map((rol) => (
                <option key={rol} value={rol}>
                  {ETIQUETAS_ROL[rol]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className={styles.accessFieldset}>
          <legend className={styles.legend}>Accesos por proyecto</legend>
          <p className={styles.accessDescription}>
            Cada acceso cubre la fase de licitación y la fase de ejecución de
            la línea seleccionada.
          </p>

          {proyectos.length === 0 ? (
            <p className={styles.noProjects}>No hay proyectos disponibles.</p>
          ) : (
            <div className={styles.projectList}>
              {proyectos.map((proyecto) => (
                <div className={styles.projectRow} key={proyecto.id}>
                  <p className={styles.projectName}>{proyecto.nombre}</p>
                  <div className={styles.accessOptions}>
                    {proyecto.lineas_negocio.map((lineaNegocio) => {
                      const deshabilitado =
                        rolSeleccionado === "SOLICITANTE" &&
                        lineaNegocio === "INTERVENTORIA";

                      return (
                        <label
                          className={
                            deshabilitado
                              ? styles.accessOptionDisabled
                              : styles.accessOption
                          }
                          key={`${proyecto.id}-${lineaNegocio}`}
                        >
                          <input
                            type="checkbox"
                            checked={estaSeleccionado(
                              proyecto.id,
                              lineaNegocio,
                            )}
                            onChange={() =>
                              manejarCambioAcceso(
                                proyecto.id,
                                lineaNegocio,
                              )
                            }
                            disabled={deshabilitado}
                          />
                          <span>{ETIQUETAS_LINEA[lineaNegocio]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </fieldset>

        {mensajeError && <p className={styles.error}>{mensajeError}</p>}
        {mensajeExito && <p className={styles.success}>{mensajeExito}</p>}

        <div className={styles.actions}>
          {esEdicion && (
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={onCancelarEdicion}
              disabled={guardando}
            >
              Cancelar
            </button>
          )}
          <button className={styles.button} type="submit" disabled={guardando}>
            {guardando
              ? "Guardando..."
              : esEdicion
                ? "Guardar cambios"
                : "Crear usuario"}
          </button>
        </div>
      </form>
    </section>
  );
}
