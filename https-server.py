#!/usr/bin/env python3
"""
Simple HTTPS server for local testing
"""
import http.server
import ssl
import os

PORT = 8443

# Check if certificate exists
if not os.path.exists('localhost.pem'):
    print("Certificate file 'localhost.pem' not found!")
    print("You need to generate a self-signed certificate first:")
    print("  openssl req -x509 -newkey rsa:4096 -keyout localhost.pem -out localhost.pem -days 365 -nodes")
    exit(1)

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

httpd = http.server.HTTPServer(('localhost', PORT), MyHTTPRequestHandler)

# Wrap with SSL
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain('localhost.pem')
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f"HTTPS Server running on https://localhost:{PORT}")
print(f"Press Ctrl+C to stop")
httpd.serve_forever()
