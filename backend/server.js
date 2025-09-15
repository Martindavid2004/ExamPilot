const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8084;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://exam-pilot.vercel.app',
  credentials: true
}));
app.use(express.json());

// Basic auth middleware (you should implement proper JWT auth)
const basicAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const credentials = Buffer.from(auth.slice(6), 'base64').toString().split(':');
  const [username, password] = credentials;
  
  // Simple hardcoded auth (replace with proper authentication)
  if (username === 'admin' && password === 'password123') {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_scheduler');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Schemas
const examFolderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  folderName: { type: String, required: true },
  description: String,
  timetables: [mongoose.Schema.Types.Mixed],
  timetableIds: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const timetableSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  tableName: { type: String, required: true },
  startDate: String,
  endDate: String,
  dayGap: Number,
  timetable: [mongoose.Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ExamFolder = mongoose.model('ExamFolder', examFolderSchema);
const Timetable = mongoose.model('Timetable', timetableSchema);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Routes

// Get all exam folders for a user
app.get('/api/exam-folders/user/:userId', basicAuth, async (req, res) => {
  try {
    const folders = await ExamFolder.find({ userId: req.params.userId });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new exam folder
app.post('/api/exam-folders', basicAuth, async (req, res) => {
  try {
    const folder = new ExamFolder(req.body);
    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update an exam folder
app.put('/api/exam-folders/:id', basicAuth, async (req, res) => {
  try {
    const folder = await ExamFolder.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json(folder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an exam folder
app.delete('/api/exam-folders/:id', basicAuth, async (req, res) => {
  try {
    const folder = await ExamFolder.findByIdAndDelete(req.params.id);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add timetable to folder
app.post('/api/exam-folders/:folderId/timetables', basicAuth, async (req, res) => {
  try {
    const folder = await ExamFolder.findById(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    folder.timetables.push(req.body);
    folder.updatedAt = new Date();
    await folder.save();
    
    res.json(folder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update timetable in folder
app.put('/api/exam-folders/:folderId/timetables/:timetableId', basicAuth, async (req, res) => {
  try {
    const folder = await ExamFolder.findById(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    const timetableIndex = folder.timetables.findIndex(t => t.id == req.params.timetableId);
    if (timetableIndex === -1) {
      return res.status(404).json({ error: 'Timetable not found' });
    }
    
    folder.timetables[timetableIndex] = req.body;
    folder.updatedAt = new Date();
    await folder.save();
    
    res.json(folder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete timetable from folder
app.delete('/api/exam-folders/:folderId/timetables/:timetableId', basicAuth, async (req, res) => {
  try {
    const folder = await ExamFolder.findById(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    folder.timetables = folder.timetables.filter(t => t.id != req.params.timetableId);
    folder.updatedAt = new Date();
    await folder.save();
    
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Separate timetable endpoints for future use
app.post('/api/timetables', basicAuth, async (req, res) => {
  try {
    const timetable = new Timetable(req.body);
    await timetable.save();
    res.status(201).json(timetable);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/timetables/:id', basicAuth, async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/timetables/:id', basicAuth, async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }
    res.json(timetable);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/timetables/:id', basicAuth, async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
