require('dotenv').config();

const express = require('express');
const cors = require('cors');

const roomRoutes = require('./routes/roomRoutes');
const gameRoutes = require('./routes/gameRoutes');
const gachaRoutes = require('./routes/gachaRoutes');
const playerRoutes = require('./routes/playerRoutes');

const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const { checkElasticConnection } = require('./services/elasticService');

const app = express();
const PORT = process.env.PORT || 3005;

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

    endpoints: {

      health: "/health",

      elastic: "/health/elastic",

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

    timestamp:
    new Date().toISOString()

  });

});

/* ======================
   Elastic Health Check
====================== */

app.get('/health/elastic', async (req,res)=>{

  try{

    const status =
    await checkElasticConnection();

    res.json(status);

  }
  catch(error){

    res.status(500).json({

      status:"error",

      error:error.message

    });

  }

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

      "POST /api/gacha/open-pack",

      "GET /api/gacha/questions",

      "POST /api/players/create",

      "GET /health",

      "GET /health/elastic"

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
