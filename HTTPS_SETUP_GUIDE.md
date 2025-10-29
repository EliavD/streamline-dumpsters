# HTTPS Localhost Setup Guide for Windows

Complete guide to setting up a secure HTTPS development server on Windows using self-signed certificates and Node.js.

---

## Table of Contents
1. [Install OpenSSL on Windows](#1-install-openssl-on-windows)
2. [Generate Self-Signed Root Certificate](#2-generate-self-signed-root-certificate)
3. [Create Server Certificate](#3-create-server-certificate)
4. [Install Root Certificate on Windows](#4-install-root-certificate-on-windows)
5. [Create Node.js HTTPS Server](#5-create-nodejs-https-server)
6. [Testing Your Setup](#6-testing-your-setup)
7. [Troubleshooting](#7-troubleshooting)
8. [Automation Scripts](#8-automation-scripts)

---

## 1. Install OpenSSL on Windows

### Option A: Using Git Bash (Recommended - Easiest)

If you have Git for Windows installed, OpenSSL is already bundled with it!

**Verify installation:**
```bash
# Open Git Bash and run:
openssl version
```

If this works, skip to step 2!

### Option B: Using Chocolatey Package Manager

```powershell
# Open PowerShell as Administrator and run:
# Install Chocolatey if not installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install OpenSSL
choco install openssl -y

# Verify installation
openssl version
```

### Option C: Direct Download and Installation

1. Download OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html
2. Choose "Win64 OpenSSL v3.x.x Light" (recommended)
3. Run the installer
4. Add to PATH: `C:\Program Files\OpenSSL-Win64\bin`
5. Restart your terminal
6. Verify: `openssl version`

---

## 2. Generate Self-Signed Root Certificate

### Step 2.1: Create Certificate Directory

```bash
# In your project directory, create a certs folder
mkdir certs
cd certs
```

### Step 2.2: Generate Root Private Key

**Using Git Bash:**
```bash
openssl genrsa -out root.key 2048
```

**Using CMD/PowerShell:**
```cmd
openssl genrsa -out root.key 2048
```

### Step 2.3: Create Root Certificate

**Using Git Bash:**
```bash
openssl req -x509 -new -nodes -key root.key -sha256 -days 365 -out root.crt \
  -subj "/C=US/ST=State/L=City/O=Development/OU=Local/CN=Local Development Root CA"
```

**Using CMD (single line):**
```cmd
openssl req -x509 -new -nodes -key root.key -sha256 -days 365 -out root.crt -subj "/C=US/ST=State/L=City/O=Development/OU=Local/CN=Local Development Root CA"
```

**Interactive version (if -subj doesn't work):**
```bash
openssl req -x509 -new -nodes -key root.key -sha256 -days 365 -out root.crt
# Then answer the prompts:
# - Country: US
# - State: Your State
# - City: Your City
# - Organization: Development
# - Organizational Unit: Local
# - Common Name: Local Development Root CA
# - Email: (leave empty)
```

---

## 3. Create Server Certificate

### Step 3.1: Generate Server Private Key

```bash
openssl genrsa -out server.key 2048
```

### Step 3.2: Create Certificate Signing Request (CSR)

**Using Git Bash:**
```bash
openssl req -new -key server.key -out server.csr \
  -subj "/C=US/ST=State/L=City/O=Development/OU=Local/CN=localhost"
```

**Using CMD (single line):**
```cmd
openssl req -new -key server.key -out server.csr -subj "/C=US/ST=State/L=City/O=Development/OU=Local/CN=localhost"
```

### Step 3.3: Create Configuration File for SAN (Subject Alternative Names)

Create a file named `server.ext` in the `certs` folder:

```ini
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
```

### Step 3.4: Sign Server Certificate with Root Certificate

**Git Bash or CMD:**
```bash
openssl x509 -req -in server.csr -CA root.crt -CAkey root.key -CAcreateserial -out server.crt -days 365 -sha256 -extfile server.ext
```

### Step 3.5: Verify Your Certificates

```bash
# View root certificate
openssl x509 -in root.crt -text -noout

# View server certificate
openssl x509 -in server.crt -text -noout

# Verify server certificate against root
openssl verify -CAfile root.crt server.crt
```

You should see: `server.crt: OK`

---

## 4. Install Root Certificate on Windows

### Step 4.1: Open Certificate Manager

**Method 1: Using Run Dialog**
1. Press `Win + R`
2. Type `certmgr.msc`
3. Press Enter

**Method 2: Using PowerShell**
```powershell
certmgr.msc
```

### Step 4.2: Import Root Certificate

1. In Certificate Manager, expand **"Trusted Root Certification Authorities"**
2. Right-click on **"Certificates"** folder
3. Select **"All Tasks"** → **"Import..."**
4. Click **"Next"** on the welcome screen
5. Click **"Browse..."** and navigate to your `certs` folder
6. Change file filter to **"All Files (*.*)"**
7. Select **`root.crt`**
8. Click **"Next"**
9. Ensure **"Trusted Root Certification Authorities"** is selected
10. Click **"Next"** → **"Finish"**
11. Click **"Yes"** on the security warning
12. You should see "The import was successful"

### Step 4.3: Verify Installation

1. In Certificate Manager, navigate to: **Trusted Root Certification Authorities** → **Certificates**
2. Look for "Local Development Root CA" in the list
3. Double-click to view details
4. Verify the certificate information

### Step 4.4: Restart Your Browser

Close and reopen all browser windows for the changes to take effect.

---

## 5. Create Node.js HTTPS Server

### Step 5.1: Install Express

```bash
# Navigate back to your project root
cd ..

# Initialize npm if you haven't already
npm init -y

# Install Express
npm install express
```

### Step 5.2: Create Server File

Create `https-server.js` in your project root:

```javascript
const https = require('https');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();

// HTTPS Configuration - Using relative paths compatible with Windows
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
};

// Middleware to serve static files
app.use(express.static(path.join(__dirname)));

// Basic route for testing
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HTTPS Test Server</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        h1 {
          font-size: 3rem;
          margin: 0 0 1rem 0;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        .info {
          background: rgba(0, 0, 0, 0.2);
          padding: 1rem;
          border-radius: 10px;
          margin-top: 2rem;
        }
        .success {
          color: #10b981;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔒</div>
        <h1>Hello, HTTPS World!</h1>
        <p>Your secure HTTPS server is running successfully!</p>
        <div class="info">
          <p><strong>Protocol:</strong> ${req.protocol.toUpperCase()}</p>
          <p><strong>Host:</strong> ${req.get('host')}</p>
          <p><strong>Port:</strong> 3000</p>
          <p class="success">✓ Certificate Trusted</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API endpoint for testing
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'HTTPS API endpoint working!',
    secure: req.secure,
    protocol: req.protocol
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Create HTTPS server
const PORT = 3000;
const server = https.createServer(httpsOptions, app);

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔒 HTTPS Server Running Successfully!');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📍 URL: https://localhost:${PORT}`);
  console.log(`🌐 API Test: https://localhost:${PORT}/api/test`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Error handling for server
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use`);
    console.error('   Try closing other applications or use a different port');
  } else if (error.code === 'EACCES') {
    console.error(`❌ Error: Permission denied for port ${PORT}`);
    console.error('   Try using a port number above 1024');
  } else {
    console.error('❌ Server Error:', error.message);
  }
  process.exit(1);
});
```

### Step 5.3: Create package.json Script

Add this to your `package.json`:

```json
{
  "scripts": {
    "start": "node https-server.js",
    "dev": "node https-server.js"
  }
}
```

### Step 5.4: Run the Server

```bash
# Method 1: Using npm script
npm start

# Method 2: Direct execution
node https-server.js
```

---

## 6. Testing Your Setup

### Test 1: Browser Test
1. Open your browser (Chrome, Firefox, Edge)
2. Navigate to: `https://localhost:3000`
3. You should see "Hello, HTTPS World!" with a lock icon in the address bar
4. Click the lock icon to verify the certificate is trusted

### Test 2: API Test
1. Navigate to: `https://localhost:3000/api/test`
2. You should see a JSON response with secure connection info

### Test 3: Certificate Verification
Click the lock icon in your browser and check:
- ✅ Connection is secure
- ✅ Certificate is valid
- ✅ Issued to: localhost
- ✅ Issued by: Local Development Root CA

### Test 4: Command Line Test

**Using curl (Git Bash):**
```bash
curl https://localhost:3000
```

**Using PowerShell:**
```powershell
Invoke-WebRequest -Uri https://localhost:3000
```

---

## 7. Troubleshooting

### Problem: "openssl: command not found"

**Solution:**
- Ensure OpenSSL is installed (see Section 1)
- Check if it's in your PATH
- Restart your terminal after installation
- Use Git Bash instead of CMD

### Problem: Certificate not trusted in browser

**Solution:**
1. Verify root certificate is installed in Windows Certificate Manager
2. Ensure it's in "Trusted Root Certification Authorities"
3. Restart your browser completely (close ALL windows)
4. Clear browser cache and SSL state:
   - Chrome: `chrome://settings/clearBrowserData`
   - Edge: `edge://settings/clearBrowserData`
   - Check "Cached images and files"

### Problem: "Error: EADDRINUSE" (Port already in use)

**Solution:**
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID [PID] /F

# Or use a different port in https-server.js
```

### Problem: "Error: ENOENT" (Certificate files not found)

**Solution:**
- Verify certificate files exist in `certs/` folder
- Check file paths in `https-server.js`
- Ensure you're running the server from the project root directory

### Problem: Self-signed certificate warnings despite installation

**Solution:**
1. Delete the root certificate from Certificate Manager
2. Re-import it following Section 4
3. Make sure you're importing `root.crt`, NOT `server.crt`
4. Restart browser completely

### Problem: Node.js can't read certificate files on Windows

**Solution:**
```javascript
// Use path.join for Windows compatibility
const path = require('path');
const certPath = path.join(__dirname, 'certs', 'server.crt');
```

### Problem: Certificate expired

**Solution:**
```bash
# Regenerate certificates with new expiry
cd certs
openssl x509 -in server.crt -text -noout | grep "Not After"

# If expired, regenerate from Step 2
```

---

## 8. Automation Scripts

### Windows Batch Script (setup-https.bat)

See `setup-https.bat` file in project root for automated setup.

### PowerShell Script (setup-https.ps1)

See `setup-https.ps1` file in project root for automated setup.

---

## File Structure After Setup

```
your-project/
├── certs/
│   ├── root.key          # Root private key (keep secure!)
│   ├── root.crt          # Root certificate (install in Windows)
│   ├── root.srl          # Serial number file
│   ├── server.key        # Server private key
│   ├── server.csr        # Certificate signing request
│   ├── server.crt        # Server certificate
│   └── server.ext        # SAN configuration
├── https-server.js       # HTTPS server
├── package.json          # Node.js dependencies
└── node_modules/         # Installed packages
```

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit private keys to version control**
   - Add `certs/*.key` to `.gitignore`

2. **Use only for local development**
   - These certificates are NOT for production
   - Self-signed certificates are only suitable for development

3. **Regenerate certificates periodically**
   - Certificates expire after 365 days
   - Regenerate when expired

4. **Keep root key secure**
   - Anyone with `root.key` can create trusted certificates
   - Store securely, don't share

---

## Next Steps

✅ **You're all set!** Your HTTPS development environment is ready.

### Useful Commands

```bash
# Start server
npm start

# Check certificate expiry
openssl x509 -in certs/server.crt -noout -dates

# View certificate details
openssl x509 -in certs/server.crt -text -noout

# Test HTTPS connection
curl -v https://localhost:3000
```

### Additional Resources

- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [Node.js HTTPS Module](https://nodejs.org/api/https.html)
- [Express.js Documentation](https://expressjs.com/)

---

**Setup completed! 🎉**

Server running at: `https://localhost:3000`
