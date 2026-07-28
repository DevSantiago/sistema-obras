"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConsultarFondosData } from "@/modules/fondos/fondos.types";
import { formatearValorEntrada } from "@/components/solicitudes-pago/solicitudes-pago.utils";
import styles from "./PrestamoForm.module.css";

type Proyecto = ConsultarFondosData["proyectos"][number];

export default function PrestamoEntreProyectosForm() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectoOrigenId, setProyectoOrigenId] = useState("");
  const [proyectoDestinoId, setProyectoDestinoId] = useState("");
  const [valor, setValor] = useState("");
  const [observacion, setObservacion] = useState("");
  const [soporte, setSoporte] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    void fetch("/api/v1/fondos", {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((body: { data?: ConsultarFondosData }) => {
        setProyectos(body.data?.proyectos ?? []);
      })
      .catch(() => {
        setError(true);
        setMensaje("No fue posible cargar los proyectos.");
      });
  }, []);

  const proyectoOrigen = useMemo(
    () =>
      proyectos.find(
        (proyecto) => proyecto.proyecto_base_id === proyectoOrigenId,
      ),
    [proyectoOrigenId, proyectos],
  );
  const valorNumerico = Number(valor.replace(/[^\d]/g, ""));

  async function registrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formulario = event.currentTarget;

    if (!soporte) {
      setError(true);
      setMensaje("Debe adjuntar el soporte del préstamo.");
      return;
    }

    const formData = new FormData();
    formData.set("proyecto_origen_id", proyectoOrigenId);
    formData.set("proyecto_destino_id", proyectoDestinoId);
    formData.set("valor", valor.replace(/[^\d]/g, ""));
    formData.set("observacion", observacion);
    formData.set("soporte", soporte);
    setGuardando(true);
    setMensaje("");

    try {
      const response = await fetch("/api/v1/prestamos/entre-proyectos", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = (await response.json()) as {
        ok: boolean;
        message: string;
        data?: { referencia_sistema: string };
      };

      setError(!response.ok || !body.ok);
      setMensaje(
        response.ok && body.ok && body.data
          ? `${body.message} Referencia ${body.data.referencia_sistema}.`
          : body.message,
      );

      if (response.ok && body.ok) {
        formulario.reset();
        setProyectoOrigenId("");
        setProyectoDestinoId("");
        setValor("");
        setObservacion("");
        setSoporte(null);
      }
    } catch {
      setError(true);
      setMensaje("No fue posible registrar el préstamo entre proyectos.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={registrar}>
      <div className={styles.grid}>
        <label>
          <span>Proyecto que entrega el préstamo *</span>
          <select
            required
            value={proyectoOrigenId}
            onChange={(event) => setProyectoOrigenId(event.target.value)}
          >
            <option value="">Seleccione un proyecto</option>
            {proyectos
              .filter(
                (proyecto) =>
                  proyecto.proyecto_base_id !== proyectoDestinoId,
              )
              .map((proyecto) => (
                <option
                  key={proyecto.proyecto_base_id}
                  value={proyecto.proyecto_base_id}
                >
                  {proyecto.proyecto_nombre} · Saldo{" "}
                  {proyecto.saldo_actual.toLocaleString("es-CO")}
                </option>
              ))}
          </select>
        </label>
        <label>
          <span>Proyecto que recibe el préstamo *</span>
          <select
            required
            value={proyectoDestinoId}
            onChange={(event) => setProyectoDestinoId(event.target.value)}
          >
            <option value="">Seleccione un proyecto</option>
            {proyectos
              .filter(
                (proyecto) =>
                  proyecto.proyecto_base_id !== proyectoOrigenId,
              )
              .map((proyecto) => (
                <option
                  key={proyecto.proyecto_base_id}
                  value={proyecto.proyecto_base_id}
                >
                  {proyecto.proyecto_nombre} · Saldo{" "}
                  {proyecto.saldo_actual.toLocaleString("es-CO")}
                </option>
              ))}
          </select>
        </label>
        <label>
          <span>Valor del préstamo *</span>
          <input
            inputMode="numeric"
            placeholder="0"
            required
            type="text"
            value={valor}
            onChange={(event) =>
              setValor(formatearValorEntrada(event.target.value))
            }
          />
          {proyectoOrigen && valorNumerico > 0 ? (
            <small>
              Saldo proyectado del origen:{" "}
              {(
                proyectoOrigen.saldo_actual - valorNumerico
              ).toLocaleString("es-CO")}
            </small>
          ) : null}
        </label>
        <div className={styles.systemDate}>
          <span>Fecha de la operación</span>
          <p>El sistema la asignará al registrar el préstamo.</p>
        </div>
        <label className={styles.fullWidth}>
          <span>Soporte *</span>
          <input
            accept=".pdf,.png,.jpg,.jpeg"
            required
            type="file"
            onChange={(event) =>
              setSoporte(event.target.files?.[0] ?? null)
            }
          />
          <small>PDF, PNG, JPG o JPEG. Máximo 10 MB.</small>
        </label>
        <label className={styles.fullWidth}>
          <span>Observación</span>
          <textarea
            rows={3}
            value={observacion}
            onChange={(event) => setObservacion(event.target.value)}
          />
        </label>
      </div>
      {mensaje ? (
        <p className={error ? styles.error : styles.success}>{mensaje}</p>
      ) : null}
      <div className={styles.actions}>
        <button disabled={guardando} type="submit">
          {guardando ? "Registrando..." : "Registrar préstamo"}
        </button>
      </div>
    </form>
  );
}
