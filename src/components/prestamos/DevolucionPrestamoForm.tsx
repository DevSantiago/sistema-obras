"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PrestamoPendiente } from "@/modules/prestamos/prestamos.types";
import { formatearValorEntrada } from "@/components/solicitudes-pago/solicitudes-pago.utils";
import styles from "./PrestamoForm.module.css";

export default function DevolucionPrestamoForm() {
  const [prestamos, setPrestamos] = useState<PrestamoPendiente[]>([]);
  const [prestamoId, setPrestamoId] = useState("");
  const [valor, setValor] = useState("");
  const [observacion, setObservacion] = useState("");
  const [soporte, setSoporte] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState(false);

  const cargarPrestamos = useCallback(async () => {
    const response = await fetch("/api/v1/prestamos", {
      credentials: "include",
      cache: "no-store",
    });
    const body = (await response.json()) as {
      ok: boolean;
      message: string;
      data?: PrestamoPendiente[];
    };

    if (!response.ok || !body.ok) {
      throw new Error(body.message);
    }

    setPrestamos(body.data ?? []);
  }, []);

  useEffect(() => {
    void fetch("/api/v1/prestamos", {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => response.json())
      .then(
        (body: {
          ok: boolean;
          message: string;
          data?: PrestamoPendiente[];
        }) => {
          setPrestamos(body.data ?? []);
        },
      )
      .catch(() => {
        setError(true);
        setMensaje("No fue posible cargar los préstamos pendientes.");
      });
  }, []);

  const prestamo = useMemo(
    () => prestamos.find((item) => item.id === prestamoId),
    [prestamoId, prestamos],
  );
  const valorNumerico = Number(valor.replace(/[^\d]/g, ""));

  async function registrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formulario = event.currentTarget;

    if (!soporte) {
      setError(true);
      setMensaje("Debe adjuntar el soporte de la devolución.");
      return;
    }

    if (prestamo && valorNumerico > prestamo.saldo_pendiente) {
      setError(true);
      setMensaje(
        "El valor no puede superar el saldo pendiente del préstamo.",
      );
      return;
    }

    const formData = new FormData();
    formData.set("prestamo_proyecto_id", prestamoId);
    formData.set("valor", valor.replace(/[^\d]/g, ""));
    formData.set("observacion", observacion);
    formData.set("soporte", soporte);
    setGuardando(true);
    setMensaje("");

    try {
      const response = await fetch("/api/v1/prestamos/devoluciones", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = (await response.json()) as {
        ok: boolean;
        message: string;
        data?: {
          referencia_sistema: string;
          saldo_nuevo_prestamo: number;
        };
      };

      setError(!response.ok || !body.ok);
      setMensaje(
        response.ok && body.ok && body.data
          ? `${body.message} Referencia ${body.data.referencia_sistema}. Saldo pendiente ${body.data.saldo_nuevo_prestamo.toLocaleString("es-CO")}.`
          : body.message,
      );

      if (response.ok && body.ok) {
        formulario.reset();
        setPrestamoId("");
        setValor("");
        setObservacion("");
        setSoporte(null);
        await cargarPrestamos();
      }
    } catch {
      setError(true);
      setMensaje("No fue posible registrar la devolución.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={registrar}>
      <div className={styles.grid}>
        <label className={styles.fullWidth}>
          <span>Préstamo pendiente *</span>
          <select
            required
            value={prestamoId}
            onChange={(event) => {
              setPrestamoId(event.target.value);
              setValor("");
            }}
          >
            <option value="">Seleccione un préstamo</option>
            {prestamos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.referencia_sistema} ·{" "}
                {item.tipo_prestamo === "PERSONA_A_PROYECTO"
                  ? `${item.acreedor_nombre} → ${item.proyecto_destino_nombre}`
                  : `${item.proyecto_origen_nombre} → ${item.proyecto_destino_nombre}`}
                {" · Pendiente "}
                {item.saldo_pendiente.toLocaleString("es-CO")}
              </option>
            ))}
          </select>
          {prestamos.length === 0 ? (
            <small>No hay préstamos con saldo pendiente.</small>
          ) : null}
        </label>
        {prestamo ? (
          <div className={`${styles.loanDetail} ${styles.fullWidth}`}>
            <div>
              <span>Tipo</span>
              <strong>
                {prestamo.tipo_prestamo === "PERSONA_A_PROYECTO"
                  ? "Persona a proyecto"
                  : "Entre proyectos"}
              </strong>
            </div>
            <div>
              <span>Proyecto que devuelve</span>
              <strong>{prestamo.proyecto_destino_nombre}</strong>
            </div>
            <div>
              <span>Destino de la devolución</span>
              <strong>
                {prestamo.tipo_prestamo === "PERSONA_A_PROYECTO"
                  ? prestamo.acreedor_nombre
                  : prestamo.proyecto_origen_nombre}
              </strong>
            </div>
            <div>
              <span>Saldo pendiente</span>
              <strong>
                {prestamo.saldo_pendiente.toLocaleString("es-CO")}
              </strong>
            </div>
            <div>
              <span>Saldo disponible del proyecto</span>
              <strong>
                {prestamo.saldo_fondo_destino.toLocaleString("es-CO")}
              </strong>
            </div>
          </div>
        ) : null}
        <label>
          <span>Valor de la devolución *</span>
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
          {prestamo && valorNumerico > 0 ? (
            <small>
              Saldo pendiente proyectado:{" "}
              {(
                prestamo.saldo_pendiente - valorNumerico
              ).toLocaleString("es-CO")}
            </small>
          ) : null}
        </label>
        <div className={styles.systemDate}>
          <span>Fecha de la operación</span>
          <p>El sistema la asignará al registrar la devolución.</p>
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
        <button
          disabled={guardando || prestamos.length === 0}
          type="submit"
        >
          {guardando ? "Registrando..." : "Registrar devolución"}
        </button>
      </div>
    </form>
  );
}
