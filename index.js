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
  // Create reels.txt if not exists
  if (!await fs.pathExists(reelsFile)) {
    await fs.writeFile(reelsFile, '', 'utf-8');
  }

  // Create api folder if not exists
  const apiDir = path.dirname(historyFile);
  if (!await fs.pathExists(apiDir)) {
    await fs.ensureDir(apiDir);
  }

  // Create history.txt if not exists
  if (!await fs.pathExists(historyFile)) {
    await fs.writeFile(historyFile, '', 'utf-8');
  }

  // Create invalid.txt if not exists
  if (!await fs.pathExists(invalidFile)) {
    await fs.writeFile(invalidFile, '', 'utf-8');
  }
}

async function popNextUrl() {
  const content = await fs.readFile(reelsFile, 'utf-8');
  const urls = content.split('\n').map(line => line.trim()).filter(Boolean);

  if (urls.length === 0) {
    return null; // no URLs left
  }

  const nextUrl = urls.shift();

  // Save updated reels.txt without the used URL
  await fs.writeFile(reelsFile, urls.join('\n'), 'utf-8');

  return nextUrl;
}

app.get('/get-next-reel', async (req, res) => {
  try {
    let url;
    while (true) {
      url = await popNextUrl();
      if (url === null) {
        return res.json({ success: false, message: 'No more URLs to process' });
      }

      try {
        const data = await instagramGetUrl(url);
        // Success: append to history
        await fs.appendFile(historyFile, url + '\n');
        return res.json({ success: true, url, data });
      } catch (fetchError) {
        // Invalid: append to invalid.txt and skip
        await fs.appendFile(invalidFile, url + '\n');
        console.error('Invalid URL:', url, fetchError.message);
        // Continue to next URL
      }
    }
  } catch (error) {
    console.error('Error:', error);
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
