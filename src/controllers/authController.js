import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateTokens = (user) => {
  const accessToken = jwt.sign({ userId: user.id, fullName: user.fullName }, process.env.JWT_SECRET, { expiresIn: '15min' });
  const refreshToken = jwt.sign({ userId: user.id, fullName: user.fullName }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const signup = async (req, res) => {
  const { email, password, fullName, phoneNumber, speciality, bio } = req.body;
  try {
    if (!email || !password || !bio || !fullName || !phoneNumber || !speciality) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Password validation: 8+ chars, 1 uppercase, 1 lowercase, 1 digit
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.'
      });
    }


    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.medecin.create({
      data: { email, password: hashed, fullName, speciality, phoneNumber, bio }
    });
    const { accessToken, refreshToken } = generateTokens(user);
    res
      .status(201)
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({ user: { id: user.id, fullName }, accessToken });
  } catch (err) {
    // Prisma unique constraint error code: 'P2002'
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'email or Username unavailable', success: false });
    }
    console.log(err.message);
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.medecin.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
    const { accessToken, refreshToken } = generateTokens(user);
    res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }).json({ user: { id: user.id, fullName: user.fullName } , accessToken });
    
  } catch (err) {
    console.log(err.message)
    res.status(500).json({ message: 'Login failed', error: err.message, success: false });
  }
};

export const refreshToken = async (req, res) => {
  const userId = req.userId;
  try {
    const user = await prisma.medecin.findUnique({ where: { id: userId } });
    const { accessToken, refreshToken } = generateTokens(user);
    res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }).json({ user: { id: user.id, fullName: user.fullName } , accessToken });
  } catch (err) {
    console.log(err.message);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};



export const logout = async (req, res) => {
  
  
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  
    // Optional: log or do other cleanup (invalidate refresh token from DB if needed)
  
    return res.status(200).json({ message: 'Logged out successfully' });
  
};

