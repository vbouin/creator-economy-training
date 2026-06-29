#!/usr/bin/env python3
"""Build a single self-contained, lightweight HTML export of the playbook (index.html).
- Inlines CSS + JS (incl. data-bundle) so it works from a single file.
- Base64-embeds images (favicon + case images + video posters).
- Drops heavy videos: each <video> keeps its poster still (light); hero video removed.
- Disables the access gate (the file is meant to be handed over directly).
Output: Exoflow-Creator-economy-training.html
"""
import base64, re, pathlib

ROOT = pathlib.Path(__file__).parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
MIME = {"svg": "image/svg+xml", "png": "image/png", "jpg": "image/jpeg",
        "jpeg": "image/jpeg", "webp": "image/webp", "gif": "image/gif"}

def datauri(path):
    p = ROOT / path
    if not p.exists():
        return None
    ext = p.suffix.lstrip(".").lower()
    if ext not in MIME:
        return None
    return f"data:{MIME[ext]};base64," + base64.b64encode(p.read_bytes()).decode()

# 1) gate off: remove head guard, force unlocked
html = re.sub(r'<script>try\{if\(localStorage\.getItem\("ce-access"\).*?</script>\n?', "", html)
html = html.replace('<meta charset="UTF-8">',
                    '<meta charset="UTF-8">\n<script>try{localStorage.setItem("ce-access","ok")}catch(e){}</script>', 1)

# 2) inline CSS
css = (ROOT / "assets/css/styles.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="assets/css/styles.css">', "<style>\n" + css + "\n</style>")

# 3) inline JS (order matters)
for js in ["assets/js/data-bundle.js", "assets/js/i18n.js", "assets/js/dataviz.js", "assets/js/app.js"]:
    code = (ROOT / js).read_text(encoding="utf-8").replace("</script>", "<\\/script>")
    html = html.replace(f'<script src="{js}"></script>', "<script>\n" + code + "\n</script>")

# 4) drop hero video (no poster — canvas/gradient shows behind)
html = re.sub(r'<video class="hero-video".*?</video>', "", html, flags=re.S)

# 5) other videos -> poster still (base64 poster, strip sources / mp4 src / onerror)
def repl_video(m):
    block = m.group(0)
    open_tag = re.match(r"<video[^>]*>", block).group(0)
    pm = re.search(r'poster="(assets/img/[^"]+)"', open_tag)
    if pm:
        uri = datauri(pm.group(1))
        if uri:
            open_tag = open_tag.replace(pm.group(1), uri)
    open_tag = re.sub(r'\ssrc="assets/video/[^"]*"', "", open_tag)
    open_tag = re.sub(r'\sonerror="[^"]*"', "", open_tag)
    return open_tag + "</video>"
html = re.sub(r"<video[^>]*>.*?</video>", repl_video, html, flags=re.S)

# 6) base64 every referenced image (img src + favicon hrefs)
html = re.sub(r'src="(assets/img/[^"]+)"', lambda m: f'src="{datauri(m.group(1)) or m.group(1)}"', html)
html = re.sub(r'href="(assets/img/[^"]+)"', lambda m: f'href="{datauri(m.group(1)) or m.group(1)}"', html)

# 7) neutralize cross-page tool links (no companion files in a standalone) -> keep label, disable
html = re.sub(r'href="(data|roi|lexique|ateliers)\.html(#[^"]*)?"', 'href="#" data-tool-page="1"', html)

out = ROOT / "Exoflow-Creator-economy-training.html"
out.write_text(html, encoding="utf-8")
kb = out.stat().st_size / 1024
print(f"OK -> {out.name}  ({kb/1024:.1f} MB)")
print("inline css:", "<style>" in html, "| inline data-bundle:", "window.DB" in html,
      "| residual asset refs:", len(re.findall(r'(src|href)="assets/', html)),
      "| mp4 refs:", html.count(".mp4"))
