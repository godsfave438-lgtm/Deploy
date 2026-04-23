require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const cors = require("cors");
app.use(cors());

connectDB()
  .catch(err => console.log(err));

// Sample routes
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: "Invalid JSON format" });
  }
  next();
});
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("MONGO URI:", process.env.MONGO_URI);
  console.log(`Server is running on http://localhost:${port}`);
});