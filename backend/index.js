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
  origin: 'https://main--moveo-test.netlify.app', 
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors(corsOptions));

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 
})
  .then(() => {
    console.log('MongoDB connected');
    const db = mongoose.connection.useDb('testMoveo');

    // Model declaration for CodeBlock
    const CodeBlock = db.model('CodeBlock', new mongoose.Schema({
      title: String,
      code: String
    }));

    // Model declaration for Solution

    const Solution = db.model('Solution', new mongoose.Schema({
      codeBlockId: mongoose.Schema.Types.ObjectId,
      solution: String
    }));
    app.use(express.json());

// Express route to check server status
app.get('/', (req, res) => {
  res.send('Server is running');
  // Responds with a simple message to confirm the server is operational
});

// Route to fetch all code blocks from the database
app.get('/codeblocks', async (req, res) => {
  try {
      const codeblocks = await CodeBlock.find();
      res.json(codeblocks); // Sends the retrieved code blocks as JSON response
  } catch (err) {
      res.status(500).json({ message: err.message }); // Sends an error message if database retrieval fails
  }
});

// Route to fetch a specific code block by its ID
app.get('/codeblock/:id', async (req, res) => {
  try {
      const codeblock = await CodeBlock.findById(req.params.id);
      if (!codeblock) return res.status(404).json({ message: 'Code block not found' });
      res.json(codeblock); // Sends the specific code block as JSON response
  } catch (err) {
      res.status(500).json({ message: err.message }); // Sends an error message if retrieval fails
  }
});

// Route to fetch a solution associated with a specific code block
app.get('/solution/:codeBlockId', async (req, res) => {
  try {
      const solution = await Solution.findOne({ codeBlockId: req.params.codeBlockId });
      if (!solution) return res.status(404).json({ message: 'Solution not found' });
      res.json(solution); // Sends the solution as JSON response
  } catch (err) {
      res.status(500).json({ message: err.message }); // Sends an error message if retrieval fails
  }
});

// Set up Socket.io for real-time communication
const io = socketIo(server, {
  cors: {
      origin: 'https://main--moveo-test.netlify.app', // Update to restrict to the correct URL
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: true
  }
});

const roomUsers = {}; // Object to track users in each room

// Handle new client connections
io.on('connection', (socket) => {
  console.log('New client connected');

  // Event listener for joining a room
  socket.on('joinRoom', (roomId) => {
      socket.join(roomId); // Adds the client to the specified room
      if (!roomUsers[roomId]) {
          roomUsers[roomId] = [];
      }

      // Assigns the first user in a room as 'mentor', others as 'students'
      const userRole = roomUsers[roomId].length === 0 ? 'mentor' : 'student';
      roomUsers[roomId].push(socket.id);

      socket.emit('role', userRole); // Notifies the client of their role
      console.log(`Client joined room: ${roomId} as ${userRole}`);
  });

  // Event listener for code updates
  socket.on('codeUpdate', (data) => {
      const { roomId, code } = data;
      console.log(`Code update received for room ${roomId}: ${code}`);
      socket.to(roomId).emit('codeUpdate', code); // Broadcasts the code update to the room
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
      for (const roomId in roomUsers) {
          roomUsers[roomId] = roomUsers[roomId].filter(id => id !== socket.id);
          if (roomUsers[roomId].length === 0) {
              delete roomUsers[roomId]; // Removes empty rooms from tracking
          }
      }
      console.log('Client disconnected');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

  })
  .catch(err => console.error('MongoDB connection error:', err));