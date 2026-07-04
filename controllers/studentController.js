const Student = require('../models/studentModel');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isAdmin = (user) => user?.role === 'admin';
const isLecturer = (user) => user?.role === 'lecturer';
const isStudent = (user) => user?.role === 'student';

const ownsStudent = (req, student) => {
  if (!student || !req.user) return false;
  const createdBy = student.createdBy?.toString();
  const ownerUser = student.ownerUser?.toString();
  return createdBy === req.user.id || ownerUser === req.user.id || student.email === req.user.email;
};

const visibleStudentQuery = (req) => {
  if (isAdmin(req.user)) return {};
  if (isLecturer(req.user)) return { createdBy: req.user.id };
  return {
    $or: [
      { ownerUser: req.user.id },
      { email: req.user.email }
    ]
  };
};

const sanitizeStudentPayload = (body = {}) => {
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const matricNumber = body.matricNumber?.trim();
  const courses = Array.isArray(body.courses)
    ? body.courses.map((course) => String(course).trim()).filter(Boolean)
    : body.courses;

  return { name, email, matricNumber, courses };
};

const validateFullStudent = ({ name, email, matricNumber, courses }) => {
  if (!name || !email || !matricNumber || !courses) return 'All fields are required';
  if (!Array.isArray(courses)) return 'Courses must be an array';
  if (!courses.length) return 'Add at least one course';
  if (!isValidEmail(email)) return 'Invalid email format';
  return null;
};

const getStudents = async (req, res) => {
  try {
    const students = await Student.find(visibleStudentQuery(req)).sort({ createdAt: -1, name: 1 });
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (!isAdmin(req.user) && !ownsStudent(req, student)) {
      return res.status(403).json({ error: 'You can only view students you are allowed to access' });
    }

    res.json(student);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID format' });
  }
};

const createStudent = async (req, res) => {
  try {
    const payload = sanitizeStudentPayload(req.body);

    if (isStudent(req.user)) {
      payload.email = req.user.email;
      const existingProfile = await Student.findOne({
        $or: [{ ownerUser: req.user.id }, { email: req.user.email }]
      });
      if (existingProfile) {
        return res.status(400).json({ error: 'Your student profile already exists' });
      }
    }

    const validationError = validateFullStudent(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const duplicate = await Student.findOne({
      $or: [{ email: payload.email }, { matricNumber: payload.matricNumber }]
    });
    if (duplicate) {
      return res.status(400).json({ error: 'Email or matric number already exists' });
    }

    const student = await Student.create({
      ...payload,
      createdBy: req.user.id,
      ownerUser: isStudent(req.user) ? req.user.id : null
    });

    res.status(201).json({
      message: 'Student created successfully',
      student
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (!isAdmin(req.user) && !ownsStudent(req, student)) {
      return res.status(403).json({ error: 'You can only update your own allowed student record' });
    }

    const payload = sanitizeStudentPayload(req.body);
    if (isStudent(req.user)) payload.email = req.user.email;

    const validationError = validateFullStudent(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const duplicate = await Student.findOne({
      $or: [{ email: payload.email }, { matricNumber: payload.matricNumber }],
      _id: { $ne: req.params.id }
    });
    if (duplicate) {
      return res.status(400).json({ error: 'Email or matric number already exists' });
    }

    Object.assign(student, payload);
    if (isStudent(req.user)) student.ownerUser = req.user.id;
    await student.save();

    res.json({ message: 'Student fully updated', student });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID format' });
  }
};

const patchStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (!isAdmin(req.user) && !ownsStudent(req, student)) {
      return res.status(403).json({ error: 'You can only update your own allowed student record' });
    }

    const updateData = {};
    const { name, email, matricNumber, courses } = req.body;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) return res.status(400).json({ error: 'Name cannot be empty' });
      updateData.name = trimmedName;
    }

    if (email !== undefined && !isStudent(req.user)) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) return res.status(400).json({ error: 'Email cannot be empty' });
      if (!isValidEmail(trimmedEmail)) return res.status(400).json({ error: 'Invalid email format' });
      updateData.email = trimmedEmail;
    }

    if (matricNumber !== undefined) {
      const trimmedMatricNumber = matricNumber.trim();
      if (!trimmedMatricNumber) return res.status(400).json({ error: 'Matric number cannot be empty' });
      updateData.matricNumber = trimmedMatricNumber;
    }

    if (courses !== undefined) {
      if (!Array.isArray(courses)) return res.status(400).json({ error: 'Courses must be an array' });
      const cleanedCourses = courses.map((course) => String(course).trim()).filter(Boolean);
      if (!cleanedCourses.length) return res.status(400).json({ error: 'Add at least one course' });
      updateData.courses = cleanedCourses;
    }

    if (updateData.email || updateData.matricNumber) {
      const duplicate = await Student.findOne({
        $or: [
          ...(updateData.email ? [{ email: updateData.email }] : []),
          ...(updateData.matricNumber ? [{ matricNumber: updateData.matricNumber }] : [])
        ],
        _id: { $ne: req.params.id }
      });
      if (duplicate) return res.status(400).json({ error: 'Email or matric number already exists' });
    }

    Object.assign(student, updateData);
    if (isStudent(req.user)) student.ownerUser = req.user.id;
    await student.save();

    res.json({ message: 'Student updated successfully', student });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID format' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (!isAdmin(req.user) && !(isLecturer(req.user) && ownsStudent(req, student))) {
      return res.status(403).json({ error: 'Only admins can delete any student; lecturers can delete only students they added' });
    }

    await student.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID format' });
  }
};

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  patchStudent,
  deleteStudent,
};
