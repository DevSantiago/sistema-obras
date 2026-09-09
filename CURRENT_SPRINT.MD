# CURRENT_SPRINT.md

## Objetivo

Iniciar la Épica 21 homologando la navegación y los fundamentos responsivos del
sistema para móvil, tableta y escritorio.

---

## Alcance autorizado

Implementar HU-2101:

- mostrar la ruta activa en el menú;
- separar navegación y acciones de cuenta;
- conservar el desplazamiento interno del menú móvil;
- respetar áreas seguras y alto dinámico del dispositivo;
- homologar controles táctiles principales.

---

## Base funcional cerrada

- Épicas anteriores promovidas y operativas en producción.
- Aplicación web instalable y notificaciones Push validadas en iOS y Android.
- Auditoría responsiva inicial completada sobre navegación, tablas, formularios
  y modales.

---

## Historias del sprint

### HU-2101. Homologar navegación y fundamentos responsivos

- Identifica visual y semánticamente la ruta activa.
- Diferencia navegación de acciones de cuenta.
- Mantiene controles táctiles de tamaño adecuado.
- Conserva el scroll interno y respeta áreas seguras móviles.

---

## Orden obligatorio

1. Homologar navegación y fundamentos responsivos.
2. Adaptar tablas operativas y de resumen.
3. Homologar formularios, selectores y modales.
4. Reducir sobrecarga de opciones por contexto.
5. Validar en iPhone, Android, tableta y escritorio.

---

## Fuera de alcance

- No modificar reglas de negocio, permisos ni máquina de estados.
- No cambiar contratos de API ni modelos de base de datos.
- No introducir una nueva arquitectura o librerías de interfaz.

---

## Criterio de finalización

- El menú comunica la ubicación actual y mantiene operación táctil correcta.
- El contenido del menú puede recorrerse sin desplazar la página subyacente.
- Las áreas seguras móviles no ocultan controles.
- Las pruebas y `npm run build` finalizan sin errores.
