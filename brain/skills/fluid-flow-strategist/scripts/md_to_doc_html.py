#!/usr/bin/env python3
"""Convert a flow-strategy markdown file into HTML that Google Drive imports
as a cleanly formatted Google Doc.

Usage:
    python md_to_doc_html.py strategy.md -o strategy.html

Supports the subset the strategy docs use: # to #### headings, paragraphs,
**bold**, *italic*, `code`, [links](url), bullets (nested by indentation),
numbered lists, pipe tables and --- rules. No dependencies.

After converting, it prints what it found (flows, emails, SMS) so you can check
the counts against the approved plan before uploading.
"""
import argparse
import html
import re
import sys

INLINE_CODE = re.compile(r"`([^`]+)`")
LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
BOLD = re.compile(r"\*\*(.+?)\*\*")
ITALIC = re.compile(r"(?<![\*\w])\*(?!\s)(.+?)(?<!\s)\*(?![\*\w])")
LIST_ITEM = re.compile(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$")
TABLE_SEP = re.compile(r"^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$")

STYLE = (
    "body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;}"
    "h1{font-size:22pt;}h2{font-size:16pt;margin-top:20pt;}"
    "h3{font-size:13pt;margin-top:14pt;}h4{font-size:11.5pt;margin-top:10pt;}"
    "table{border-collapse:collapse;}td,th{border:1px solid #999;padding:4pt 6pt;"
    "vertical-align:top;}th{background:#efefef;}"
)


def inline(text):
    """Escape HTML, then apply inline markdown."""
    codes = []

    def keep_code(m):
        codes.append(html.escape(m.group(1)))
        return f"\x00{len(codes) - 1}\x00"

    text = INLINE_CODE.sub(keep_code, text)
    text = html.escape(text, quote=False)
    text = LINK.sub(lambda m: f'<a href="{html.escape(m.group(2))}">{m.group(1)}</a>', text)
    text = BOLD.sub(r"<b>\1</b>", text)
    text = ITALIC.sub(r"<i>\1</i>", text)
    text = re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{codes[int(m.group(1))]}</code>", text)
    return text


def split_row(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [c.strip() for c in line.split("|")]


def render_list(lines):
    """Render consecutive list lines (nested by indentation) to HTML."""
    items = []  # [indent, tag, text]
    for raw in lines:
        m = LIST_ITEM.match(raw)
        if m:
            indent = len(m.group(1).replace("\t", "    "))
            tag = "ol" if m.group(2)[0].isdigit() else "ul"
            items.append([indent, tag, m.group(3).strip()])
        elif items:  # continuation of the previous item
            items[-1][2] += " " + raw.strip()

    out = []

    def build(start, indent):
        """Render items[start:] at this indent; return the index where it stopped."""
        tag = items[start][1]
        out.append(f"<{tag}>")
        i = start
        while i < len(items) and items[i][0] >= indent:
            if items[i][0] > indent:  # deeper: nest inside the item just written
                out[-1] = out[-1][: -len("</li>")]
                i = build(i, items[i][0])
                out.append("</li>")
                continue
            out.append(f"<li>{inline(items[i][2])}</li>")
            i += 1
        out.append(f"</{tag}>")
        return i

    i = 0
    while i < len(items):
        i = build(i, items[i][0])
    return "\n".join(out)


def convert(md_text):
    lines = md_text.splitlines()
    body = []
    i = 0
    para = []

    def flush_para():
        if para:
            body.append("<p>" + "<br>".join(inline(p) for p in para) + "</p>")
            para.clear()

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            flush_para()
            i += 1
            continue

        if stripped.startswith("```"):
            flush_para()
            i += 1
            block = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                block.append(html.escape(lines[i]))
                i += 1
            i += 1
            body.append("<pre>" + "\n".join(block) + "</pre>")
            continue

        h = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if h:
            flush_para()
            level = len(h.group(1))
            body.append(f"<h{level}>{inline(h.group(2).strip())}</h{level}>")
            i += 1
            continue

        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", stripped):
            flush_para()
            body.append("<hr>")
            i += 1
            continue

        if "|" in stripped and i + 1 < len(lines) and TABLE_SEP.match(lines[i + 1]):
            flush_para()
            header = split_row(stripped)
            i += 2
            rows = []
            while i < len(lines) and "|" in lines[i] and lines[i].strip():
                rows.append(split_row(lines[i]))
                i += 1
            t = ["<table>", "<tr>" + "".join(f"<th>{inline(c)}</th>" for c in header) + "</tr>"]
            for r in rows:
                r = r + [""] * (len(header) - len(r))
                t.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r[: len(header)]) + "</tr>")
            t.append("</table>")
            body.append("\n".join(t))
            continue

        if LIST_ITEM.match(line):
            flush_para()
            block = []
            while i < len(lines) and lines[i].strip():
                if LIST_ITEM.match(lines[i]) or lines[i].startswith((" ", "\t")):
                    block.append(lines[i])
                    i += 1
                else:
                    break
            body.append(render_list(block))
            continue

        para.append(stripped)
        i += 1

    flush_para()
    title_match = re.search(r"<h1>(.*?)</h1>", "\n".join(body))
    title = re.sub(r"<[^>]+>", "", title_match.group(1)) if title_match else "Email Flow Strategy"
    return (
        "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
        f"<title>{title}</title><style>{STYLE}</style></head><body>\n"
        + "\n".join(body)
        + "\n</body></html>\n"
    )


