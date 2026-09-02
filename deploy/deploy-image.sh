#!/usr/bin/env bash

set -Eeuo pipefail

if [[ $# -ne 3 ]]; then
  echo "Uso: $0 <staging|production> <imagen> <archivo-imagen>" >&2
  exit 64
fi

environment_name="$1"
image_ref="$2"
image_archive="$3"
project_dir="/opt/sistema-obras/app"
compose_file="$project_dir/docker-compose.vps.yml"

case "$environment_name" in
  staging)
    service_name="app-stg"
    image_variable="STG_IMAGE"
    compose_profile=()
    ;;
  production)
    service_name="app-prod"
    image_variable="PROD_IMAGE"
    compose_profile=(--profile production)
    ;;
  *)
    echo "Ambiente no soportado: $environment_name" >&2
    exit 64
    ;;
esac

cleanup() {
  rm -f "$image_archive"
}
trap cleanup EXIT

cd "$project_dir"

current_container="$(docker compose -f "$compose_file" "${compose_profile[@]}" ps -q "$service_name")"
previous_image=""
if [[ -n "$current_container" ]]; then
  previous_image="$(docker inspect --format '{{.Config.Image}}' "$current_container")"
fi

docker load --input "$image_archive"

env "$image_variable=$image_ref" \
  docker compose -f "$compose_file" "${compose_profile[@]}" \
  run --rm --no-deps "$service_name" npx prisma migrate deploy

env "$image_variable=$image_ref" \
  docker compose -f "$compose_file" "${compose_profile[@]}" \
  up -d --no-deps "$service_name"

new_container="$(env "$image_variable=$image_ref" docker compose -f "$compose_file" "${compose_profile[@]}" ps -q "$service_name")"

for attempt in {1..18}; do
  health_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$new_container")"

  if [[ "$health_status" == "healthy" ]]; then
    docker image prune -f >/dev/null
    echo "Despliegue de $environment_name completado con la imagen $image_ref"
    exit 0
  fi

  if [[ "$health_status" == "unhealthy" || "$health_status" == "exited" || "$health_status" == "dead" ]]; then
    break
  fi

  sleep 5
done

echo "La imagen $image_ref no alcanzó un estado saludable." >&2

if [[ -n "$previous_image" ]]; then
  echo "Restaurando la imagen anterior $previous_image." >&2
  env "$image_variable=$previous_image" \
    docker compose -f "$compose_file" "${compose_profile[@]}" \
    up -d --no-deps "$service_name"
fi

exit 1
