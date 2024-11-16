// server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const session = require("express-session");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");
const connectDatabase = require("./src/utils/connectDatabase");
const authRoutes = require("./src/route/authRoutes");
const {
  addTaskHandler,
  getTasksHandler,
  toggleTaskCompletionHandler,
  deleteTaskHandler,
  editTaskHandler,
} = require("./src/handlers/socketHandlers");

const app = express();
const server = http.createServer(app);
const JWT_SECRET_KEY = "albinshiju";

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  session({ secret: JWT_SECRET_KEY, resave: false, saveUninitialized: true })
);

app.use(
  cors({
    origin:
    [ 
      "http://localhost:3000",
      "https://tmdapplication.vercel.app",
    ],
    credentials: true,
  })
);

const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://tmdapplication.vercel.app",
    ],
    methods: ["GET", "POST", "PATCH"],
  },
});

app.use("/api", authRoutes);
app.get("/test", (req, res) => {
  res.send("test success");
});
// Connect to the database
connectDatabase();

// Socket.io events
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("addTask", addTaskHandler.bind(null, socket));
  socket.on("getTasks", getTasksHandler.bind(null, socket));
  socket.on("isCompleted", toggleTaskCompletionHandler.bind(null, socket));
  socket.on("deleteTask", deleteTaskHandler.bind(null, socket));
  socket.on("handleTaskEdit", editTaskHandler.bind(null, socket));

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(5000, () => {
  console.log("Server is listening on port 5000");
});
