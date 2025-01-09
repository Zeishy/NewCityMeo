const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.argv[2] || 8181;
const DEVICE_ID = process.argv[3];
const BACKEND_IP = process.argv[4] || 'localhost';

app.use(cors());

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

app.get('/', (req, res) => {
    res.redirect(`/device/${DEVICE_ID}`);
});

app.get('/device/:id', (req, res) => {
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