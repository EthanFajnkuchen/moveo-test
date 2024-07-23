const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const corsOptions = {
  origin: 'http://localhost:5173', // Update this later to restrict to your Netlify URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors(corsOptions));

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds instead of 30 seconds
})
  .then(() => {
    console.log('MongoDB connected');

    // Use a specific database
    const db = mongoose.connection.useDb('testMoveo');

    // Define your models using the specific database
    const CodeBlock = db.model('CodeBlock', new mongoose.Schema({
      title: String,
      code: String
    }));

    const Solution = db.model('Solution', new mongoose.Schema({
      codeBlockId: mongoose.Schema.Types.ObjectId,
      solution: String
    }));

    // Set up your routes
    app.use(express.json());

    app.get('/', (req, res) => {
      res.send('Server is running');
    });

    app.get('/codeblocks', async (req, res) => {
      try {
        const codeblocks = await CodeBlock.find();
        res.json(codeblocks);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.get('/codeblock/:id', async (req, res) => {
      try {
        const codeblock = await CodeBlock.findById(req.params.id);
        if (!codeblock) return res.status(404).json({ message: 'Code block not found' });
        res.json(codeblock);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.get('/solution/:codeBlockId', async (req, res) => {
      try {
        const solution = await Solution.findOne({ codeBlockId: req.params.codeBlockId });
        if (!solution) return res.status(404).json({ message: 'Solution not found' });
        res.json(solution);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // Set up Socket.io communication
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

  })
  .catch(err => console.error('MongoDB connection error:', err));