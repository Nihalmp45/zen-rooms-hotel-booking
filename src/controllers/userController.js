import User from "../models/userModel.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import Redis from "ioredis";

config();

const typeEnum = ["admin", "user"];

const redis = new Redis();

const valid = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

export const userSignupDetails = async (req, res) => {
  try {
    const { name, email, password, phone, type, address } = req.body;

    //validate name
    if (!name || name.length < 3) {
      return res.status(400).json({
        msg: "Name is required and should be at least 3 characters long.",
      });
    }
    //validate email
    if (!email || !valid(email)) {
      return res
        .status(400)
        .json({ msg: "Email is required and should be a valid email" });
    }
    //validate password
    if (!password || password.length < 8) {
      return res.status(400).json({
        msg: "Password is required and should be at least 8 characters",
      });
    }
    //validate phone
    if (!phone || phone.length < 10) {
      return res.status(400).json({
        msg: "Phone is required and should be at least 10 characters",
      });
    }
    //validate type
    if (!type || !typeEnum.includes(type)) {
      return res.status(400).json({ msg: "type must be admin or user" });
    }

    const alreadyRegistered = await User.find({ email });
    if (alreadyRegistered.length > 0) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    //hash password
    const hashedPassword = await argon2.hash(password);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      type,
      address,
    });
    await newUser.save();

    res.status(200).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

export const userLoginDetails = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and validate password
    const user = await User.findOne({ email });
    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // Prepare token data
    const tokenData = {
      id: user._id,
      username: user.name,
      email: user.email,
    };

    // Generate token
    let token;
    try {
      token = jwt.sign({ tokenData }, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });
    } catch (error) {
      console.error("Error generating token:", error.message);
      return res.status(500).json({ msg: "Error generating token" });
    }

    await redis.setex(`auth:${user._id}`, 3600, JSON.stringify(tokenData));

    // Set HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000, // 1 hour
    });

    // Send response
    res.status(200).json({
      success: true,
      data: tokenData,
      message: "Login successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: "Not authenticated" });

    // Check Redis cache first
    const cachedUser = await redis.get(`auth:${token}`);
    if (cachedUser) {
      return res
        .status(200)
        .json({ success: true, user: JSON.parse(cachedUser) });
    }

    jwt.verify(token, process.env.SECRET_KEY,async (err, decoded) => {
      if (err) return res.status(401).json({ msg: "Invalid token" });

  // Cache the user for future requests
  await redis.setex(`auth:${decoded.id}`, 3600, JSON.stringify(decoded));

      res.status(200).json({ success: true, user: decoded.tokenData });
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
};

export const logoutDetails = (req, res) => {
  res.clearCookie("token", { httpOnly: true });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
