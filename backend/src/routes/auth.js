import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { auth as authenticate } from "../middleware/auth.js";

const router = express.Router();

const users = []; // In-memory user storage

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, pass } = req.body;

    // Checks if email and password exist
    if(!email || !pass){
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Checks if email is in valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format"
      })
    }

    // Checks if password is at least 8 characters long
    if(pass.length < 8){
      return res.status(400).json({
        error: "Password must be atleast 8 characters long"
      })
    }
    
    //Checks if email already exists in the database
    if(users.find(user => user.email === email)){
      return res.status(400).json({
        error: "Email already exists"
      });
    }

    // Hash the password using bcrypt
    const saltRounds = 12;
    const hashedPass = await bcrypt.hash(req.body.pass, saltRounds);

    //Creating a new user
    const newUser = {
      id: users.length + 1,
      email: req.body.email,
      pass: hashedPass,
      createdAt: new Date().toISOString()
    }

    console.log("All User input is valid, Registering user...");

    // Store the new user in the in-memory array
    users.push(newUser);

    res.status(201).json({
      message: "User registered successfully",
      createdAt: newUser.createdAt,
      user: {
        id: newUser.id,
        email: newUser.email
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try{
    const { email, pass } = req.body;

    // Checks if email and password exist
    if(!email || !pass){
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find the user by email through temp storage
    const user = users.find(user => user.email === email);
    if(!user){
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare the provided password with the hashed password
    const isPassValid = await bcrypt.compare(pass, user.pass);

    if(!isPassValid){
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create a JWT token
    const token = jwt.sign({
      id: user.id,
      email: user.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1d'
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  }
  catch( err ){
    next(err);
  }
});

// GET /auth/me
router.get('/me', authenticate,(req, res) => {
  const user = users.find(user => user.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  });
});

export { router };