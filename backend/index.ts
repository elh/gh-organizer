import express from 'express';
import dotenv from 'dotenv';

// env vars
dotenv.config();
const port = process.env.PORT || 4000;

// serve data/data.json
const app = express();
app.use('/data', express.static('data'));

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
