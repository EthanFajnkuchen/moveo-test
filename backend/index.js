require('./config/db')
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const CodeBlock = require('./models/CodeBlock');
const Solution = require('./models/Solution');
const cors = require('cors');
const corsOptions = {
  origin: '*', // Change to your specific origin
  credentials: true,
  'allowedHeaders': ['sessionId', 'Content-Type'],
  'methods': ['GET','POST'],
};


const app = express();
const server = http.createServer(app);
// const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Routes
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
    console.log(`Fetching solution for codeBlockId: ${req.params.codeBlockId}`); // Log for debugging
    const solution = await Solution.findOne({ codeBlockId: req.params.codeBlockId });
    if (!solution) return res.status(404).json({ message: 'Solution not found' });
    res.json(solution);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Socket.io setup with CORS options
const io = socketIo(server, {
  cors: {
    origin: '*', // Change to your specific origin
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }
});

// Socket.io room users management
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
    console.log(`Code update received for room ${roomId}: ${code}`); // Log for debugging
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
    console.log(roomUsers);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});