#!/usr/bin/env bash

set -Eeuo pipefail

cd /opt/sistema-obras/app

docker compose -p app -f docker-compose.vps.yml --profile production exec -T app-prod \
  node -e "fetch('http://127.0.0.1:3000/api/v1/push/notificaciones/procesar',{method:'POST',headers:{authorization:'Bearer '+process.env.PUSH_PROCESSOR_TOKEN}}).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
