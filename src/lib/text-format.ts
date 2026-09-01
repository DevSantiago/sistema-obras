const CONECTORES_NOMBRE = new Set([
  "a",
  "al",
  "de",
  "del",
  "e",
  "el",
  "en",
  "la",
  "las",
  "los",
  "o",
  "para",
  "por",
  "u",
  "y",
]);

const SIGLAS_NOMBRE = new Set([
  "CC",
  "CE",
  "EPS",
  "IPS",
  "LTDA",
  "NIT",
  "S.A.",
  "S.A.S.",
  "SA",
  "SAS",
]);

function capitalizarPalabra(palabra: string) {
  return palabra.charAt(0).toLocaleUpperCase("es-CO") + palabra.slice(1);
}

export function formatearNombrePropio(valor: string) {
  const palabras = valor.trim().replace(/\s+/g, " ").split(" ");

  return palabras
    .map((palabra, indice) => {
      const palabraMinuscula = palabra.toLocaleLowerCase("es-CO");
      const palabraMayuscula = palabra.toLocaleUpperCase("es-CO");

      if (SIGLAS_NOMBRE.has(palabraMayuscula) || palabra.length === 1) {
        return palabraMayuscula;
      }

      if (indice > 0 && CONECTORES_NOMBRE.has(palabraMinuscula)) {
        return palabraMinuscula;
      }

      return capitalizarPalabra(palabraMinuscula);
    })
    .join(" ");
}
