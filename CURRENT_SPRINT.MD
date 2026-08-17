# CURRENT_SPRINT.md

## Objetivo

Preparar la base técnica para desplegar el sistema en un VPS de Hostinger con
ambientes aislados de staging y producción, PostgreSQL en el VPS y adjuntos en
Amazon S3.

---

## Alcance autorizado

Implementar únicamente la preparación de despliegue necesaria antes de iniciar
la Épica 19:

- contenedores para aplicación, PostgreSQL y proxy HTTPS;
- configuración separada para staging y producción;
- almacenamiento de adjuntos mediante Amazon S3;
- respaldo de PostgreSQL hacia S3;
- endpoints de salud y documentación operativa.

---

## Base funcional cerrada

- Épica 8 cerrada y fusionada en `dev`.
- HU-0804, HU-0807, HU-0808 y HU-0809 terminadas y probadas.
- `dev` constituye la base para preparar el despliegue.

---

## Orden obligatorio

1. Configurar Amazon S3 como proveedor de adjuntos.
2. Preparar contenedores y variables para staging y producción.
3. Preparar proxy HTTPS, PostgreSQL y respaldos hacia S3.
4. Ejecutar pruebas y `npm run build`.
5. Desplegar staging en el VPS y validar persistencia, archivos y HTTPS.
6. Iniciar la Épica 19 usando el webhook público de staging.

---

## Decisiones de infraestructura

- Desarrollo: ejecución local, fuera del VPS.
- Staging y producción: aplicaciones y bases de datos lógicamente aisladas.
- Base de datos: PostgreSQL persistente dentro del VPS, sin exposición pública.
- Adjuntos: buckets S3 separados por ambiente.
- Respaldos: bucket S3 independiente con política de retención.
- Entrada web: dominios separados con HTTPS automático.

---

## Fuera de alcance

No implementar todavía el envío de mensajes de WhatsApp ni el webhook de Meta.
La Épica 19 queda documentada y se inicia después de publicar staging con HTTPS.
No modificar la máquina de estados ni el comportamiento funcional existente.

---

## Criterio de finalización

La preparación queda lista para pasar al VPS cuando:

- el proveedor S3 tenga pruebas automatizadas;
- existan plantillas de variables sin secretos;
- la aplicación compile correctamente (`npm run build`);
- las pruebas existentes y nuevas continúen pasando;
- la configuración de despliegue y recuperación esté documentada.
