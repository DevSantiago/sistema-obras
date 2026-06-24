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

url -X POST "http://localhost:3000/api/v1/proyectos-base" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=eyJhbGciOiJIUzI1NiJ9.eyJ1c3VhcmlvSWQiOiIzM2JjOGNhNS04MjE5LTRhMjItYTkzMS1kOTFjMWMyOWJkNTQiLCJjb3JyZW8iOiJhZG1pbkBzaXN0ZW1hLW9icmFzLmxvY2FsIiwicm9sZXMiOlsiQURNSU5JU1RSQURPUiJdLCJpYXQiOjE3ODIyNDUxOTksImV4cCI6MTc4MjI3Mzk5OX0.pLMoLhqpXW0G-kh6pT1V5vXKjO91D_DCvbfc-9tEi2k" \
  -d '{
    "nombre": "Construcción sede administrativa",
    "descripcion": "Proyecto de prueba para HU-0301",
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
  }'

## Listar todos los centros de costo

curl -X GET "http://localhost:3000/api/v1/proyectos-base" \
  -H "Cookie: session_token=$SESSION_TOKEN"

## Consultar por ID

curl -X GET "http://localhost:3000/api/v1/proyectos-base/3bab98c0-2001-4b8c-93b0-7a9af1eeb4ed" \
  -H "Cookie: session_token=$SESSION_TOKEN"

## Consultar con estado EN_LICITACION

curl -X GET "http://localhost:3000/api/v1/proyectos-base?estado_proyecto=EN_LICITACION" \
  -H "Cookie: session_token=$SESSION_TOKEN"

## ## Consultar con estado TRUE

curl -X GET "http://localhost:3000/api/v1/proyectos-base?activo=true" \
  -H "Cookie: session_token=$SESSION_TOKEN"