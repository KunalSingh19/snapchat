import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { instagramGetUrl } from 'instagram-url-direct';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const reelsFile = path.resolve('./reels.txt');
const historyFile = path.resolve('./api/history.txt');
const invalidFile = path.resolve('./api/invalid.txt');

async function initializeFiles() {
  if (!await fs.pathExists(reelsFile)) {
    await fs.writeFile(reelsFile, '', 'utf-8');
  }

  const apiDir = path.dirname(historyFile);
  if (!await fs.pathExists(apiDir)) {
    await fs.ensureDir(apiDir);
  }

  if (!await fs.pathExists(historyFile)) {
    await fs.writeFile(historyFile, '', 'utf-8');
  }

  if (!await fs.pathExists(invalidFile)) {
    await fs.writeFile(invalidFile, '', 'utf-8');
  }
}

// Helper to read URLs from a file into a Set for fast lookup
async function readUrlsSet(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const urls = content.split('\n').map(line => line.trim()).filter(Boolean);
    return new Set(urls);
  } catch (err) {
    // If file doesn't exist or error, return empty set
    return new Set();
  }
}

// Get last URL from reels.txt that is NOT in history.txt or invalid.txt
async function getNextValidUrl() {
  const reelsContent = await fs.readFile(reelsFile, 'utf-8');
  const reelsUrls = reelsContent.split('\n').map(line => line.trim()).filter(Boolean);

  if (reelsUrls.length === 0) {
    return null;
  }

  const historySet = await readUrlsSet(historyFile);
  const invalidSet = await readUrlsSet(invalidFile);

  // Iterate from the end to the start to find the last URL not in history or invalid
  for (let i = reelsUrls.length - 1; i >= 0; i--) {
    const url = reelsUrls[i];
    if (!historySet.has(url) && !invalidSet.has(url)) {
      return url;
    }
  }

  // No valid URL found
  return null;
}

app.get('/get-next-reel', async (req, res) => {
  try {
    const url = await getNextValidUrl();

    if (url === null) {
      return res.json({ success: false, message: 'No URLs to process' });
    }

    try {
      const data = await instagramGetUrl(url);
      return res.json({ success: true, url, data });
    } catch (fetchError) {
      // Append invalid URL to invalid.txt to skip next time
      await fs.appendFile(invalidFile, url + '\n');
      console.error('Invalid URL:', url, fetchError.message);
      return res.status(400).json({ success: false, message: 'Invalid URL', error: fetchError.message });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST method to append URLs to history.txt
app.post('/history', async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls) {
      return res.status(400).json({ success: false, message: 'No URLs provided' });
    }

    const urlsToAdd = Array.isArray(urls) ? urls : [urls];
    const dataToAppend = urlsToAdd.join('\n') + '\n';
    await fs.appendFile(historyFile, dataToAppend, 'utf-8');

    res.json({ success: true, message: 'URLs added to history' });
  } catch (error) {
    console.error('Error adding to history:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

async function startServer() {
  await initializeFiles();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
