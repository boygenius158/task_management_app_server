const socketIo = require("socket.io"); // Initialize Socket.IO here
const taskController = require("../controllers/taskController");

const setupSocketIO = (server) => {
  const io = socketIo(server); // Attach io to the server

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Emitting when a new task is added
    socket.on("taskAdded", (task) => {
      io.emit("taskAdded", task); // Emit task to all connected clients
    });

    socket.on("sentMessage", (msg) => {
      console.log(msg);
    });

    // Add task
    socket.on("addTask", (task) => {
      taskController.addTask(io, task); // Pass io instance to addTask controller
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return io;
};

module.exports = setupSocketIO;
