const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB().then((db) => {
  const corsOptions = {
    origin: '*', // Update this later to restrict to your Netlify URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  };

  app.use(cors(corsOptions));
  app.use(express.json());

  // Routes
  const codeBlockRoutes = require('./routes/codeBlockRoutes')(db);
  const solutionRoutes = require('./routes/solutionRoutes')(db);

  app.use('/codeblocks', codeBlockRoutes);
  app.use('/solution', solutionRoutes);

  app.get('/', (req, res) => {
    res.send('Server is running');
  });

  const io = socketIo(server, {
    cors: {
      origin: '*', // Update this later to restrict to your Netlify URL
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: true
    }
  });

  const roomUsers = {};

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      if (!roomUsers[roomId]) {
        roomUsers[roomId] = [];
      }

      const userRole = roomUsers[roomId].length === 0 ? 'mentor' : 'student';
      roomUsers[roomId].push(socket.id);

      socket.emit('role', userRole);
      console.log(`Client joined room: ${roomId} as ${userRole}`);
    });

    socket.on('codeUpdate', (data) => {
      const { roomId, code } = data;
      console.log(`Code update received for room ${roomId}: ${code}`);
      socket.to(roomId).emit('codeUpdate', code);
    });

    socket.on('disconnect', () => {
      for (const roomId in roomUsers) {
        roomUsers[roomId] = roomUsers[roomId].filter(id => id !== socket.id);
        if (roomUsers[roomId].length === 0) {
          delete roomUsers[roomId];
        }
      }
      console.log('Client disconnected');
    });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
