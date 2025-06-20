const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:3000', // React dev server
    'http://127.0.0.1:3000',
    'https://likafood.vercel.app', // Production frontend
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);