#!/usr/bin/env python3
"""Claude Code PreToolUse hook: keeps a client session inside its own client folder.

Installed per client in clients/<slug>/.claude/settings.json as
    python3 "$CLAUDE_PROJECT_DIR/../_guard.py" <slug>
Blocks (exit 2, reason on stderr) any tool call that names a path inside clients/ other than
clients/<slug>/, clients/_template/ or the shared files directly in clients/ (README.md, _guard.py),
and any search or listing of clients/ itself (which would sweep every client).
Fluid's shared brain (brain/, knowledge/, scripts/) stays readable.
"""
import json, os, re, sys

slug = sys.argv[1]
CLIENTS = os.path.dirname(os.path.abspath(__file__))
ALLOWED = [os.path.join(CLIENTS, slug), os.path.join(CLIENTS, "_template")]
SHARED_FILES = {os.path.join(CLIENTS, f) for f in ("README.md", "_guard.py")}

data = json.load(sys.stdin)
tool = data.get("tool_name", "")
cwd = data.get("cwd") or os.getcwd()
ti = data.get("tool_input", {}) or {}

# Every string in the tool input is a candidate; split commands into path-like tokens.
texts = []
def walk(v):
    if isinstance(v, str): texts.append(v)
    elif isinstance(v, dict): [walk(x) for x in v.values()]
    elif isinstance(v, list): [walk(x) for x in v]
walk(ti)
tokens = set()
for t in texts:
    for tok in re.split(r"[\s'\"=:;,(){}<>|&]+", t):
        if tok and ("/" in tok or tok in (".", "..") or tok.startswith("~")):
            tokens.add(tok)
for key in ("file_path", "path", "notebook_path"):
    if isinstance(ti.get(key), str): tokens.add(ti[key])
if tool in ("Glob", "Grep") and not ti.get("path"): tokens.add(cwd)

def inside(p, root): return p == root or p.startswith(root + os.sep)

for tok in tokens:
    p = os.path.abspath(os.path.join(cwd, os.path.expanduser(tok.rstrip("*").rstrip("/") or tok)))
    if not inside(p, CLIENTS): continue
    if p in SHARED_FILES or any(inside(p, a) for a in ALLOWED): continue
    what = "every client's folder" if p == CLIENTS else "another client's folder"
    print(f"Blocked: this is a {slug} session; {tool} would touch {what}. "
          f"Client work stays inside clients/{slug}/. Use Fluid's shared brain (brain/, knowledge/) "
          f"or the reference library for anything general.", file=sys.stderr)
    sys.exit(2)
sys.exit(0)
