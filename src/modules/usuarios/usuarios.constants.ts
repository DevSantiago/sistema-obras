export const DOMINIOS_CORREO_PERMITIDOS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
] as const;

const DOMINIOS_CORREO_PERMITIDOS_SET = new Set<string>(
  DOMINIOS_CORREO_PERMITIDOS,
);

export function esCorreoPermitido(correo: string) {
  const correoNormalizado = correo.trim().toLowerCase();

  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(correoNormalizado)) {
    return false;
  }

  const dominio = correoNormalizado.split("@")[1];
  return DOMINIOS_CORREO_PERMITIDOS_SET.has(dominio);
}
