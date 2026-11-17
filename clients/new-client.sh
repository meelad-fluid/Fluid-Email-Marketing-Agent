#!/bin/bash
# Creates clients/<slug>/ from _template (or adds the isolation guard to an existing client).
# Usage: clients/new-client.sh <slug> "<Client Name>"
set -euo pipefail
slug="$1"; name="${2:-$1}"
[[ "$slug" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "slug must be lowercase letters, digits, dashes"; exit 1; }
dir="$(cd "$(dirname "$0")" && pwd)/$slug"
if [ ! -d "$dir" ]; then
  cp -R "$(dirname "$0")/_template" "$dir"
  sed -i '' "s/<Client>/$name/g" "$dir/README.md" "$dir/memory.md"
fi
mkdir -p "$dir/.claude"
cat > "$dir/.claude/settings.json" <<EOF
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read|Edit|Write|MultiEdit|NotebookEdit|Glob|Grep|Bash",
        "hooks": [{ "type": "command", "command": "python3 \"\$CLAUDE_PROJECT_DIR/../_guard.py\" $slug" }]
      }
    ]
  }
}
EOF
cat > "$dir/CLAUDE.md" <<EOF
# $name — client workspace

This session works for **$name only**.

- Read \`memory.md\` before anything else; append to it (dated) before finishing any task.
- Everything you make goes in this folder (copy/, designs/, strategy/, research/, brand/).
- Other clients' folders are blocked by a hook. Never bring another brand's copy, claims, product names, images, results or data into $name's work.
- Fluid's shared brain is available: ../../brain/ (skills, flow system), ../../knowledge/ (SOPs). The reference library may be used for layout and structure only (see ../../knowledge/reference-library.md).
- Reporting and data: only $name's Klaviyo / Shopify / Hiro account, resolved by its own id.
- Before handing anything over, run: npx tsx ../../scripts/check-client-leaks.ts $slug <file>
EOF
echo "Ready: $dir (open Claude Code in this folder to work on $name)"
