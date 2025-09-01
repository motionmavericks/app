#!/usr/bin/env bash
set -euo pipefail

# Provision a DigitalOcean GPU Droplet for the preview worker.
# Requires: doctl authenticated (doctl auth init)
# Default: region tor1, size gpu-l40sx1-48gb, image NVIDIA AI/ML Ready (Ubuntu)

REGION="${REGION:-tor1}"
SIZE="${SIZE:-gpu-l40sx1-48gb}"
NAME="${NAME:-mm-gpu-worker-1}"
IMAGE_ID="${IMAGE_ID:-191457505}"
SSH_KEYS_FLAG="${SSH_KEYS_FLAG:-}"   # e.g., --ssh-keys <fingerprint>
RESERVED_IP="${RESERVED_IP:-}"

echo "Creating GPU droplet: name=$NAME region=$REGION size=$SIZE image_id=$IMAGE_ID" >&2

USER_DATA=$(cat <<'CLOUD'
#cloud-config
package_update: true
package_upgrade: true
packages:
  - curl
  - git
  - ffmpeg
  - docker.io
write_files:
  - path: /etc/systemd/system/preview-worker.service
    content: |
      [Unit]
      Description=Preview Worker (Node)
      After=network-online.target

      [Service]
      Type=simple
      WorkingDirectory=/opt/preview-worker
      EnvironmentFile=/opt/preview-worker/.env
      ExecStart=/usr/bin/node /opt/preview-worker/dist/worker.js
      Restart=always
      RestartSec=3

      [Install]
      WantedBy=multi-user.target
runcmd:
  - |
    set -e
    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    # Fetch repo (expects public access or adjust as needed)
    mkdir -p /opt && cd /opt
    if [ ! -d preview-worker ]; then
      git clone https://github.com/your-org/your-repo.git preview-worker || true
    fi
    cd preview-worker/worker
    npm ci --legacy-peer-deps
    npm run build
    systemctl daemon-reload
    systemctl enable preview-worker
    systemctl start preview-worker
CLOUD
)

ID=$(doctl compute droplet create "$NAME" \
      --size "$SIZE" \
      --region "$REGION" \
      --image "$IMAGE_ID" \
      --tag-names gpu,preview,worker \
      --user-data "$USER_DATA" \
      ${SSH_KEYS_FLAG} \
      --format ID --no-header)

echo "Created Droplet ID=$ID" >&2

# Wait for active
echo "Waiting for droplet to become active..." >&2
for i in {1..60}; do
  STATUS=$(doctl compute droplet get "$ID" --no-header --format Status || true)
  if [ "$STATUS" = "active" ]; then break; fi
  sleep 5
done

if [ -n "$RESERVED_IP" ]; then
  echo "Assigning reserved IP $RESERVED_IP to droplet $ID" >&2
  doctl compute reserved-ip-action assign "$RESERVED_IP" "$ID" || true
fi

echo "Done. Droplet $ID ready. IPs:" >&2
doctl compute droplet get "$ID" --format ID,Name,PublicIPv4,PrivateIPv4,Region,Status
