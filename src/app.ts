import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import roomRoutes from './routes/room.routes';
import objectRoutes from './routes/object.routes';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import wsService from './services/wsService';
import searchRoutes from './routes/search.routes';
import http from 'http';
import path from 'path';
import historyRoutes from './routes/history.routes';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

// Initialize WebSocket before routes
wsService.initialize(server);

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/objects', objectRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/history', historyRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default server; 