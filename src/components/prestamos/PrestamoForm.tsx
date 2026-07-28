"use client";

import { useEffect, useState } from "react";
import type { BeneficiarioListado } from "@/modules/beneficiarios/beneficiarios.types";
import type { ConsultarFondosData } from "@/modules/fondos/fondos.types";
import { formatearValorEntrada } from "@/components/solicitudes-pago/solicitudes-pago.utils";
import TerceroSelector from "@/components/financiacion/TerceroSelector";
import styles from "./PrestamoForm.module.css";

type Proyecto = ConsultarFondosData["proyectos"][number];

const HOY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

export default function PrestamoForm() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [acreedores, setAcreedores] = useState<BeneficiarioListado[]>([]);
  const [proyectoId, setProyectoId] = useState("");
  const [acreedorId, setAcreedorId] = useState("");
  const [valor, setValor] = useState("");
  const [fecha, setFecha] = useState(HOY);
  const [observacion, setObservacion] = useState("");
  const [soporte, setSoporte] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch("/api/v1/fondos", {
        credentials: "include",
        cache: "no-store",
      }).then((response) => response.json()),
      fetch("/api/v1/beneficiarios?activo=true", {
        credentials: "include",
        cache: "no-store",
      }).then((response) => response.json()),
    ])
      .then(
        ([fondos, beneficiarios]: [
          { data?: ConsultarFondosData },
          { data?: BeneficiarioListado[] },
        ]) => {
          setProyectos(fondos.data?.proyectos ?? []);
          setAcreedores(beneficiarios.data ?? []);
        },
      )
      .catch(() => {
        setError(true);
        setMensaje("No fue posible cargar los catálogos.");
      });
  }, []);

  async function registrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formulario = event.currentTarget;

    if (!soporte) {
      setError(true);
      setMensaje("Debe adjuntar el soporte del préstamo.");
      return;
    }

    const formData = new FormData();
    formData.set("proyecto_base_id", proyectoId);
    formData.set("acreedor_id", acreedorId);
    formData.set("valor", valor.replace(/[^\d]/g, ""));
    formData.set("fecha_prestamo", fecha);
    formData.set("observacion", observacion);
    formData.set("soporte", soporte);
    setGuardando(true);
    setMensaje("");

    try {
      const response = await fetch("/api/v1/prestamos", {
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
        setProyectoId("");
        setAcreedorId("");
        setValor("");
        setFecha(HOY);
        setObservacion("");
        setSoporte(null);
      }
    } catch {
      setError(true);
      setMensaje("No fue posible registrar el préstamo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={registrar}>
      <div className={styles.grid}>
        <label>
          <span>Proyecto que recibe el préstamo *</span>
          <select required value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
            <option value="">Seleccione un proyecto</option>
            {proyectos.map((proyecto) => (
              <option key={proyecto.proyecto_base_id} value={proyecto.proyecto_base_id}>
                {proyecto.proyecto_nombre} · Saldo {proyecto.saldo_actual.toLocaleString("es-CO")}
              </option>
            ))}
          </select>
        </label>
        <TerceroSelector
          etiqueta="Persona acreedora"
          terceros={acreedores}
          value={acreedorId}
          onChange={setAcreedorId}
        />
        <label>
          <span>Valor del préstamo *</span>
          <input inputMode="numeric" placeholder="0" required type="text" value={valor}
            onChange={(e) => setValor(formatearValorEntrada(e.target.value))} />
        </label>
        <label>
          <span>Fecha del préstamo *</span>
          <input max={HOY} required type="date" value={fecha}
            onChange={(e) => setFecha(e.target.value)} />
        </label>
        <label className={styles.fullWidth}>
          <span>Soporte *</span>
          <input accept=".pdf,.png,.jpg,.jpeg" required type="file"
            onChange={(e) => setSoporte(e.target.files?.[0] ?? null)} />
          <small>PDF, PNG, JPG o JPEG. Máximo 10 MB.</small>
        </label>
        <label className={styles.fullWidth}>
          <span>Observación</span>
          <textarea rows={3} value={observacion}
            onChange={(e) => setObservacion(e.target.value)} />
        </label>
      </div>
      {mensaje ? <p className={error ? styles.error : styles.success}>{mensaje}</p> : null}
      <div className={styles.actions}>
        <button disabled={guardando} type="submit">
          {guardando ? "Registrando..." : "Registrar préstamo"}
        </button>
      </div>
    </form>
  );
}
