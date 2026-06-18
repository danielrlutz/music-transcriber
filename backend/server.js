const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// Middleware Configuration
// ==========================================

// Increase JSON and URL-encoded limits to accommodate large Base64 strings if needed
// (Though we currently use multer for file uploads, it's safe to have for JSON APIs)
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Serve static assets from the 'public' directory
// (In production, the Vue build output is copied here)
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// Route Registration
// ==========================================

// Mount all API routes under /api
app.use('/api', apiRoutes);

// Fallback route for Single Page Application (SPA) routing
// Ensures Vue Router handles deep links correctly if implemented
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// Server Initialization
// ==========================================

app.listen(port, () => {
    console.log(`[Server] MT3 Web UI proxy server listening at http://0.0.0.0:${port}`);
});
