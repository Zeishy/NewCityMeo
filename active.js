const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = process.argv[2] || 8181;
const DEVICE_ID = process.argv[3] || null;
const BACKEND_IP = process.argv[4] || 'localhost';

app.use(cors());
app.use(express.json());

// Add health check route FIRST
app.get('/health', (req, res) => {
    if (DEVICE_ID) {
        res.status(200).send('OK');
    } else {
        res.status(503).send('Server not ready');
    }
});

// Update the restart endpoint to ensure clean shutdown
app.post('/restart', (req, res) => {
    const { port, id, backendIp } = req.body;
    console.log('Restarting server with:', { port, id, backendIp });
    res.json({ success: true });
    
    // Give time for the response to be sent
    setTimeout(() => {
        process.exit(0);
    }, 500);
});

// Rest of your routes...
// Serve activeCampaign.css and activeCampaign.js directly
app.get('/activeCampaign.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'activeCampaign.css'));
});

app.get('/activeCampaign.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'activeCampaign.js'));
});


app.get('/deviceSetup.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'deviceSetup.js'));
});

// Config file path
const CONFIG_PATH = path.join(__dirname, 'device-config.json');

// Check if device is configured
const isConfigured = () => {
    try {
        return fs.existsSync(CONFIG_PATH);
    } catch (error) {
        return false;
    }
};

// Load configuration
const loadConfig = () => {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH));
        return config;
    } catch (error) {
        return null;
    }
};

app.use('/static', express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Root route
app.get('/', (req, res) => {
    if (!isConfigured()) {
        res.sendFile(path.join(__dirname, 'deviceSetup.html'));
    } else {
        const config = loadConfig();
        if (config) {
            res.redirect(`/device/${config.id}`);
        } else {
            res.sendFile(path.join(__dirname, 'deviceSetup.html'));
        }
    }
});
// Save device configuration
app.post('/save-config', express.json(), (req, res) => {
    const { id, backendIp, port } = req.body;
    const config = { id, backendIp, port, configured: true };
    
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// Device page
// In active.js, update the device page route
app.get('/device/:id', (req, res) => {
    const deviceId = req.params.id;
    const config = loadConfig();
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Active Campaign</title>
        <link rel="stylesheet" href="/activeCampaign.css">
    </head>
    <body>
        <div id="campaign-container">
            <h1 id="campaign-name"></h1>
            <div id="content-container"></div>
        </div>
        <script>
            window.DEVICE_ID = "${deviceId}";
            window.BACKEND_IP = "${config.backendIp}";
        </script>
        <script src="/activeCampaign.js"></script>
    </body>
    </html>
    `;
    res.send(html);
});

// Add proper error handling for static files
app.use((req, res, next) => {
    res.status(404).send('File not found');
});

app.listen(PORT, () => {
    if (DEVICE_ID) {
        console.log(`Device ${DEVICE_ID} front server running on http://localhost:${PORT}`);
        console.log(`Connected to backend at http://${BACKEND_IP}:8080`);
    } else {
        console.log(`Device setup server running on http://localhost:${PORT}`);
    }
});