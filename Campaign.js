const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const session = require('express-session');
const db = require('./database');
const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// WebSocket server setup
const server = http.createServer(app);
const wss = new WebSocket.Server({
  server,
  path: "/ws"
});

let campaigns = [];
let devices = []; // Add this to store devices


// Add session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.get('/', isAuthenticated, checkRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

// Retrieve all users
app.get('/users', (req, res) => {
  db.all(`SELECT id, username, role FROM users`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve users' });
    }
    res.status(200).json(rows);
  });
});

// Create a new user
app.post('/users', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [username, hashedPassword, role], function(err) {
    if (err) {
      return res.status(500).json({ error: 'User creation failed' });
    }
    res.status(201).json({ id: this.lastID, username, role });
  });
});

// Login user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    req.session.user = user; // Store user in session
    res.status(200).json({ message: 'Login successful' });
  });
});

// Delete a user
app.delete('/users/:username', (req, res) => {
  const { username } = req.params;
  db.run(`DELETE FROM users WHERE username = ?`, [username], function(err) {
    if (err) {
      return res.status(500).json({ error: 'User deletion failed' });
    }
    res.status(204).send();
  });
});

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// Middleware to check permissions
function checkRole(role) {
  return (req, res, next) => {
    if (req.session.user && req.session.user.role === role) {
      return next();
    }
    res.status(403).json({ error: 'Forbidden' });
  };
}

// API endpoints for campaigns
app.get('/api/campaigns', (req, res) => {
  res.json(campaigns);
});

app.post('/api/campaigns', (req, res) => {
  const { name, startDate, endDate } = req.body;
  const newCampaign = new Campaign(name, startDate, endDate);
  campaigns.push(newCampaign);
  res.status(201).json(newCampaign);
});

app.post('/api/campaigns/:id/activate', (req, res) => {
  const { id } = req.params;
  campaigns.forEach((campaign, index) => {
    campaign.isActive = index === parseInt(id);
  });
  broadcastCampaignUpdate();
  res.json(campaigns);
});

