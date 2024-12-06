const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 8181;

// Enable CORS
app.use(cors());

// Serve only the specific files needed for the active campaign viewer
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'activeCampaign.html'));
});

app.get('/activeCampaign.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'activeCampaign.css'));
});

app.get('/activeCampaign.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'activeCampaign.js'));
});

app.listen(PORT, () => {
  console.log(`Active campaign server is running on http://localhost:${PORT}`);
});