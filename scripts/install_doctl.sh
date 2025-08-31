#!/usr/bin/env bash
set -euo pipefail

PLATFORM="linux-amd64"
TMPDIR=$(mktemp -d)
BIN_DIR="$(pwd)/bin"
mkdir -p "$BIN_DIR"

# Discover latest version
LATEST=$(curl -fsSL https://api.github.com/repos/digitalocean/doctl/releases/latest | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p')
if [[ -z "$LATEST" ]]; then
  echo "Failed to determine latest doctl release" >&2; exit 1
fi

TAR="doctl-${LATEST}-${PLATFORM}.tar.gz"
URL="https://github.com/digitalocean/doctl/releases/download/${LATEST}/${TAR}"
curl -fsSL "$URL" -o "$TMPDIR/$TAR"
tar -xzf "$TMPDIR/$TAR" -C "$TMPDIR"
install -m 0755 "$TMPDIR/doctl" "$BIN_DIR/doctl"
echo "Installed doctl ${LATEST} to $BIN_DIR/doctl"
echo "Add to PATH: export PATH=\"$BIN_DIR:\$PATH\""

