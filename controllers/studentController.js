const Student = require('../models/studentModel');

// Email validator
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// =====================
// GET ALL STUDENTS
// =====================
const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =====================
// GET ONE STUDENT
// =====================
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID format" });
  }
};

// =====================
// CREATE STUDENT
// =====================
const createStudent = async (req, res) => {
  try {
    let { name, email, matricNumber, courses } = req.body;

    // Trim inputs
    name = name?.trim();
    email = email?.trim();
    matricNumber = matricNumber?.trim();

    // Validation
    if (!name || !email || !matricNumber || !courses) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!Array.isArray(courses)) {
      return res.status(400).json({ error: "Courses must be an array" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existing = await Student.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const student = await Student.create({
      name,
      email,
      matricNumber,
      courses
    });

    res.status(201).json({
      message: "Student created successfully",
      student
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =====================
// PUT (FULL UPDATE)
// =====================
const updateStudent = async (req, res) => {
  try {
    let { name, email, matricNumber, courses } = req.body;

    // Trim
    name = name?.trim();
    email = email?.trim();
    matricNumber = matricNumber?.trim();

    // Validate required
    if (!name || !email || !matricNumber || !courses) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!Array.isArray(courses)) {
      return res.status(400).json({ error: "Courses must be an array" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check duplicate email
    const duplicate = await Student.findOne({
      email,
      _id: { $ne: req.params.id }
    });

    if (duplicate) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { name, email, matricNumber, courses },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      message: "Student fully updated",
      student: updatedStudent
    });

  } catch (err) {
    res.status(400).json({ error: "Invalid ID format" });
  }
};

// =====================
// PATCH (PARTIAL UPDATE)
// =====================
const patchStudent = async (req, res) => {
  try {
    const { name, email, matricNumber, courses } = req.body;

    let updateData = {};

    // Name
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ error: "Name cannot be empty" });
      }
      updateData.name = trimmedName;
    }

    // Email
    if (email !== undefined) {
      const trimmedEmail = email.trim();

      if (!trimmedEmail) {
        return res.status(400).json({ error: "Email cannot be empty" });
      }

      if (!isValidEmail(trimmedEmail)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const duplicate = await Student.findOne({
        email: trimmedEmail,
        _id: { $ne: req.params.id }
      });

      if (duplicate) {
        return res.status(400).json({ error: "Email already exists" });
      }

      updateData.email = trimmedEmail;
    }

    // Other fields
    if (matricNumber !== undefined) {
      updateData.matricNumber = matricNumber.trim();
    }

    if (courses !== undefined) {
      if (!Array.isArray(courses)) {
        return res.status(400).json({ error: "Courses must be an array" });
      }
      updateData.courses = courses;
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      message: "Student updated successfully",
      student
    });

  } catch (err) {
    res.status(400).json({ error: "Invalid ID format" });
  }
};

// =====================
// DELETE
// =====================
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(400).json({ error: "Invalid ID format" });
  }
};

// EXPORTS
module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  patchStudent,
  deleteStudent,
};