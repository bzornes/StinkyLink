require('dotenv').config();
console.log("Loaded env:", {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  HELIUS_URL: process.env.HELLIS_URL,
  NFT_STORAGE_KEY: process.env.NFT_STORAGE_KEY,
  PRIVATE_KEY: process.env.PRIVATE_KEY ? 'Exists' : 'Missing'
});

const express = require('express');
const cors = require('cors');
const mintRoutes = require('./mintMeme');

const app = express();
app.use(cors());
app.use(express.json());

// Route to test if env vars are loaded
app.get('/', (req, res) => {
  res.send(`✅ Backend is running. OpenAI Key: ${process.env.OPENAI_API_KEY ? '✔️' : '❌ Missing'}`);
});

app.use('/api', mintRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
