import http.server
import socketserver
import subprocess
import json
import sys

PORT = 8080
if len(sys.argv) > 1:
    try:
        PORT = int(sys.argv[1])
    except ValueError:
        pass

class APIHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/reboot':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "rebooting"}).encode())
            subprocess.Popen(['sudo', 'reboot'])
            return
        elif self.path == '/api/poweroff':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "powering off"}).encode())
            subprocess.Popen(['sudo', 'poweroff'])
            return
            
        self.send_response(404)
        self.end_headers()

with socketserver.TCPServer(("", PORT), APIHandler) as httpd:
    print(f"Serving at port {PORT}. Replaces 'python -m http.server'")
    httpd.serve_forever()
