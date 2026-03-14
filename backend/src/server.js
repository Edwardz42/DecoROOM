const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const roomRoutes = require('./routes/roomRoutes');
const gameRoutes = require('./routes/gameRoutes');
const gachaRoutes = require('./routes/gachaRoutes');
const playerRoutes = require('./routes/playerRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3005;
const BOOT_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ======================
   Middleware
====================== */

app.use(cors());
app.use(express.json());

/* ======================
   Root Route (IMPORTANT)
====================== */

app.get('/', (req, res) => {
  res.json({
    name: "Knowledge Battle API",
    status: "running",
    version: "1.0",
    bootId: BOOT_ID,
    endpoints: {
      health: "/health",
      rooms: "/api/rooms",
      game: "/api/game",
      gacha: "/api/gacha",
      players: "/api/players"
    }
  });
});

/* ======================
   Health Check
====================== */

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Backend running',
    timestamp: new Date().toISOString(),
    bootId: BOOT_ID
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Backend running',
    timestamp: new Date().toISOString(),
    bootId: BOOT_ID
  });
});

/* ======================
   Route Debug Helper
====================== */

app.get('/routes', (req,res)=>{
  res.json({
    routes:[
      "POST /api/rooms/create",
      "POST /api/rooms/join",
      "POST /api/rooms/ready",
      "GET /api/rooms/:id",

      "POST /api/game/start",
      "POST /api/game/submit",
      "GET /api/game/state",

      "POST /api/gacha/pull",

      "POST /api/players/create"
    ]
  });
});

/* ======================
   Game Routes
====================== */

app.use('/api/rooms', roomRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/gacha', gachaRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/ai', aiRoutes);

/* ======================
   Error Handling
====================== */

app.use(notFoundHandler);
app.use(errorHandler);

/* ======================
   Server Start
====================== */

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});