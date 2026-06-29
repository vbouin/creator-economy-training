#!/usr/bin/env python3
"""Build a single self-contained HTML export of the playbook (index.html).
FAITHFUL mode: CSS + JS + data + images + ALL videos inlined (base64) so the file
plays exactly like the site, fully offline, from one file. Gate disabled.
Output: Exoflow-Creator-economy-training.html
"""
import base64, re, pathlib

ROOT = pathlib.Path(__file__).parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
MIME = {"svg": "image/svg+xml", "png": "image/png", "jpg": "image/jpeg",
        "jpeg": "image/jpeg", "webp": "image/webp", "gif": "image/gif", "mp4": "video/mp4"}

def datauri(path):
    p = ROOT / path
    if not p.exists():
        return None
    ext = p.suffix.lstrip(".").lower()
    if ext not in MIME:
        return None
    return f"data:{MIME[ext]};base64," + base64.b64encode(p.read_bytes()).decode()

# 0) standalone CSP: allow inlined (base64) media + images
html = html.replace("media-src 'self'", "media-src 'self' data:")

# 1) gate off: remove head guard, force unlocked
html = re.sub(r'<script>try\{if\(localStorage\.getItem\("ce-access"\).*?</script>\n?', "", html)
html = html.replace('<meta charset="UTF-8">',
                    '<meta charset="UTF-8">\n<script>try{localStorage.setItem("ce-access","ok")}catch(e){}</script>', 1)

# 2) inline CSS
css = (ROOT / "assets/css/styles.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="assets/css/styles.css">', "<style>\n" + css + "\n</style>")

# 3) inline JS (order matters). Patch data-bundle (focus video filenames -> data URIs)
#    and app.js (focus <video> src/poster templates resolve to the inlined data).
def focus_to_datauri(m):
    key, fn = m.group(1), m.group(2)
    return f'"{key}":"{datauri("assets/video/" + fn) or ""}"'

for js in ["assets/js/data-bundle.js", "assets/js/i18n.js", "assets/js/dataviz.js", "assets/js/app.js"]:
    code = (ROOT / js).read_text(encoding="utf-8")
    if js.endswith("data-bundle.js"):
        code = re.sub(r'"(video2?)":"([^"]*\.mp4)"', focus_to_datauri, code)
    if js.endswith("app.js"):
        code = (code
                .replace('assets/video/${f.video}', '${f.video}')
                .replace('assets/video/${f.video2}', '${f.video2}')
                .replace('assets/img/${f.video.replace(".mp4", "-poster.jpg")}', '')
                .replace('assets/img/${f.video2.replace(".mp4", "-poster.jpg")}', ''))
    code = code.replace("</script>", "<\\/script>")
    html = html.replace(f'<script src="{js}"></script>', "<script>\n" + code + "\n</script>")

# 4) inline EVERY static <video>: base64 the mp4 (from src or <source>) + base64 poster
def repl_video(m):
    block = m.group(0)
    open_tag = re.match(r"<video[^>]*>", block).group(0)
    mp4 = re.search(r'src="(assets/video/[^"]+\.mp4)"', open_tag)
    if not mp4:
        mp4 = re.search(r'<source[^>]*src="(assets/video/[^"]+\.mp4)"', block)
    pm = re.search(r'poster="(assets/img/[^"]+)"', open_tag)
    if pm:
        puri = datauri(pm.group(1))
        if puri:
            open_tag = open_tag.replace(pm.group(1), puri)
    open_tag = re.sub(r'\ssrc="assets/video/[^"]*"', "", open_tag)
    open_tag = re.sub(r'\sonerror="[^"]*"', "", open_tag)
    if mp4:
        vuri = datauri(mp4.group(1))
        if vuri:
            open_tag = open_tag[:-1] + f' src="{vuri}">'
    return open_tag + "</video>"
html = re.sub(r"<video[^>]*>.*?</video>", repl_video, html, flags=re.S)

# 5) base64 every referenced image (img src + favicon hrefs)
html = re.sub(r'src="(assets/img/[^"]+)"', lambda m: f'src="{datauri(m.group(1)) or m.group(1)}"', html)
html = re.sub(r'href="(assets/img/[^"]+)"', lambda m: f'href="{datauri(m.group(1)) or m.group(1)}"', html)

# 6) neutralize cross-page tool links (no companion files in a standalone)
html = re.sub(r'href="(data|roi|lexique|ateliers)\.html(#[^"]*)?"', 'href="#" data-tool-page="1"', html)

out = ROOT / "Exoflow-Creator-economy-training.html"
out.write_text(html, encoding="utf-8")
print(f"OK -> {out.name}  ({out.stat().st_size/1024/1024:.1f} MB)")
print("inline css:", "<style>" in html, "| data-bundle:", "window.DB" in html,
      "| residual asset refs:", len(re.findall(r'(?:src|href)="assets/', html)),
      "| inlined videos:", html.count("data:video/mp4"))
