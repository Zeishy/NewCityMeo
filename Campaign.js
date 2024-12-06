const express = require('express');
const path = require('path');
const cors = require('cors'); // Add this
const app = express();
const PORT = 8080;

app.use(cors()); // Add this
app.use(express.json());
app.use(express.static(path.join(__dirname)));
// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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

app.post('/api/campaigns/:id/activate', (req, res) => {
  const { id } = req.params;
  campaigns.forEach((campaign, index) => {
    campaign.isActive = index === parseInt(id);
  });
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

app.listen(PORT, () => {
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
  constructor(name, startDate, endDate) {
    this.name = name;
    this.startDate = new Date(startDate);
    this.endDate = new Date(endDate);
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