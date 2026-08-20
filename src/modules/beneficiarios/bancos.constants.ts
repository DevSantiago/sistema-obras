// src/modules/beneficiarios/bancos.constants.ts

export const BANCOS_COLOMBIA = [
  "BANCOLOMBIA",
  "NEQUI",
  "BANCO DE BOGOTA",
  "DAVIVIENDA",
  "DAVIPLATA",
  "BBVA",
  "BANCO DE OCCIDENTE",
  "BANCO POPULAR",
  "BANCO AV VILLAS",
  "BANCO CAJA SOCIAL",
  "BANCO AGRARIO",
  "SCOTIABANK COLPATRIA",
  "BANCO GNB SUDAMERIS",
  "BANCO PICHINCHA",
  "BANCO FALABELLA",
  "BANCOOMEVA",
  "ITAU",
  "LULO BANK",
  "NU",
] as const;

export type BancoColombia = (typeof BANCOS_COLOMBIA)[number];

export function esBancoValido(banco: string) {
  return BANCOS_COLOMBIA.includes(banco as BancoColombia);
}