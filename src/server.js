import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import medecinRoutes from './routes/medecin.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';
import adsRoutes from './routes/ads.js';
import complementaryExamsRoutes from './routes/complementaryExams.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initializeWebSocket } from './services/websocketService.js';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/auth', authRoutes);
app.use('/medecin/ads', adsRoutes);
app.use('/medecin/complementary-exams', complementaryExamsRoutes);
app.use('/medecin', medecinRoutes);
app.use('/admin', adminRoutes);
app.use('/public', publicRoutes);

app.get('/', (req, res) => {
  res.status(200).send('API is running');
});

// Initialize WebSocket server
initializeWebSocket(httpServer);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