def summarize(md_text):
    """Count emails and SMS under each '## <Name> Flow (N Emails + N SMS)' heading.

    House counting: every email written in a flow counts, including the v2/v3
    versions of Welcome Email #1, so a Welcome flow is '7 Emails'.
    """
    flows, current = [], None
    for line in md_text.splitlines():
        s = line.strip()
        if s.startswith("## "):
            name = s[3:].strip()
            if re.search(r"(?i)flow\s*\(", name):
                stated_e = re.search(r"(?i)(\d+)\s*emails?", name)
                stated_s = re.search(r"(?i)(\d+)\s*(?:conditional\s+)?sms", name)
                current = [name, 0, 0,
                           int(stated_e.group(1)) if stated_e else None,
                           int(stated_s.group(1)) if stated_s else None]
                flows.append(current)
            else:
                current = None
        elif current and s.startswith(("### ", "#### ")):
            title = s.lstrip("#").strip()
            if re.match(r"(?i)email\s*#", title):
                current[1] += 1
            elif re.match(r"(?i)(conditional\s+)?sms", title):
                current[2] += 1
    return flows


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("markdown", help="strategy markdown file")
    ap.add_argument("-o", "--output", help="HTML output path (default: alongside the input)")
    args = ap.parse_args()

    with open(args.markdown, encoding="utf-8") as f:
        md_text = f.read()
    out_path = args.output or re.sub(r"\.md$", "", args.markdown) + ".html"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(convert(md_text))

    flows = summarize(md_text)
    print(f"Wrote {out_path}")
    emails = sum(f[1] for f in flows)
    sms = sum(f[2] for f in flows)
    print(f"Found {len(flows)} flows, {emails} emails, {sms} SMS:")
    problems = 0
    for name, e, s, stated_e, stated_s in flows:
        flag = ""
        if (stated_e is not None and e != stated_e) or (stated_s is not None and s != stated_s):
            said = f"{stated_e} emails" + (f" + {stated_s} SMS" if stated_s is not None else "")
            flag = f"   <-- heading says {said}"
            problems += 1
        print(f"  - {name}: {e} emails, {s} SMS{flag}")
    if not flows:
        print("No '## <Name> Flow (N Emails)' headings found: check the heading levels.", file=sys.stderr)
    if problems:
        print(f"{problems} flow(s) don't match their heading counts. Fix before uploading.", file=sys.stderr)


if __name__ == "__main__":
    main()
