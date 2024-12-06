const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Add this line
const app = express();
const PORT = 8282;

app.use(cors()); // Add this line
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'data')));

// Endpoint to upload files
app.post('/upload', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const file = req.files.file;
    const uploadPath = path.join(__dirname, 'data', file.name);

    file.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        res.send('File uploaded successfully');
    });
});

// Endpoint to list files
app.get('/', (req, res) => {
    fs.readdir(path.join(__dirname, 'data'), (err, files) => {
        if (err) {
            return res.status(500).send(err);
        }

        res.json(files);
    });
});

app.listen(PORT, () => {
    console.log(`Content server is running on http://localhost:${PORT}`);
});