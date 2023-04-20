const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/chipers';

mongoose.connect(dbUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String },
  location: { type: String },
  interests: [{ type: String }]
});

userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ _id: this._id }, 'mysecretkey');
}

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());
 app.get("/",(req,res)=>{
    console.log("hello")
 })
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = user.generateAuthToken();

    res.status(200).json({ token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, email, bio, location } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, {
      username,
      email,
      bio,
      location
    }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
}

res.status(200).json({
  id: user._id,
  username: user.username,
  email: user.email,
  bio: user.bio,
  location: user.location,
  interests: user.interests
});

} catch (error) {
console.error(error);
res.status(500).json({ message: 'Internal server error' });
}
});

app.put('/api/users/:id/password', async (req, res) => {
try {
const { currentPassword, newPassword } = req.body;

vbnet

if (!currentPassword || !newPassword) {
  return res.status(400).json({ message: 'Current password and new password are required' });
}

const user = await User.findById(req.params.id);

if (!user) {
  return res.status(404).json({ message: 'User not found' });
}

const isMatch = await bcrypt.compare(currentPassword, user.password);

if (!isMatch) {
  return res.status(401).json({ message: 'Current password is incorrect' });
}

const hashedPassword = await bcrypt.hash(newPassword, 10);

user.password = hashedPassword;
await user.save();

res.status(200).json({ message: 'Password updated successfully' });

} catch (error) {
console.error(error);
res.status(500).json({ message: 'Internal server error' });
}
});

app.put('/api/users/:id/interests', async (req, res) => {
try {
const { interests } = req.body;

php

if (!interests || !Array.isArray(interests)) {
  return res.status(400).json({ message: 'Interests should be an array' });
}

const user = await User.findByIdAndUpdate(req.params.id, { interests }, { new: true });

if (!user) {
  return res.status(404).json({ message: 'User not found' });
}

res.status(200).json({ message: 'Interests updated successfully' });

} catch (error) {
console.error(error);
res.status(500).json({ message: 'Internal server error' });
}
});

app.get('/api/users/:id/followers', async (req, res) => {
try {
const { page = 1, limit = 5 } = req.query;

less

const user = await User.findById(req.params.id);

if (!user) {
  return res.status(404).json({ message: 'User not found' });
}

const followers = user.followers.slice((page - 1) * limit, page * limit);

res.status(200).json({
  totalFollowers: user.followers.length,
  currentPage: parseInt(page),
  totalPages: Math.ceil(user.followers.length / limit),
  followers
});

} catch (error) {
console.error(error);
res.status(500).json({ message: 'Internal server error' });
}
});

app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => console.log(`Listening on port ${port})`));