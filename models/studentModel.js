const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },

    matricNumber: {
      type: String,
      required: [true, 'Matric number is required'],
      trim: true,
      unique: true
    },

    courses: {
      type: [String],
      required: true
    }
  }
);

module.exports = mongoose.model('Student', studentSchema);