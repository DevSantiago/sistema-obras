"use client";

import { useEffect, useState } from "react";
import type { ConsultarFondosData } from "@/modules/fondos/fondos.types";
import { formatearValorEntrada } from "@/components/solicitudes-pago/solicitudes-pago.utils";
import styles from "./AnticipoForm.module.css";

type Proyecto = ConsultarFondosData["proyectos"][number];

const HOY_BOGOTA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

export default function AnticipoForm() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectoId, setProyectoId] = useState("");
  const [entidadNombre, setEntidadNombre] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("NIT");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [valor, setValor] = useState("");
  const [fecha, setFecha] = useState(HOY_BOGOTA);
  const [observacion, setObservacion] = useState("");
  const [soporte, setSoporte] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);

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
        setMensaje("No fue posible cargar los proyectos.");
        setEsError(true);
      });
  }, []);

  async function registrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formulario = event.currentTarget;

    if (!soporte) {
      setMensaje("Debe adjuntar el soporte del anticipo.");
      setEsError(true);
      return;
    }

    const formData = new FormData();
    formData.set("proyecto_base_id", proyectoId);
    formData.set("entidad_nombre", entidadNombre);
    formData.set("entidad_tipo_documento", tipoDocumento);
    formData.set("entidad_numero_documento", numeroDocumento);
    formData.set("valor", valor.replace(/[^\d]/g, ""));
    formData.set("fecha_anticipo", fecha);
    formData.set("observacion", observacion);
    formData.set("soporte", soporte);
    setCargando(true);
    setMensaje("");

    try {
      const response = await fetch("/api/v1/anticipos", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = (await response.json()) as {
        ok: boolean;
        message: string;
        data?: {
          referencia_sistema: string;
          saldo_nuevo: number;
        };
      };

      setEsError(!response.ok || !body.ok);
      setMensaje(
        response.ok && body.ok && body.data
          ? `${body.message} Referencia ${body.data.referencia_sistema}.`
          : body.message,
      );

      if (response.ok && body.ok) {
        setEntidadNombre("");
        setNumeroDocumento("");
        setValor("");
        setObservacion("");
        setSoporte(null);
        formulario.reset();
        setFecha(HOY_BOGOTA);
        setTipoDocumento("NIT");
        setProyectoId("");
      }
    } catch {
      setEsError(true);
      setMensaje("No fue posible registrar el anticipo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={registrar}>
      <div className={styles.grid}>
        <label>
          <span>Proyecto base *</span>
          <select
            required
            value={proyectoId}
            onChange={(event) => setProyectoId(event.target.value)}
          >
            <option value="">Seleccione un proyecto</option>
            {proyectos.map((proyecto) => (
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
          <span>Entidad que entrega el anticipo *</span>
          <input
            required
            value={entidadNombre}
            onChange={(event) => setEntidadNombre(event.target.value)}
            placeholder="Ej. Alcaldía de..."
          />
        </label>
        <label>
          <span>Tipo de documento *</span>
          <select
            required
            value={tipoDocumento}
            onChange={(event) => setTipoDocumento(event.target.value)}
          >
            <option value="NIT">NIT</option>
            <option value="CC">Cédula de ciudadanía</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="OTRO">Otro</option>
          </select>
        </label>
        <label>
          <span>Número de documento *</span>
          <input
            required
            value={numeroDocumento}
            onChange={(event) => setNumeroDocumento(event.target.value)}
          />
        </label>
        <label>
          <span>Valor del anticipo *</span>
          <input
            inputMode="numeric"
            required
            type="text"
            value={valor}
            onChange={(event) =>
              setValor(formatearValorEntrada(event.target.value))
            }
            placeholder="0"
          />
        </label>
        <label>
          <span>Fecha del anticipo *</span>
          <input
            max={HOY_BOGOTA}
            required
            type="date"
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
          />
        </label>
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
        <p className={esError ? styles.error : styles.success}>
          {mensaje}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button disabled={cargando} type="submit">
          {cargando ? "Registrando..." : "Registrar anticipo"}
        </button>
      </div>
    </form>
  );
}
