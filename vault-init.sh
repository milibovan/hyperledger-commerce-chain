#!/usr/bin/env bash
#
# vault-init.sh
# Initializes a local Vault dev/local instance with 1-of-1 Shamir key
# (simplest for local use — no threshold juggling), saves the unseal
# key + root token to a gitignored file, and unseals it.
#
# Safe to re-run: if Vault is already initialized, it will just try
# to unseal using the saved key file.

set -euo pipefail

CONTAINER_NAME="vault"
KEYS_FILE="./vault-keys.json"
VAULT_ADDR="http://127.0.0.1:8200"

export VAULT_ADDR

echo "==> Checking Vault status..."
STATUS_JSON=$(docker exec "$CONTAINER_NAME" vault status -format=json 2>/dev/null || true)

if [ -z "$STATUS_JSON" ]; then
  echo "!! Could not reach Vault in container '$CONTAINER_NAME'. Is it running?"
  exit 1
fi

INITIALIZED=$(echo "$STATUS_JSON" | grep -o '"initialized": *[a-z]*' | grep -o '[a-z]*$')
SEALED=$(echo "$STATUS_JSON" | grep -o '"sealed": *[a-z]*' | grep -o '[a-z]*$')

if [ "$INITIALIZED" != "true" ]; then
  echo "==> Vault is not initialized. Initializing with 1 key share / threshold 1..."
  docker exec "$CONTAINER_NAME" vault operator init \
    -key-shares=1 \
    -key-threshold=1 \
    -format=json > "$KEYS_FILE"

  chmod 600 "$KEYS_FILE"
  echo "==> Saved unseal key + root token to $KEYS_FILE (chmod 600)."
  echo "    Make sure this file is in .gitignore!"
else
  echo "==> Vault already initialized."
  if [ ! -f "$KEYS_FILE" ]; then
    echo "!! Vault is initialized but $KEYS_FILE is missing."
    echo "   Cannot auto-unseal without the original key. You'll need to"
    echo "   recover the key another way or wipe ./vault-data and re-init."
    exit 1
  fi
fi

if [ "$SEALED" == "true" ] || [ "$INITIALIZED" != "true" ]; then
  echo "==> Unsealing Vault..."
  UNSEAL_KEY=$(grep -o '"unseal_keys_b64": *\[[^]]*\]' "$KEYS_FILE" | grep -o '"[A-Za-z0-9+/=]*"' | tail -1 | tr -d '"')
  docker exec "$CONTAINER_NAME" vault operator unseal "$UNSEAL_KEY" > /dev/null
  echo "==> Vault unsealed."
else
  echo "==> Vault is already unsealed."
fi

ROOT_TOKEN=$(grep -o '"root_token": *"[^"]*"' "$KEYS_FILE" | grep -o '"[^"]*"$' | tr -d '"')
echo ""
echo "==> Vault is ready at $VAULT_ADDR"
echo "    Root token: $ROOT_TOKEN"
echo "    (also saved in $KEYS_FILE)"