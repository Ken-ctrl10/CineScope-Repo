import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/index.js";
import { auth as authenticate } from "../middleware/auth.js";

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, pass, name } = req.body;
    
    // Checks if email and password exist
    if (typeof email !== "string" || typeof pass !== "string" || !email.trim() || !pass) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Checks if email is in valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
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
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail }
    });
    
    if(existingUser){
      return res.status(400).json({
        error: "Email already exists"
      });
    }

    // Hash the password using bcrypt
    const saltRounds = 12;
    const hashedPass = await bcrypt.hash(pass, saltRounds);

    //Creating a new user
    const newUser = await prisma.users.create({
      data: {
        email: normalizedEmail  ,
        password_hash: hashedPass,
        name: name || normalizedEmail.split('@')[0], // Default name to the part before '@' if not provided
        plan: "FREE",
        theme_preference: "SYSTEM",
      }
    });

    console.log("All User input is valid, Registering user...");

    // Store the new user in the in-memory array
    // users.push(newUser);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: newUser.plan,
        theme_preference: newUser.theme_preference,
        create_at: newUser.create_at
      }
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return res.status(400).json({ error: "Email already exists" });
    }
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try{
    const { email, pass } = req.body;
    
    // Checks if email and password exist
    if (typeof email !== "string" || typeof pass !== "string" || !email.trim() || !pass) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find the user by email through Prisma
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail }
    });

    if(!user){
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare the provided password with the hashed password
    const isPassValid = await bcrypt.compare(pass, user.password_hash);

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
        email: user.email,
        name: user.name,
        plan: user.plan,
        theme_preference: user.theme_preference,
        create_at: user.create_at
      }
    });
  }
  catch( err ){
    next(err);
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      theme_preference: user.theme_preference,
      create_at: user.create_at
    });
  } catch (err) {
    next(err);
  }
});

export { router };