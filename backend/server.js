// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');
const connectDB = require('./config/db.js');
const authRoutes = require('./routes/auth.js');
const conversationRoutes = require('./routes/conversations.js');
const User = require('./models/User.js');
const Conversation = require('./models/Conversation.js');
const Message = require('./models/Message.js');
const jwt = require('jsonwebtoken');

dotenv.config();
connectDB();

const app = express();
app.use(express.json({ limit: '10mb' }));

// ---------- CORS ----------
const corsOptions = {
  origin: ['http://localhost:5173', 'https://inteltrace-delta.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
app.use(cors(corsOptions));

// ---------- PASSPORT ----------
app.use(passport.initialize());
require('./config/passport')(passport);

// ---------- ROUTES ----------
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);

// ---------- STATIC FOLDERS ----------
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);
app.use('/results', express.static(resultsDir));

// ---------- SOCKET.IO ----------
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

// ---- socket auth middleware ----
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch (e) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);
  socket.join(socket.user._id.toString());

  socket.on('sendMessage', async (data) => {
    const { content, image, conversationId } = data;
    try {
      // 1. Conversation
      let convoId = conversationId;
      if (!convoId) {
        const newConvo = new Conversation({
          user: socket.user._id,
          title: content.substring(0, 30) + '...',
        });
        const saved = await newConvo.save();
        convoId = saved._id;
        io.to(socket.user._id.toString()).emit('newConversation', saved);
      } else {
        await Conversation.findByIdAndUpdate(convoId, { updatedAt: Date.now() });
      }

      // 2. Save uploaded image to /uploads ONLY
      let imageUrl = null;
      if (image) {
        const base64 = image.split(';base64,').pop();
        const ext = image.substring('data:image/'.length, image.indexOf(';base64'));
        const filename = `${uuidv4()}.${ext}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, base64, 'base64');
        imageUrl = `/uploads/${filename}`;
      }

      // 3. Save user message
      const userMsg = new Message({
        conversation: convoId,
        role: 'user',
        content,
        image: imageUrl,
      });
      const savedUser = await userMsg.save();
      io.to(socket.user._id.toString()).emit('messageReceived', savedUser);

      // 4. Wait 2.5s
      await new Promise(r => setTimeout(r, 2500));

      // 5. GET THE IMAGE FROM /results (you placed it manually)
      const resultFiles = fs.readdirSync(resultsDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
      if (resultFiles.length === 0) {
        throw new Error('No result image in backend/results/');
      }
      const resultFilename = resultFiles[0]; // Use the FIRST image in results/
      const maskUrl = `/results/${resultFilename}`;

      // 6. Assistant reply with ONLY the result image
      const assistantMsg = new Message({
        conversation: convoId,
        role: 'assistant',
        content: 'Sure the segmentation result is ready. See the mask below.',
        segmentationMask: maskUrl,
      });
      const savedAssistant = await assistantMsg.save();
      io.to(socket.user._id.toString()).emit('messageReceived', savedAssistant);
    } catch (err) {
      console.error('sendMessage error:', err);
      io.to(socket.user._id.toString()).emit('messageError', { message: 'Processing failed.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// ---------- START ----------
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));