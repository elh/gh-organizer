import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';

// env vars
dotenv.config();
const port = process.env.PORT || 4000;

const app = express();

// serve files in data/
app.use('/data', express.static('data'));

// GET /data returns a JSON array of data file names
app.get('/data', async (_, res) => {
  const filePaths: string[] = [];
  fs.readdirSync('data').forEach(file => {
    // if file does not end in .json, skip
    if (!file.endsWith('.json')) {
      return;
    }
    filePaths.push(file);
  });
  res.json(filePaths);
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
