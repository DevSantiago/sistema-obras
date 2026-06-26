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