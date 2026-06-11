#!/usr/bin/env python3
"""Tiny local server with HTTP Range support (needed for video scrubbing).
Usage:  python3 server.py [port]   (default 4600)
Then open http://localhost:4600/
"""
import http.server, socketserver, os, re, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4600
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if rng and os.path.isfile(path):
            m = re.match(r"bytes=(\d+)-(\d*)", rng)
            if m:
                size = os.path.getsize(path)
                start = int(m.group(1))
                end = int(m.group(2)) if m.group(2) else size - 1
                end = min(end, size - 1)
                length = end - start + 1
                ctype = self.guess_type(path)
                self.send_response(206)
                self.send_header("Content-Type", ctype)
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
                self.send_header("Content-Length", str(length))
                self.end_headers()
                with open(path, "rb") as f:
                    f.seek(start)
                    self.wfile.write(f.read(length))
                return
        super().do_GET()


print(f"Creator Economy playbook → http://localhost:{PORT}/")
with socketserver.TCPServer(("", PORT), RangeHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
