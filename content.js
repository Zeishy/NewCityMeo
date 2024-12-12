const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 8282;

app.use(cors());
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'data')));

// Endpoint to upload files or URLs
app.post('/upload', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const file = req.files.file;
    const uploadPath = path.join(__dirname, 'data', file.name);

    // Check if the uploaded file is a URL
    if (file.mimetype === 'text/plain') {
        const url = file.data.toString('utf8').trim();
        const jsonFilePath = path.join(__dirname, 'data', 'urls.json');

        // Read existing JSON file or create a new one
        fs.readFile(jsonFilePath, 'utf8', (err, data) => {
            let urls = [];
            if (!err) {
                urls = JSON.parse(data);
            }

            // Add new URL with an ID
            const newUrl = {
                id: Date.now(),
                value: url
            };
            urls.push(newUrl);

            // Save updated JSON file
            fs.writeFile(jsonFilePath, JSON.stringify(urls, null, 2), (err) => {
                if (err) {
                    return res.status(500).send(err);
                }

                res.send('URL uploaded successfully');
            });
        });
    } else {
        // Handle file upload
        file.mv(uploadPath, (err) => {
            if (err) {
                return res.status(500).send(err);
            }

            res.send('File uploaded successfully');
        });
    }
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

// Endpoint to serve the JSON file
app.get('/data/urls.json', (req, res) => {
    const jsonFilePath = path.join(__dirname, 'data', 'urls.json');
    res.sendFile(jsonFilePath);
});

app.listen(PORT, () => {
    console.log(`Content server is running on http://localhost:${PORT}`);
});