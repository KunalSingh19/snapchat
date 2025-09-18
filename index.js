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
const historyFile = path.resolve('./history.txt');

async function getNextUrl() {
  if (!await fs.pathExists(reelsFile)) {
    throw new Error('reels.txt file not found');
  }

  const content = await fs.readFile(reelsFile, 'utf-8');
  const urls = content.split('\n').map(line => line.trim()).filter(Boolean);

  if (urls.length === 0) {
    return null; // no URLs left
  }

  const nextUrl = urls.shift();

  // Save updated reels.txt without the used URL
  await fs.writeFile(reelsFile, urls.join('\n'), 'utf-8');

  // Append used URL to history.txt
  await fs.appendFile(historyFile, nextUrl + '\n');

  return nextUrl;
}

app.get('/get-next-reel', async (req, res) => {
  try {
    const url = await getNextUrl();
    if (!url) {
      return res.json({ success: false, message: 'No more URLs to process' });
    }

    const data = await instagramGetUrl(url);
    res.json({ success: true, url, data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
