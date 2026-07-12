## Inciar Sesión

curl -i -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "admin@sistema-obras.local",
    "password": "Admin123*"
  }'

## Validar inicio de sesión
curl -i -b cookies.txt http://localhost:3000/api/v1/auth/me  

## Listar Usuarios (funcion GET)
curl -i -b cookies.txt http://localhost:3000/api/v1/usuarios

## Crear usuario

curl -i -b cookies.txt -X POST http://localhost:3000/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Usuario Prueba",
    "correo": "usuario.prueba@sistema-obras.local",
    "telefono": "3001234567",
    "password": "Usuario123*",
    "estado": "ACTIVO"
  }'

## Consultar usuario por id

curl -i -b cookies.txt http://localhost:3000/api/v1/usuarios/74a243a1-7d23-42a4-a7b1-7820da923d63

## Editar usuario por id y pasando los campos que se quieren cambiar (contraseña no se edita acá)

curl -i -b cookies.txt -X PATCH http://localhost:3000/api/v1/usuarios/ID_DEL_USUARIO \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Usuario Prueba Actualizado",
    "correo": "usuario.actualizado@sistema-obras.local",
    "telefono": "3009876543"
  }'


## Crear Centro de Costo

export PROYECTO_ID="b3349e0d-edc8-4f79-9aa7-2663efba6344"
export PRO_INT_ID="0e9d8975-1479-41ed-aabf-4888975d1bff"
export PRO_OBRA_ID="7471d2a4-c28d-4b83-bff2-1bc50a6e382c"
export OBRA_ID="58abdf5e-6f4c-4f9f-9a57-9a62edb33501"
export INT_ID="7e47d897-e46b-41ca-86b2-f08f053d0a8c"

  curl -s -X POST "$BASE_URL/api/v1/proyectos-base" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=$SESSION_TOKEN" \
  -d '{
    "nombre": "ESTADOS",
    "descripcion": "Prueba limpia de cambio de PRO a ejecución",
    "centros_costo": [
      {
        "linea_negocio": "OBRA",
        "fase_centro_costo": "LICITACION"
      },
      {
        "linea_negocio": "INTERVENTORIA",
        "fase_centro_costo": "LICITACION"
      }
    ]
  }' | python3 -m json.tool

## Listar todos los centros de costo

curl -X GET "http://localhost:3000/api/v1/proyectos-base" \
  -H "Cookie: session_token=$SESSION_TOKEN"

## Consultar por ID

curl -X GET "http://localhost:3000/api/v1/proyectos-base/3bab98c0-2001-4b8c-93b0-7a9af1eeb4ed" \
  -H "Cookie: session_token=$SESSION_TOKEN"

## Consultar con estado EN_LICITACION

curl -X GET "http://localhost:3000/api/v1/proyectos-base?estado_proyecto=EN_LICITACION" \
  -H "Cookie: session_token=$SESSION_TOKEN"

## Consultar con estado TRUE

curl -X GET "http://localhost:3000/api/v1/proyectos-base?activo=true" \
  -H "Cookie: session_token=$SESSION_TOKEN"

## Cambiar estado de centro de costo EN_LICITACION a EN_EJECUCION

curl -X PATCH "http://localhost:3000/api/v1/proyectos-base/1662a485-54df-4264-bfdf-c2c62befb053/centros-costo/055e53a2-36a0-41c2-bef8-4005ce73fb66/estado" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=eyJhbGciOiJIUzI1NiJ9.eyJ1c3VhcmlvSWQiOiIzM2JjOGNhNS04MjE5LTRhMjItYTkzMS1kOTFjMWMyOWJkNTQiLCJjb3JyZW8iOiJhZG1pbkBzaXN0ZW1hLW9icmFzLmxvY2FsIiwicm9sZXMiOlsiQURNSU5JU1RSQURPUiJdLCJpYXQiOjE3ODI0MDM3MzYsImV4cCI6MTc4MjQzMjUzNn0.9fqXh4hEHRl5s6jBe_qF3turWUdTWty7E5ODjq1NnwQ" \
  -d '{
    "estado_centro_costo": "EN_EJECUCION",
    "observacion": "Inicio de ejecución aprobado."
  }'

