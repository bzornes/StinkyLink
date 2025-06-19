require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mintRoutes = require('./mintMeme');

const app = express();

app.use(cors());
app.use(express.json());

// Route handler for uploading memes
app.use('/api', mintRoutes);

// Add a test route so GET requests don't fail
app.get('/', (req, res) => {
  res.send('🚀 Stinky backend is up and running!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🧼 Server running on port ${PORT}`);
});
