require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
} = require('@solana/web3.js');

const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} = require('@solana/spl-token');

const { OpenAI } = require('openai');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY not found in environment.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const connection = new Connection(process.env.HELLIS_URL, 'confirmed');
const secretKey = Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY));
const keypair = Keypair.fromSecretKey(secretKey);

async function uploadToIPFS(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const res = await axios.post('https://api.nft.storage/upload', form, {
    headers: {
      Authorization: `Bearer ${process.env.NFT_STORAGE_KEY}`,
      ...form.getHeaders()
    }
  });

  return res.data.value.url;
}

async function generateCaption(imageName) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a sarcastic meme caption generator.' },
      { role: 'user', content: `Write a chaotic crypto meme caption for image: ${imageName}` }
    ]
  });

  return res.choices[0].message.content.trim();
}

router.post('/mint-meme', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const imageUrl = await uploadToIPFS(imagePath);
    const caption = await generateCaption(req.file.originalname);

    const mint = await createMint(connection, keypair, keypair.publicKey, null, 0);
    const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);
    await mintTo(connection, keypair, mint, tokenAccount.address, keypair.publicKey, 1);

    const memo = `🔥 Meme: ${caption} 🖼️ ${imageUrl}`;
    const memoTx = {
      keys: [],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: Buffer.from(memo),
    };

    const tx = new Transaction().add(memoTx);
    tx.feePayer = keypair.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const signature = await sendAndConfirmTransaction(connection, tx, [keypair]);

    fs.unlinkSync(imagePath);
    res.json({ success: true, signature });
  } catch (err) {
    console.error('Mint failed:', err.message || err);
    res.status(500).json({ success: false, error: err.message || 'Unknown error' });
  }
});

module.exports = router;
