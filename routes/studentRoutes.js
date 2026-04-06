const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');

const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  patchStudent,
  deleteStudent
} = require('../controllers/studentController');

// Protected routes
router.get('/', auth, getStudents);
router.get('/:id', auth, getStudent);
router.post('/', auth, createStudent);
router.put('/:id', auth, updateStudent);
router.patch('/:id', auth, patchStudent);
router.delete('/:id', auth, deleteStudent);

module.exports = router;