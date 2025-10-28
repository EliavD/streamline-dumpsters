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

// Serve index.html as the default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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
const PORT = 8443; // Changed from 3000 to avoid conflict
const server = https.createServer(httpsOptions, app);

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔒 HTTPS Server Running Successfully!');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📍 URL: https://localhost:${PORT}`);
  console.log(`🌐 Live Site: https://localhost:${PORT}/index.html`);
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
