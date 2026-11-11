const app = require('../src/app');
const connectDB = require('../src/config/database');

let connected = false;

module.exports = async (req, res) => {
  if (!connected) {
    try {
      await connectDB();
      connected = true;
    } catch (err) {
      console.error('Mongo connection failed:', err);
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  }
  return app(req, res);
};
