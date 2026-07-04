const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.authSecret || 'secretkey';
const roles = ['admin', 'lecturer', 'student'];
const protectedRoleCodes = {
  admin: process.env.ADMIN_ACCESS_CODE,
  lecturer: process.env.LECTURER_ACCESS_CODE
};

const roleLabel = (role) => role.charAt(0).toUpperCase() + role.slice(1);

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const signToken = (user) => jwt.sign(
  { id: user._id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '1d' }
);

const register = async (req, res) => {
  try {
    const { name = '', email, password, role = 'student', accessCode = '' } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!roles.includes(role)) {
      return res.status(400).json({ error: 'Choose admin, lecturer, or student' });
    }

    if (role === 'admin' || role === 'lecturer') {
      const expectedCode = protectedRoleCodes[role];
      if (!expectedCode) {
        return res.status(500).json({ error: roleLabel(role) + ' access code is not configured' });
      }
      if (String(accessCode).trim() !== expectedCode) {
        return res.status(403).json({ error: 'Invalid ' + role + ' access code' });
      }
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email,
      password: hashed,
      role
    });

    res.status(201).json({
      message: 'User created',
      user: publicUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and new password required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Account not found' });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Password reset' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login, resetPassword, me };
