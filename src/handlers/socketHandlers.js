// src/handlers/socketHandlers.js
const jwt = require("jsonwebtoken");
const TaskModel = require("../model/Task");
const UserModel = require("../model/User");
const JWT_SECRET_KEY = "albinshiju";

const verifyJWT = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET_KEY);
  } catch (error) {
    return null;
  }
};

const addTaskHandler = async (socket, { userTask, token }) => {
  try {
    const decoded = verifyJWT(token);
    if (!decoded) {
      socket.emit("error", "Invalid token");
      return;
    }

    const user = await UserModel.findById(decoded.userId);
    const newTask = new TaskModel({ userId: user._id, title: userTask.title });
    await newTask.save();
    socket.emit("taskAdded", newTask);
  } catch (error) {
    console.error("Error adding task:", error);
  }
};

const getTasksHandler = async (socket, token) => {
  try {
    const decoded = verifyJWT(token);
    if (!decoded) {
      socket.emit("error", "Invalid token");
      return;
    }

    const tasks = await TaskModel.find({ userId: decoded.userId }).sort({ createdAt: -1 });
    socket.emit("fetchTask", tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
};

const toggleTaskCompletionHandler = async (socket, { token, id }) => {
  try {
    const decoded = verifyJWT(token);
    if (!decoded) {
      socket.emit("error", "Invalid token");
      return;
    }

    const task = await TaskModel.findById(id);
    if (!task) {
      socket.emit("error", "Task not found");
      return;
    }

    task.isCompleted = !task.isCompleted;
    await task.save();

    socket.emit("taskUpdated", {
      success: true,
      message: task.isCompleted ? "Task marked as completed" : "Task marked as incomplete",
    });
  } catch (error) {
    console.error("Error updating task:", error);
    socket.emit("error", "Error updating task");
  }
};

const deleteTaskHandler = async (socket, id) => {
  try {
    await TaskModel.findByIdAndDelete(id);
    socket.emit("taskDeleted", { success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    socket.emit("error", "Error deleting task");
  }
};

const editTaskHandler = async (socket, { editingTask, editableTaskTitle, token }) => {
  try {
    const decoded = verifyJWT(token);
    if (!decoded) {
      socket.emit("error", "Invalid token");
      return;
    }

    const task = await TaskModel.findById(editingTask._id);
    if (!task) {
      socket.emit("error", "Task not found");
      return;
    }

    task.title = editableTaskTitle;
    await task.save();

    socket.emit("taskUpdated", { success: true, message: "Task updated" });
  } catch (error) {
    console.error("Error editing task:", error);
    socket.emit("error", "Error editing task");
  }
};

module.exports = {
  addTaskHandler,
  getTasksHandler,
  toggleTaskCompletionHandler,
  deleteTaskHandler,
  editTaskHandler,
};
