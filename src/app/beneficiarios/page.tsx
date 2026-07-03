// src/app/beneficiarios/page.tsx

import {
  BeneficiariosManager,
} from "@/components/beneficiarios/BeneficiariosManager";
import { PrivateLayout } from "@/components/layout/PrivateLayout";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { listarBeneficiariosService } from "@/modules/beneficiarios/beneficiarios.service";
import type { BeneficiarioListado } from "@/modules/beneficiarios/beneficiarios.types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

function formatearFechaColombia(fecha: string | Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Bogota",
  })
    .format(new Date(fecha))
    .replace(/\u00a0/g, " ");
}

export default async function BeneficiariosPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const resultadoAutenticacion =
    await obtenerUsuarioAutenticado(sessionToken);

  if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
    redirect("/login");
  }

  const { usuario } = resultadoAutenticacion.body.data;

  let beneficiariosResultado: BeneficiarioListado[];

  try {
    beneficiariosResultado =
      (await listarBeneficiariosService(usuario)) as BeneficiarioListado[];
  } catch {
    redirect("/dashboard");
  }

  const beneficiarios = beneficiariosResultado.map((beneficiario) => ({
    ...beneficiario,
    creado_en: new Date(beneficiario.creado_en).toISOString(),
    actualizado_en: new Date(beneficiario.actualizado_en).toISOString(),
    creado_en_formateado: formatearFechaColombia(beneficiario.creado_en),
  }));

  return (
    <PrivateLayout usuario={usuario}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Pagos</p>
        <h1 className={styles.title}>Beneficiarios</h1>
        <p className={styles.description}>
          Cree y consulte los beneficiarios disponibles para las solicitudes de
          pago.
        </p>
      </header>

      <BeneficiariosManager beneficiarios={beneficiarios} />
    </PrivateLayout>
  );
}