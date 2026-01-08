const app = require("./src/app");
const connectDB = require('./src/config/db');
require('dotenv').config();

const PORT = process.env.PORT || 10000; // Render usually sets this, default to 10000 if missing

// Connect to Database first, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to connect to Database", err);
  process.exit(1);
});