## Cambiar estado de centro de costo EN_EJECUCION a FINALIZADO

curl -X PATCH "http://localhost:3000/api/v1/proyectos-base/1662a485-54df-4264-bfdf-c2c62befb053/centros-costo/055e53a2-36a0-41c2-bef8-4005ce73fb66/estado" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=eyJhbGciOiJIUzI1NiJ9.eyJ1c3VhcmlvSWQiOiIzM2JjOGNhNS04MjE5LTRhMjItYTkzMS1kOTFjMWMyOWJkNTQiLCJjb3JyZW8iOiJhZG1pbkBzaXN0ZW1hLW9icmFzLmxvY2FsIiwicm9sZXMiOlsiQURNSU5JU1RSQURPUiJdLCJpYXQiOjE3ODI0MDM3MzYsImV4cCI6MTc4MjQzMjUzNn0.9fqXh4hEHRl5s6jBe_qF3turWUdTWty7E5ODjq1NnwQ" \
  -d '{
    "estado_centro_costo": "FINALIZADO",
    "observacion": "Centro de costo finalizado."
  }'


  ## Actualizar datos de contacto beneficiario

  curl -X PATCH "$BASE_URL/api/v1/beneficiarios/ab8584de-c13d-4bef-a888-d24c4846fba5" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=$SESSION_TOKEN" \
  -d '{
    "telefono": "3101234567",
    "correo": "beneficiario@correo.com",
    "notas": "Actualizado desde HU0402."
  }'

  ## Actualizar datos bancarios

  curl -X PATCH "$BASE_URL/api/v1/beneficiarios/ab8584de-c13d-4bef-a888-d24c4846fba5" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=$SESSION_TOKEN" \
  -d '{
    "medio_pago_preferido": "TRANSFERENCIA",
    "banco": "Bancolombia",
    "tipo_cuenta_bancaria": "AHORROS",
    "numero_cuenta_bancaria": "123456789"
  }'

  ## Inactivar beneficiario

  curl -X PATCH "$BASE_URL/api/v1/beneficiarios/ab8584de-c13d-4bef-a888-d24c4846fba5" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=$SESSION_TOKEN" \
  -d '{
    "activo": false
  }'

  ## Activar beneficiario

  curl -X PATCH "$BASE_URL/api/v1/beneficiarios/ab8584de-c13d-4bef-a888-d24c4846fba5" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=$SESSION_TOKEN" \
  -d '{
    "activo": true
  }'

  ## Crear solicitud de pago

  curl -X POST "$BASE_URL/api/v1/solicitudes-pago" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=$SESSION_TOKEN" \
  -d '{
    "proyecto_base_id": "6e5c471f-5871-40c6-a2a0-2c0bda04485e",
    "centro_costo_id": "61375bca-80b4-4766-892e-65c3968ed263",
    "beneficiario_id": "bd2b8c0b-0994-4773-9f12-b38eb4d0819e",
    "categoria_gasto": "MATERIALES",
    "medio_pago": "TRANSFERENCIA",
    "descripcion": "Pago de materiales para obra",
    "valor_bruto": 100000,
    "valor_impuestos": 19000,
    "valor_retenciones": 5000,
    "valor_descuentos": 0
  }'

  curl -i -X POST "http://localhost:3000/api/v1/solicitudes-pago" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=TU_SESSION_TOKEN" \
  --data-raw '{
    "tipo_solicitud": "PAGO_NOMINA",
    "modalidad_nomina": "INDIVIDUAL",
    "periodo_nomina": "2026-07",
    "proyecto_base_id": "6e5c471f-5871-40c6-a2a0-2c0bda04485e",
    "centro_costo_id": "11b8d22d-44e3-444a-acbd-4c597a295129",
    "beneficiario_id": "6318438f-f9b6-4dcf-9365-8472e59d0759",
    "concepto_nomina": "SALARIO",
    "medio_pago": "TRANSFERENCIA",
    "descripcion": "Pago de nómina individual correspondiente a julio de 2026",
    "valor_bruto": 2000000,
    "valor_retenciones": 200000,
    "valor_descuentos": 100000
  }'