# AGENT.md

# Sistema Obras

Este documento contiene las reglas de ingeniería obligatorias para cualquier agente (Codex, ChatGPT, Claude, Cursor, Copilot, etc.) que contribuya a este repositorio.

Estas reglas prevalecen sobre cualquier preferencia implícita del agente.

---

# Objetivo del proyecto

Este proyecto implementa un sistema de gestión de solicitudes de pago para proyectos de obra e interventoría.

La documentación ubicada en la raíz del proyecto constituye la fuente oficial de verdad para:

- reglas de negocio;
- arquitectura;
- modelo de datos;
- contratos API;
- backlog;
- seguridad;
- estados;
- permisos.

Nunca implementes funcionalidad que contradiga la documentación.

---

# Arquitectura

Mantener estrictamente la arquitectura existente.

No introducir nuevas arquitecturas.

No cambiar patrones ya utilizados.

No mover archivos salvo que sea estrictamente necesario.

---

# Filosofía del proyecto

La prioridad es:

1. estabilidad;
2. consistencia;
3. mantenibilidad.

No buscar "mejores formas" si la solución existente ya sigue el patrón del proyecto.

La consistencia tiene prioridad sobre preferencias personales.

---

# Regla más importante

Antes de escribir código:

1. busca cómo está implementado el mismo patrón en otro módulo;
2. reutiliza ese patrón;
3. mantén el mismo estilo.

Nunca reinventes una solución ya existente.

---

# Modificaciones

Realizar siempre el cambio mínimo necesario.

No reescribir archivos completos.

No reorganizar imports si no es necesario.

No cambiar formato únicamente por estilo.

No modificar código no relacionado con la historia de usuario.

---

# Refactorización

No realizar refactors durante el desarrollo de una HU.

No:

- renombrar funciones;
- mover clases;
- cambiar nombres de variables;
- dividir componentes;
- cambiar arquitectura;
- optimizar código existente.

Salvo que la historia de usuario lo requiera explícitamente.

---

# Compatibilidad

Todo cambio debe ser compatible con:

- frontend existente;
- backend existente;
- API existente;
- Prisma;
- migraciones existentes.

Nunca romper compatibilidad.

---

# Prisma

Nunca modificar modelos Prisma sin que la historia de usuario lo requiera.

Nunca eliminar columnas.

Nunca cambiar nombres de columnas existentes.

Nunca modificar migraciones antiguas.

Crear siempre migraciones nuevas.

---

# API

No romper contratos.

Mantener:

- nombres de endpoints;
- payloads;
- respuestas;
- códigos HTTP.

---

# Frontend

Seguir siempre los componentes existentes.

Si un formulario ya implementa un patrón, reutilizar exactamente el mismo patrón.

Ejemplos:

- edición de proveedores;
- edición de nómina individual.

Los nuevos formularios deben seguir el mismo comportamiento.

---

# Backend

Antes de crear un servicio nuevo:

1. revisar si existe uno equivalente;
2. reutilizar helpers existentes;
3. mantener las validaciones actuales.

Evitar duplicación.

---

# Estado de las solicitudes

Nunca cambiar la máquina de estados.

Toda transición debe respetar la documentación.

---

# Permisos

Nunca omitir validaciones de permisos.

Toda operación debe respetar los permisos definidos.

---

# Base de datos

Mantener:

- nombres;
- relaciones;
- índices;
- convenciones.

No introducir tablas nuevas sin respaldo documental.

---

# Código

Seguir exactamente el estilo existente.

No mezclar estilos.

No introducir nuevos patrones de nomenclatura.

---

# Imports

No reorganizar imports únicamente por estilo.

No cambiar alias existentes.

---

# Tipado

Preferir reutilizar tipos existentes.

No crear tipos duplicados.

---

# Errores

Mantener el mismo estilo de manejo de errores.

No introducir nuevos formatos de respuesta.

---

# Logs

No dejar console.log.

Eliminar cualquier código temporal antes de finalizar.

---

# Dependencias

No instalar nuevas librerías salvo autorización explícita.

---

# Build

Todo cambio debe terminar con:

```
npm run build
```

El build debe finalizar sin errores.

---

# Pruebas

No romper pruebas existentes.

Si una historia modifica comportamiento, actualizar o crear pruebas correspondientes.

---

# Documentación

Si una historia modifica:

- reglas de negocio;
- modelo de datos;
- arquitectura;
- endpoints;
- permisos;
- estados;

actualizar la documentación correspondiente.

---

# Qué NO hacer

Nunca:

- reescribir archivos completos;
- cambiar arquitectura;
- cambiar nombres públicos;
- introducir refactors innecesarios;
- cambiar comportamiento no relacionado;
- optimizar código sin requerimiento.

---

# Qué hacer

Siempre:

- reutilizar patrones existentes;
- modificar únicamente el bloque necesario;
- mantener consistencia;
- mantener compatibilidad;
- validar con build.

---

# Regla final

Cuando existan varias formas técnicamente válidas de implementar algo:

Elegir siempre la que sea más consistente con el código existente, aunque no sea la más moderna o la más elegante.