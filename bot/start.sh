#!/usr/bin/env bash
# Server start: fresh clone of the repo (code + client folders) so the bot always works on the latest,
# then run the bot from it with the image's node_modules. Needs GITHUB_TOKEN and GITHUB_REPO (owner/name).
# The token is handed to git through a credential helper that reads the environment, so it never appears
# in a URL, in .git/config, or in error messages and logs.
set -euo pipefail

clean() { printf '%s' "$1" | tr -d '[:space:]'; }
TOKEN="$(clean "${GITHUB_TOKEN:-}")"
REPO="$(clean "${GITHUB_REPO:-}")"
REPO="${REPO#https://github.com/}"; REPO="${REPO#github.com/}"; REPO="${REPO%.git}"; REPO="${REPO%/}"
if [ -z "$TOKEN" ] || [ -z "$REPO" ]; then echo "Missing GITHUB_TOKEN or GITHUB_REPO (expected owner/name, e.g. meelad-fluid/Fluid-Email-Marketing-Agent)"; exit 1; fi
export GITHUB_TOKEN="$TOKEN"

HELPER='!f() { echo username=x-access-token; echo "password=${GITHUB_TOKEN}"; }; f'
REPO_DIR=/data/repo
rm -rf "$REPO_DIR" && mkdir -p /data
echo "Cloning ${REPO}…"
git -c credential.helper= -c "credential.helper=${HELPER}" clone --quiet --depth 50 "https://github.com/${REPO}.git" "$REPO_DIR"
git -C "$REPO_DIR" config credential.helper ""
git -C "$REPO_DIR" config --add credential.helper "${HELPER}"
git -C "$REPO_DIR" config user.name "Fluid bot"
git -C "$REPO_DIR" config user.email "bot@users.noreply.github.com"
ln -sfn /app/node_modules "$REPO_DIR/node_modules"
cd "$REPO_DIR"
exec npx tsx bot/index.ts
