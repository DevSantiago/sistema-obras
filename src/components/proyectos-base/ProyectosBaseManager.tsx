"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "./ProyectosBaseManager.module.css";

type LineaNegocioCentroCosto = "OBRA" | "INTERVENTORIA";
type FaseCentroCosto = "LICITACION" | "EJECUCION";
type EstadoProyectoBase = "EN_LICITACION" | "EN_EJECUCION" | "FINALIZADO";
type EstadoCentroCosto = "EN_LICITACION" | "EN_EJECUCION" | "FINALIZADO";

type CentroCostoInput = {
  linea_negocio: LineaNegocioCentroCosto;
  fase_centro_costo: FaseCentroCosto;
};

type CentroCosto = CentroCostoInput & {
  id: string;
  codigo: string;
  nombre: string;
  estado_centro_costo: EstadoCentroCosto;
};

type Fondo = {
  id: string;
  nombre: string;
  saldo_actual: string;
};

type ProyectoBase = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado_proyecto: EstadoProyectoBase;
  activo: boolean;
  fondo: Fondo | null;
  centros_costo: CentroCosto[];
};

const OPCIONES_CENTROS_COSTO: Array<CentroCostoInput & { label: string }> = [
  {
    label: "PRO-OBRA - Licitación de obra",
    linea_negocio: "OBRA",
    fase_centro_costo: "LICITACION",
  },
  {
    label: "PRO-INT - Licitación de interventoría",
    linea_negocio: "INTERVENTORIA",
    fase_centro_costo: "LICITACION",
  },
];

const ESTADO_INICIAL_CENTROS = {
  "OBRA-LICITACION": true,
  "INTERVENTORIA-LICITACION": false,
};

function obtenerClaveCentroCosto(centroCosto: CentroCostoInput) {
  return `${centroCosto.linea_negocio}-${centroCosto.fase_centro_costo}`;
}

function formatearMoneda(valor: string) {
  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return `$${valor}`;
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numero);
}

function obtenerTextoAccionCentroCosto(centroCosto: CentroCosto) {
  if (
    centroCosto.fase_centro_costo === "LICITACION" &&
    centroCosto.estado_centro_costo === "EN_LICITACION"
  ) {
    return centroCosto.linea_negocio === "OBRA" ? "Pasar a OBRA" : "Pasar a INT";
  }

  if (
    centroCosto.fase_centro_costo === "EJECUCION" &&
    centroCosto.estado_centro_costo === "EN_EJECUCION"
  ) {
    return "Finalizar";
  }

  return null;
}

function obtenerEstadoDestinoCentroCosto(centroCosto: CentroCosto) {
  if (
    centroCosto.fase_centro_costo === "LICITACION" &&
    centroCosto.estado_centro_costo === "EN_LICITACION"
  ) {
    return "EN_EJECUCION";
  }

  if (
    centroCosto.fase_centro_costo === "EJECUCION" &&
    centroCosto.estado_centro_costo === "EN_EJECUCION"
  ) {
    return "FINALIZADO";
  }

  return null;
}

function obtenerObservacionCambioEstado(
  centroCosto: CentroCosto,
  estadoDestino: EstadoCentroCosto,
) {
  if (estadoDestino === "EN_EJECUCION") {
    return centroCosto.linea_negocio === "OBRA"
      ? "Inicio de ejecución de obra aprobado."
      : "Inicio de ejecución de interventoría aprobado.";
  }

  return centroCosto.linea_negocio === "OBRA"
    ? "Obra finalizada."
    : "Interventoría finalizada.";
}

async function cargarProyectos() {
  const response = await fetch("/api/v1/proyectos-base", {
    method: "GET",
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "No se pudieron cargar los proyectos.");
  }

  return result.data as ProyectoBase[];
}

