const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/User");
const JWT_SECRET_KEY = "albinshiju";

const registerUser = async (req, res) => {
  console.log("register");

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login user
const loginUser = async (req, res) => {
  console.log("Logging in user");

  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find user by email
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET_KEY,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Set token in session and cookie
    req.session.token = token;

    // Use secure cookies in production
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure cookies in production
      maxAge: 3600 * 1000, // 1 hour
    };

    res.cookie("authToken", token, cookieOptions);

    // Send user profile and token
    const userProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(200).json({
      message: "Login successful",
      token,
      userProfile,
    });
  } catch (error) {
    console.error("Error logging in user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Check authentication
const checkAuth = async (req, res) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Authenticated", user: user.toObject() });
  } catch (error) {
    console.error("Error verifying token:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Logout user
const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie("authToken", { httpOnly: true, secure: false });
    res.status(200).json({ message: "User logged out successfully" });
  });
};

module.exports = { registerUser, loginUser, checkAuth, logoutUser };
