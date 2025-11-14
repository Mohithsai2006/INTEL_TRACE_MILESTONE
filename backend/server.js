// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const ClipResult = require('./models/ClipResult');
const jwt = require('jsonwebtoken');
const FormData = require('form-data');
const axios = require('axios');
const Busboy = require('busboy'); // For file upload

connectDB();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'https://inteltrace-delta.vercel.app'] }
});

app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: ['http://localhost:5173', 'https://inteltrace-delta.vercel.app'] }));
app.use(passport.initialize());
require('./config/passport')(passport);

app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// === IMAGE UPLOAD ENDPOINT ===
app.post('/api/upload', (req, res) => {
  const busboy = Busboy({ headers: req.headers });
  let filename = '';
  let fileBuffer = Buffer.alloc(0);

  busboy.on('file', (fieldname, file, info) => {
    filename = `${uuidv4()}.${info.filename.split('.').pop()}`;
    file.on('data', (data) => {
      fileBuffer = Buffer.concat([fileBuffer, data]);
    });
  });

  busboy.on('finish', () => {
    if (!filename) return res.status(400).json({ error: 'No file' });
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, fileBuffer);
    res.json({ imageUrl: `/uploads/${filename}` });
  });

  busboy.on('error', (err) => {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  });

  req.pipe(busboy);
});

// === SOCKET.IO AUTH ===
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// === MAIN SOCKET LOGIC ===
io.on('connection', (socket) => {
  console.log(`Connected: ${socket.user.username}`);
  socket.join(socket.user._id.toString());

  socket.on('sendMessage', async (data) => {
    const { content, image, conversationId } = data;
    let convoId = conversationId;

    try {
      // 1. Conversation
      if (!convoId) {
        const convo = await new Conversation({
          user: socket.user._id,
          title: content.slice(0, 30) + '...'
        }).save();
        convoId = convo._id;
        io.to(socket.user._id.toString()).emit('newConversation', convo);
      } else {
        await Conversation.findByIdAndUpdate(convoId, { updatedAt: Date.now() });
      }

      // 2. Save original image (path only)
      let imageUrl = image; // Already /uploads/xxx.jpg

      // 3. Save user message
      const userMsg = await new Message({
        conversation: convoId,
        role: 'user',
        content,
        image: imageUrl,
      }).save();
      io.to(socket.user._id.toString()).emit('messageReceived', userMsg);

      // 4. LISA → Mask
      let maskPath = null;
      if (imageUrl) {
        const imagePath = path.join(uploadsDir, path.basename(imageUrl));
        const form = new FormData();
        form.append('prompt', content);
        form.append('image', fs.createReadStream(imagePath), {
          filename: 'image.jpg',
          contentType: 'image/jpeg'
        });

        const lisaRes = await axios.post(process.env.LISA_URL, form, {
          headers: form.getHeaders(),
          maxRedirects: 5,
          timeout: 60000,
          responseType: 'arraybuffer'
        });

        const maskFile = `mask_${uuidv4()}.jpg`;
        maskPath = path.join(uploadsDir, maskFile);
        fs.writeFileSync(maskPath, Buffer.from(lisaRes.data));
        console.log('LISA mask saved:', `/uploads/${maskFile}`);
      }

      // 5. CLIP → Analysis
      let clipData = null;
      if (maskPath) {
        const clipForm = new FormData();
        clipForm.append('file', fs.createReadStream(maskPath), { filename: 'mask.jpg' });
        clipForm.append('query', content);

        const clipRes = await axios.post('http://localhost:8001/analyze', clipForm, {
          headers: clipForm.getHeaders(),
          timeout: 30000
        });

        if (clipRes.status === 200) clipData = clipRes.data;
      }

      // 6. Save assistant message
      const assistantMsg = await new Message({
        conversation: convoId,
        role: 'assistant',
        content: clipData ? 'Threat analysis complete.' : 'Segmentation complete.',
        image: imageUrl,
        segmentationMask: maskPath ? `/uploads/${path.basename(maskPath)}` : null,
      }).save();

      // 7. Save CLIP result
      if (clipData) {
        const clipResult = await new ClipResult({
          message: assistantMsg._id,
          threatScore: clipData.threat_score,
          topThreat: clipData.top_threat,
          justification: clipData.justification,
          topExplanations: clipData.top_explanations,
        }).save();
        await Message.findByIdAndUpdate(assistantMsg._id, { clipResult: clipResult._id });
      }

      // 8. Emit
      const populated = await Message.findById(assistantMsg._id).populate('clipResult');
      io.to(socket.user._id.toString()).emit('messageReceived', populated);

    } catch (err) {
      console.error('Socket error:', err.message);
      io.to(socket.user._id.toString()).emit('messageError', { message: 'Processing failed.' });
    }
  });

  socket.on('disconnect', () => console.log(`Disconnected: ${socket.id}`));
});

// === START SERVER ===
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`LISA URL: ${process.env.LISA_URL}`);
});