const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
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

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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

// Add endpoint for devices to fetch their assigned campaign
app.get('/api/devices/:id/campaign', (req, res) => {
    const { id } = req.params;
    const device = devices.find(device => device.id === parseInt(id));
    
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    // Only return campaign if device is active
    if (!device.isActive || !device.activeCampaignId) {
        return res.json({ message: 'No active campaign' });
    }

    const campaign = campaigns.find(c => c.id === device.activeCampaignId);
    if (!campaign) {
        return res.json({ message: 'Campaign not found' });
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
  if (device.isActive && device.activeCampaignId) {
    const campaign = campaigns.find(c => c.id === device.activeCampaignId);
    if (campaign) {
      campaign.isActive = true;
    }
  }
  broadcastCampaignUpdate();
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
}