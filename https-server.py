#!/usr/bin/env python3
"""
Simple HTTPS server for local development
Serves files from current directory on https://localhost:8443
"""

import http.server
import ssl
import os

# Configuration
PORT = 8443
CERT_FILE = 'certs/server.crt'
KEY_FILE = 'certs/server.key'

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def run_server():
    # Check if certificates exist
    if not os.path.exists(CERT_FILE) or not os.path.exists(KEY_FILE):
        print(f"❌ Error: SSL certificates not found!")
        print(f"   Looking for: {CERT_FILE} and {KEY_FILE}")
        return

    # Create server
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, MyHTTPRequestHandler)

    # Wrap with SSL
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(CERT_FILE, KEY_FILE)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

    print(f"HTTPS Server running on https://localhost:{PORT}")
    print(f"Serving files from: {os.getcwd()}")
    print(f"Using SSL certificates:")
    print(f"   - Certificate: {CERT_FILE}")
    print(f"   - Private Key: {KEY_FILE}")
    print(f"\nYour browser will show a security warning because this is a self-signed certificate.")
    print(f"   Click 'Advanced' and 'Proceed to localhost' to continue.\n")
    print(f"Press Ctrl+C to stop the server\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped")

if __name__ == '__main__':
    run_server()
