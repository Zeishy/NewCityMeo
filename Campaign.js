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

// WebSocket server setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server,
  path: "/ws" // Add explicit WebSocket path
});

app.use(cors()); // Add this
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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
let campaigns = [];

app.get('/api/campaigns', (req, res) => {
  res.json(campaigns);
});

app.post('/api/campaigns', (req, res) => {
  const { name, startDate, endDate } = req.body;
  const newCampaign = new Campaign(name, startDate, endDate);
  campaigns.push(newCampaign);
  res.status(201).json(newCampaign);
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

app.post('/api/campaigns/:id/activate', (req, res) => {
  const { id } = req.params;
  campaigns.forEach((campaign, index) => {
      campaign.isActive = index === parseInt(id);
  });
  broadcastCampaignUpdate(); // Broadcast update after changing active campaign
  res.json(campaigns);
});

app.post('/api/campaigns/:id/content', (req, res) => {
  const { id } = req.params;
  const { type, source, duration } = req.body;
  const campaign = campaigns[id];
  if (campaign) {
    try {
      const content = campaign.addContent(type, source, duration);
      res.status(201).json(content);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Campaign not found' });
  }
});

// Delete a campaign
app.delete('/api/campaigns/:id', (req, res) => {
    const { id } = req.params;
    const index = parseInt(id);
    
    if (index >= 0 && index < campaigns.length) {
        campaigns.splice(index, 1);
        broadcastCampaignUpdate(); // Broadcast update after deleting campaign
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Campaign not found' });
    }
});

// Delete content from a campaign
app.delete('/api/campaigns/:id/content/:contentIndex', (req, res) => {
    const { id, contentIndex } = req.params;
    const campaign = campaigns[id];
    
    if (campaign) {
        if (campaign.removeContent(parseInt(contentIndex))) {
            broadcastCampaignUpdate(); // Broadcast update after deleting content
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Content not found' });
        }
    } else {
        res.status(404).json({ error: 'Campaign not found' });
    }
});

// Use server.listen() instead
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
      if (now >= this.startDate && now <= this.endDate) {
        this.isActive = true;
      } else {
        this.isActive = false;
      }
    }
  }
}