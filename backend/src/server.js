require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const reportRoutes = require('./routes/reports');
const catUniRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const featuredRoutes = require('./routes/featured');

const app = express();
const server = http.createServer(app);

// Danh sách các domain được phép kết nối
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://unimarket-frontend.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

// Setup Socket.IO với CORS chuẩn
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

// Middleware CORS cho phép Frontend gọi API
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Cho phép truy cập linh hoạt để tránh chặn API
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', catUniRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/featured', featuredRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'UniMarket API', timestamp: new Date() });
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_user_channel', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(`conversation_${conversationId}`);
    }
  });

  socket.on('leave_conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(`conversation_${conversationId}`);
    }
  });

  socket.on('typing', ({ conversationId, userName, isTyping }) => {
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      conversationId,
      userName,
      isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`UniMarket Backend Server running on http://localhost:${PORT}`);
});