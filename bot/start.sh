#!/usr/bin/env bash
# Server start: fresh clone of the repo (code + client folders) so the bot always works on the latest,
# then run the bot from it with the image's node_modules. Needs GITHUB_TOKEN and GITHUB_REPO (owner/name).
set -euo pipefail
REPO_DIR=/data/repo
URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
rm -rf "$REPO_DIR" && mkdir -p /data
git clone --quiet --depth 50 "$URL" "$REPO_DIR"
git -C "$REPO_DIR" config user.name "Fluid bot"
git -C "$REPO_DIR" config user.email "bot@users.noreply.github.com"
ln -sfn /app/node_modules "$REPO_DIR/node_modules"
cd "$REPO_DIR"
exec npx tsx bot/index.ts