app.post('/api/campaigns/:id/content', (req, res) => {
    const { id } = req.params;
    const { type, source, duration } = req.body;
    const campaignId = parseInt(id);

    console.log('Received content request:', { campaignId, type, source, duration }); // Debug log

    const campaign = campaigns.find(c => c.id === campaignId);

    if (!campaign) {
        console.log('Campaign not found:', campaignId); // Debug log
        return res.status(404).json({ error: 'Campaign not found' });
    }

    try {
        const content = campaign.addContent(type, source, parseInt(duration));
        console.log('Content added successfully:', content); // Debug log
        res.status(201).json(content);
    } catch (error) {
        console.error('Error adding content:', error); // Debug log
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/campaigns/:id', (req, res) => {
    const { id } = req.params;
    const campaignId = parseInt(id);
    const index = campaigns.findIndex(campaign => campaign.id === campaignId);

    if (index !== -1) {
        campaigns.splice(index, 1);
        res.status(200).json({ message: 'Campaign deleted successfully' });
    } else {
        res.status(404).json({ error: 'Campaign not found' });
    }
});

// Add this to your device endpoints
app.post('/api/devices/:id/assign', (req, res) => {
  const { id } = req.params;
  const { campaignId } = req.body;
  const device = devices.find(device => device.id === parseInt(id));

  if (!device) {
      return res.status(404).json({ error: 'Device not found' });
  }

  device.activeCampaignId = campaignId ? parseInt(campaignId) : null;
  broadcastCampaignUpdate();
  res.json(device);
});

// Update the devices campaign endpoint
app.get('/api/devices/:id/campaign', (req, res) => {
    const { id } = req.params;
    const device = devices.find(device => device.id === parseInt(id));

    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    if (!device.isActive || !device.activeCampaignId) {
        return res.json({ message: 'No active campaign' });
    }

    const campaign = campaigns.find(c => c.id === device.activeCampaignId);
    if (!campaign) {
        return res.json({ message: 'Campaign not found' });
    }

    // Check if campaign is within its date range
    if (campaign.startDate && campaign.endDate) {
        const now = new Date();
        const start = new Date(campaign.startDate);
        const end = new Date(campaign.endDate);

        now.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (now < start || now > end) {
            // Clear the device's campaign assignment
            device.activeCampaignId = null;
            device.isActive = false;
            return res.json({ message: 'Campaign is out of schedule' });
        }
    }

    res.json(campaign);
});

app.delete('/api/campaigns/:id/content/:contentIndex', (req, res) => {
  const { id, contentIndex } = req.params;
  const campaign = campaigns.find(campaign => campaign.id === parseInt(id));
  if (campaign) {
    if (campaign.removeContent(parseInt(contentIndex))) {
      res.status(200).json({ message: 'Content deleted successfully' });
    } else {
      res.status(404).json({ error: 'Content not found' });
    }
  } else {
    res.status(404).json({ error: 'Campaign not found' });
  }
});

// Update preview endpoint
app.get('/previsualized/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Device Preview</title>
        <link rel="stylesheet" href="/activeCampaign.css">
    </head>
    <body>
        <div class="preview-banner">Preview Mode - Device ID: ${deviceId}</div>
        <div id="campaign-container">
            <h1 id="campaign-name"></h1>
            <div id="content-container"></div>
        </div>
        <script>
            window.DEVICE_ID = "${deviceId}";
            window.BACKEND_IP = "localhost";
        </script>
        <script src="/activeCampaign.js"></script>
    </body>
    </html>
    `;
    res.send(html);
});

// API endpoints for devices
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

app.post('/api/devices', (req, res) => {
  const { name } = req.body;
  const newDevice = {
      id: Date.now(),
      name,
      isActive: false,
      activeCampaignId: null
  };
  devices.push(newDevice);
  res.status(201).json(newDevice);
});

app.delete('/api/devices/:id', (req, res) => {
  const { id } = req.params;
  const index = devices.findIndex(device => device.id === parseInt(id));
  if (index !== -1) {
    devices.splice(index, 1);
    res.status(200).json({ message: 'Device deleted successfully' });
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.post('/api/devices/:id/toggle', (req, res) => {
    const { id } = req.params;
    const device = devices.find(device => device.id === parseInt(id));

    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    device.isActive = !device.isActive;

    // Broadcast device state change immediately
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'deviceUpdate',
                deviceId: device.id,
                isActive: device.isActive,
                activeCampaignId: device.activeCampaignId
            }));
        }
    });

    res.json(device);
});

const broadcastCampaignUpdate = () => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'campaignUpdate' }));
        }
    });
};

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.on('error', console.error);
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Campaign class definition
class ContentItem {
  constructor(type, source, duration) {
    this.type = type;
    this.source = source;
    this.duration = duration;
  }
}

class Campaign {
  constructor(name, startDate = null, endDate = null) {
    this.id = Date.now(); // This ensures a unique numeric ID
    this.name = name;
    this.startDate = startDate ? new Date(startDate) : null;
    this.endDate = endDate ? new Date(endDate) : null;
    this.isActive = false;
    this.contents = [];
    this.totalDuration = 0;

    this.checkAndToggleActive();
  }

  addContent(type, source, duration) {
    const validTypes = ['image', 'video', 'url'];
    if (!validTypes.includes(type)) {
      throw new Error('Invalid content type. Must be image, video, or url');
    }

    const content = new ContentItem(type, source, duration);
    this.contents.push(content);
    this.totalDuration += duration;
    return content;
  }

  removeContent(index) {
    if (index >= 0 && index < this.contents.length) {
      const removed = this.contents.splice(index, 1)[0];
      this.totalDuration -= removed.duration;
      return true;
    }
    return false;
  }

  toggleActive() {
    this.isActive = !this.isActive;
    return this.isActive;
  }

  getContents() {
    return this.contents;
  }

  getDuration() {
    return this.totalDuration;
  }

  checkAndToggleActive() {
      const now = new Date();
      if (this.startDate && this.endDate) {
          // Convert date strings to Date objects if they aren't already
          const start = new Date(this.startDate);
          const end = new Date(this.endDate);

          // Set all times to start of day for accurate comparison
          now.setHours(0, 0, 0, 0);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999); // End of day for end date

          if (now >= start && now <= end) {
              this.isActive = true;
          } else {
              this.isActive = false;
          }
          return true; // indicates this campaign has dates
      }
      return false; // indicates this campaign doesn't have dates
  }
}