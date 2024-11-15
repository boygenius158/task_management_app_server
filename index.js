const express = require("express");
const http = require("http");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const socketIo = require("socket.io");
const UserModel = require("./src/model/User");
const cookieParser = require("cookie-parser");
const TaskModel = require("./src/model/Task");
const { error } = require("console");

const app = express();
const server = http.createServer(app);
const JWT_SECRET_KEY = "albinshiju";

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: JWT_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
  })
);

// Configure CORS with credentials
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "task-management-app-client-red.vercel.app",
    ],
    credentials: true,
  })
);

// Set up Socket.IO
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "task-management-app-client-red.vercel.app",
    ],
    methods: ["GET", "POST", "PATCH"],
  },
});

// MongoDB Connection
const connectDatabase = async () => {
  const uri = "mongodb://127.0.0.1:27017/tmd";
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connected");
  } catch (error) {
    console.error("Database error", error);
  }
};

// Routes

// Register user
app.post("/api/register-user", async (req, res) => {
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
});

// Login user
// Login user
app.post("/api/login-user", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find the user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Create a token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET_KEY
      // { expiresIn: "1h" }
    );

    // Set the token in a cookie (for dev environment)
    req.session.token = token;
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: false, // Not secure in dev, adjust for production
      maxAge: 3600 * 1000, // 1 hour
    });

    // Send the token and the user profile in the response
    const userProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      // Include any other profile information you need
    };

    res.status(200).json({
      message: "Login successful",
      token,
      userProfile, // Send user profile along with the token
    });
  } catch (error) {
    console.error("Error logging in user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Auth check
// Backend: Updated /api/check-auth route
app.get("/api/check-auth", async (req, res) => {
  const token = req.cookies.authToken;

  console.log("token ", token);

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    // Verify the token and decode it
    const decoded = jwt.verify(token, JWT_SECRET_KEY);

    // Fetch the user from the database using the userId in the token
    const user = await UserModel.findById(decoded.userId);
    console.log(user);

    // If no user is found, respond with an error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user document as an object
    res.status(200).json({
      message: "Authenticated",
      user: user.toObject(), // Send user document as an object
    });
  } catch (error) {
    console.error("Error verifying token:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

app.post("/api/logout-user", (req, res) => {
  // Destroy the session (remove session data)
  console.log("logout");

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }

    // Clear the authToken cookie
    res.clearCookie("authToken", { httpOnly: true, secure: false }); // set secure: true in production
    res.status(200).json({ message: "User logged out successfully" });
  });
});
// Backend route
app.patch("/api/tasks/:id/completed", async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  try {
    // Update the task in the database or wherever it is stored
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { completed },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error updating task completion:", error);
    res.status(500).json({ message: "Error updating task completion" });
  }
});

const verifyjwt = (token) => {
  console.log(token, "99ti");

  return jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log("Invalid token:", err);
      throw new Error();
    } else {
      // console.log("Decoded token:", decoded);
      return true;
    }
  });
};
// Connect to the database and start the server
connectDatabase();
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("taskAdded", (task) => {
    io.emit("taskAdded", task);
  });
  socket.on("sentMessage", (token) => {
    console.log(token);
    console.log();
  });

  socket.on("addTask", async ({ userTask, token }) => {
    console.log("Emitting addTask event:", { userTask, token });

    try {
      // Create and save the new task to the database
      console.log(userTask);
      const { userId } = jwt.verify(token, JWT_SECRET_KEY);
      if (verifyjwt(token)) {
        const user = await UserModel.findById(userId);
        const newTask = new TaskModel({
          userId: user._id,
          title: userTask.title,
        });

        await newTask.save(); // Save the task in the DB
        // console.log("New task added:", newTask);

        // Emit the newly created task to all connected clients
        console.log("#123", newTask);

        socket.emit("taskAdded", newTask);
      } else {
        console.error("Error updating task", error);
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  });

  socket.on("getTasks", async (token) => {
    console.log(token, "gettaksks");
    const { userId } = jwt.verify(token, JWT_SECRET_KEY);
    if (verifyjwt(token)) {
      const tasks = await TaskModel.find({ userId }).sort({ createdAt: -1 });
      // console.log(tasks);
      socket.emit("fetchTask", tasks);
    } else {
      console.error("Error updating task", error);
    }
  });

  socket.on("isCompleted", async ({ token, id }) => {
    console.log(token, id, "isCompleted2");

    const { userId } = jwt.verify(token, JWT_SECRET_KEY);
    if (verifyjwt(token)) {
      const task = await TaskModel.findById(id);
      if (!task) {
        console.log("id333", id);

        throw new Error("task not found");
      }
      const previousState = task.isCompleted;
      if (!task) {
        throw new Error();
      }

      task.isCompleted = !previousState;

      await task.save();

      const status = task.isCompleted;
      console.log("status", status);

      if (status) {
        socket.emit("taskUpdated", {
          success: true,
          message: "Task Marked As Completed",
        });
      } else {
        socket.emit("taskUpdated", {
          success: false,
          message: "Task Marked As Completed",
        });
      }
    } else {
      console.error("Error updating task", error);
      socket.emit("taskUpdated", {
        success: false,
        message: "Task Marked As Completed",
      });
    }
  });

  socket.on("deleteTask", async (id) => {
    const deleted = await TaskModel.findByIdAndDelete(id);
  });

  socket.on(
    "handleTaskEdit",
    async ({ editingTask, editableTaskTitle, token }) => {
      console.log("handle task edited", editingTask, editableTaskTitle, token);
      const task = await TaskModel.findById(editingTask._id);
      if (!task) {
        throw new Error("task not found");
      }
      task.title = editableTaskTitle;
      await task.save();
    }
  );

  socket.on("getTasks", (msg) => {
    console.log(msg);
  });

  socket.on("disconnect", () => {
    console.log("a user dissconnected");
  });
});
server.listen(5000, () => {
  console.log("Server is listening on port 5000");
});
