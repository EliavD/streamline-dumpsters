# HTTPS Localhost - Quick Start Guide

Get your HTTPS development server running in 5 minutes!

---

## Prerequisites

- Node.js installed
- Git Bash (recommended) OR PowerShell

---

## Quick Setup (3 Steps)

### Step 1: Generate Certificates

**Using Git Bash (Recommended):**
```bash
bash setup-https.sh
```

**Using PowerShell:**
```powershell
.\setup-https.ps1
```

**Using Windows Batch:**
```cmd
setup-https.bat
```

### Step 2: Install Root Certificate

1. Press `Win + R`
2. Type `certmgr.msc` and press Enter
3. Expand **Trusted Root Certification Authorities**
4. Right-click **Certificates** → **All Tasks** → **Import**
5. Browse to `certs/root.crt`
6. Complete the wizard
7. **Restart your browser**

### Step 3: Start Server

```bash
# Install Express
npm install express

# Start HTTPS server
node https-server.js
```

Visit: **https://localhost:3000**

---

## Expected Result

✅ Browser shows **"Hello, HTTPS World!"**
✅ Lock icon appears (no certificate warnings)
✅ Protocol shows **HTTPS**

---

## Troubleshooting

### "openssl: command not found"
- Install Git for Windows (includes OpenSSL)
- OR install via Chocolatey: `choco install openssl`

### Certificate still shows as untrusted
1. Ensure you imported `root.crt` (not `server.crt`)
2. Restart **all** browser windows
3. Clear browser cache

### Port 3000 already in use
```bash
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

---

## File Structure

```
your-project/
├── certs/
│   ├── root.crt          ← Install this in Windows
│   ├── server.crt        ← Server uses this
│   ├── server.key        ← Server uses this
│   └── ...
├── https-server.js       ← Run this
└── package.json
```

---

## Security Notes

⚠️ **Development Only** - Do NOT use in production
⚠️ **Never commit** `*.key` files to git
⚠️ **Regenerate** certificates every 365 days

---

## Full Documentation

See **HTTPS_SETUP_GUIDE.md** for complete instructions, troubleshooting, and advanced configuration.

---

**That's it! You're ready to develop with HTTPS.** 🔒
