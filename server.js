require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const cors = require("cors");

app.use(cors());
app.use(express.static(path.join(__dirname, 'Frontend')));

connectDB()
  .catch(err => console.log(err));

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/students', studentRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: "Invalid JSON format" });
  }
  next();
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
