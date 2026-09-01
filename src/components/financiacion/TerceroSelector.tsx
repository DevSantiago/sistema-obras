"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { formatearNombrePropio } from "@/lib/text-format";
import type { BeneficiarioListado } from "@/modules/beneficiarios/beneficiarios.types";
import styles from "./TerceroSelector.module.css";

type Props = {
  etiqueta: string;
  terceros: BeneficiarioListado[];
  value: string;
  onChange: (id: string) => void;
};

function etiquetaTercero(tercero: BeneficiarioListado) {
  return `${formatearNombrePropio(tercero.nombre)} · ${tercero.tipo_documento} ${tercero.numero_documento}`;
}

export default function TerceroSelector({
  etiqueta,
  terceros,
  value,
  onChange,
}: Props) {
  const seleccionado = terceros.find((tercero) => tercero.id === value);
  const listaId = useId();
  const inputId = useId();
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const texto = busqueda.trim().toLocaleLowerCase("es");
  const filtrados = useMemo(
    () =>
      terceros
        .filter((tercero) =>
          [tercero.nombre, tercero.tipo_documento, tercero.numero_documento]
            .join(" ")
            .toLocaleLowerCase("es")
            .includes(texto),
        )
        .slice(0, 8),
    [terceros, texto],
  );

  return (
    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        <label htmlFor={inputId}>{etiqueta} *</label>
        <Link href="/beneficiarios">Crear beneficiario</Link>
      </div>
      <div className={styles.combobox}>
        <input
          id={inputId}
          aria-autocomplete="list"
          aria-controls={listaId}
          aria-expanded={abierto}
          placeholder="Buscar por nombre o documento"
          required={!value}
          role="combobox"
          value={
            abierto
              ? busqueda
              : seleccionado
                ? etiquetaTercero(seleccionado)
                : busqueda
          }
          onChange={(event) => {
            setBusqueda(event.target.value);
            onChange("");
            setAbierto(true);
          }}
          onFocus={() => {
            setBusqueda("");
            setAbierto(true);
          }}
        />
        {abierto ? (
          <div className={styles.options} id={listaId} role="listbox">
            {filtrados.length ? (
              filtrados.map((tercero) => (
                <button
                  key={tercero.id}
                  aria-selected={tercero.id === value}
                  role="option"
                  type="button"
                  onClick={() => {
                    onChange(tercero.id);
                    setBusqueda("");
                    setAbierto(false);
                  }}
                >
                  <strong>{formatearNombrePropio(tercero.nombre)}</strong>
                  <span>
                    {tercero.tipo_documento}{" "}
                    {tercero.numero_documento}
                  </span>
                </button>
              ))
            ) : (
              <p>No se encontraron beneficiarios.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
