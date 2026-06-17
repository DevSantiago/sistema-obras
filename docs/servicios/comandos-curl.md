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


