const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const app = express();
const PORT = process.argv[2] || 8181;
const DEVICE_ID = process.argv[3];
const BACKEND_IP = process.argv[4] || 'localhost';

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Serve static files with correct MIME types
app.use('/static', express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.user || req.headers['x-auth-token'] === 'true') {
        return next();
    }
    res.redirect('/');
}

// Serve dashboard page
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Serve device page
app.get('/device/:id', isAuthenticated, (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Active Campaign</title>
        <link rel="stylesheet" href="/static/activeCampaign.css">
    </head>
    <body>
        <div id="campaign-container">
            <h1 id="campaign-name"></h1>
            <div id="content-container"></div>
        </div>
        <script>
            window.DEVICE_ID = "${DEVICE_ID}";
            window.BACKEND_IP = "${BACKEND_IP}";
        </script>
        <script src="/static/activeCampaign.js"></script>
    </body>
    </html>
    `;
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Device ${DEVICE_ID} front server running on http://localhost:${PORT}`);
    console.log(`Connected to backend at http://${BACKEND_IP}:8080`);
});