export function ProyectosBaseManager() {
  const [proyectos, setProyectos] = useState<ProyectoBase[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [centrosSeleccionados, setCentrosSeleccionados] = useState(
    ESTADO_INICIAL_CENTROS,
  );
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [centroCambiandoEstadoId, setCentroCambiandoEstadoId] = useState<
    string | null
  >(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let componenteMontado = true;

    async function cargarProyectosIniciales() {
      try {
        const proyectosBase = await cargarProyectos();

        if (!componenteMontado) {
          return;
        }

        setProyectos(proyectosBase);
      } catch (err) {
        if (!componenteMontado) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los proyectos.";

        setError(message);
      } finally {
        if (componenteMontado) {
          setCargando(false);
        }
      }
    }

    void cargarProyectosIniciales();

    return () => {
      componenteMontado = false;
    };
  }, []);

  function cambiarCentroSeleccionado(centroCosto: CentroCostoInput) {
    const clave = obtenerClaveCentroCosto(centroCosto);

    setCentrosSeleccionados((prev) => ({
      ...prev,
      [clave]: !prev[clave as keyof typeof prev],
    }));
  }

  async function crearProyecto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setGuardando(true);
    setMensaje(null);
    setError(null);

    const centrosCosto = OPCIONES_CENTROS_COSTO.filter((opcion) => {
      const clave = obtenerClaveCentroCosto(opcion);
      return centrosSeleccionados[clave as keyof typeof centrosSeleccionados];
    }).map(({ linea_negocio, fase_centro_costo }) => ({
      linea_negocio,
      fase_centro_costo,
    }));

    try {
      const response = await fetch("/api/v1/proyectos-base", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          descripcion: descripcion || undefined,
          centros_costo: centrosCosto,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo crear el proyecto base.");
      }

      const proyectosBase = await cargarProyectos();

      setNombre("");
      setDescripcion("");
      setCentrosSeleccionados(ESTADO_INICIAL_CENTROS);
      setMensaje("Proyecto base creado correctamente.");
      setProyectos(proyectosBase);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo crear el proyecto base.";

      setError(message);
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoCentroCosto(
    proyecto: ProyectoBase,
    centroCosto: CentroCosto,
  ) {
    const estadoDestino = obtenerEstadoDestinoCentroCosto(centroCosto);

    if (!estadoDestino) {
      return;
    }

    const textoAccion = obtenerTextoAccionCentroCosto(centroCosto);
    const confirmado = window.confirm(
      `¿Confirmas la acción "${textoAccion}" para ${centroCosto.nombre}?`,
    );

    if (!confirmado) {
      return;
    }

    setCentroCambiandoEstadoId(centroCosto.id);
    setMensaje(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/proyectos-base/${proyecto.id}/centros-costo/${centroCosto.id}/estado`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado_centro_costo: estadoDestino,
            observacion: obtenerObservacionCambioEstado(
              centroCosto,
              estadoDestino,
            ),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.message || "No se pudo cambiar el estado del centro de costo.",
        );
      }

      const proyectoActualizado = result.data as ProyectoBase;

      setProyectos((prev) =>
        prev.map((proyectoBase) =>
          proyectoBase.id === proyectoActualizado.id
            ? proyectoActualizado
            : proyectoBase,
        ),
      );
      setMensaje("Estado del centro de costo actualizado correctamente.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el estado del centro de costo.";

      setError(message);
    } finally {
      setCentroCambiandoEstadoId(null);
    }
  }

  function renderCentroCosto(proyecto: ProyectoBase, centroCosto: CentroCosto) {
    const textoAccion = obtenerTextoAccionCentroCosto(centroCosto);

    return (
      <div className={styles.costCenter} key={centroCosto.id}>
        <div className={styles.costCenterInfo}>
          <span className={styles.costCenterName}>{centroCosto.nombre}</span>
          <span className={styles.costCenterMeta}>
            {centroCosto.fase_centro_costo}
          </span>
          <span className={styles.costCenterStatus}>
            {centroCosto.estado_centro_costo}
          </span>
        </div>

        {textoAccion && (
          <button
            className={styles.actionButton}
            type="button"
            disabled={centroCambiandoEstadoId === centroCosto.id}
            onClick={() => cambiarEstadoCentroCosto(proyecto, centroCosto)}
          >
            {centroCambiandoEstadoId === centroCosto.id
              ? "Procesando..."
              : textoAccion}
          </button>
        )}
      </div>
    );
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <p className={styles.headerLabel}>Proyectos base</p>
        <h1 className={styles.headerTitle}>
          Gestión de proyectos y centros de costo
        </h1>
      </header>

      <section className={styles.card}>
        <form className={styles.form} onSubmit={crearProyecto}>
          <h2 className={styles.formTitle}>Crear proyecto base</h2>

          <label className={styles.field}>
            Nombre del proyecto
            <input
              className={styles.input}
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Construcción sede administrativa"
              required
            />
          </label>

          <label className={styles.field}>
            Descripción
            <textarea
              className={styles.textarea}
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Descripción opcional del proyecto"
              rows={3}
            />
          </label>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Centros de costo iniciales</legend>

            <div className={styles.options}>
              {OPCIONES_CENTROS_COSTO.map((opcion) => {
                const clave = obtenerClaveCentroCosto(opcion);

                return (
                  <label className={styles.option} key={clave}>
                    <input
                      type="checkbox"
                      checked={
                        centrosSeleccionados[
                          clave as keyof typeof centrosSeleccionados
                        ]
                      }
                      onChange={() => cambiarCentroSeleccionado(opcion)}
                    />
                    {opcion.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button className={styles.button} type="submit" disabled={guardando}>
            {guardando ? "Creando..." : "Crear proyecto"}
          </button>
        </form>
      </section>

      {mensaje && <p className={styles.success}>{mensaje}</p>}
      {error && <p className={styles.error}>{error}</p>}

      <section>
        <h2 className={styles.sectionTitle}>Proyectos creados</h2>

        {cargando ? (
          <section className={styles.empty}>
            <h2>Cargando proyectos...</h2>
            <p>Estamos consultando la información registrada.</p>
          </section>
        ) : proyectos.length === 0 ? (
          <section className={styles.empty}>
            <h2>No hay proyectos base creados.</h2>
            <p>Crea el primer proyecto para generar su fondo y centros de costo.</p>
          </section>
        ) : (
          <>
            <section className={`${styles.card} ${styles.desktopOnly}`}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Proyecto</th>
                      <th>Estado proyecto</th>
                      <th>Fondo general</th>
                      <th>Centros de costo</th>
                    </tr>
                  </thead>

                  <tbody>
                    {proyectos.map((proyecto) => (
                      <tr key={proyecto.id}>
                        <td>
                          <strong className={styles.projectName}>
                            {proyecto.nombre}
                          </strong>
                          {proyecto.descripcion && (
                            <p className={styles.description}>
                              {proyecto.descripcion}
                            </p>
                          )}
                        </td>

                        <td>
                          <span className={styles.status}>
                            {proyecto.estado_proyecto}
                          </span>
                        </td>

                        <td>
                          {proyecto.fondo ? (
                            <>
                              <p className={styles.fund}>
                                {proyecto.fondo.nombre}
                              </p>
                              <p className={styles.balance}>
                                {formatearMoneda(proyecto.fondo.saldo_actual)}
                              </p>
                            </>
                          ) : (
                            "Sin fondo"
                          )}
                        </td>

                        <td>
                          <div className={styles.costCenters}>
                            {proyecto.centros_costo.map((centroCosto) =>
                              renderCentroCosto(proyecto, centroCosto),
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles.mobileProjects}>
              {proyectos.map((proyecto) => (
                <article className={styles.projectCard} key={proyecto.id}>
                  <div className={styles.projectCardHeader}>
                    <div>
                      <h3 className={styles.projectCardTitle}>
                        {proyecto.nombre}
                      </h3>
                      {proyecto.descripcion && (
                        <p className={styles.description}>
                          {proyecto.descripcion}
                        </p>
                      )}
                    </div>

                    <span className={styles.status}>
                      {proyecto.estado_proyecto}
                    </span>
                  </div>

                  <div className={styles.mobileSection}>
                    <p className={styles.mobileLabel}>Fondo general</p>
                    {proyecto.fondo ? (
                      <>
                        <p className={styles.fund}>{proyecto.fondo.nombre}</p>
                        <p className={styles.balance}>
                          {formatearMoneda(proyecto.fondo.saldo_actual)}
                        </p>
                      </>
                    ) : (
                      <p className={styles.description}>Sin fondo</p>
                    )}
                  </div>

                  <div className={styles.mobileSection}>
                    <p className={styles.mobileLabel}>Centros de costo</p>
                    <div className={styles.costCenters}>
                      {proyecto.centros_costo.map((centroCosto) =>
                        renderCentroCosto(proyecto, centroCosto),
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </section>
    </section>
  );
}