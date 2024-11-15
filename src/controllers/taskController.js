// Add Task Function
module.exports.addTask = async (io, msg) => { // io is passed directly
  try {
    const newTask = await taskService.createTask(msg); // Assuming taskService.createTask creates a new task
    console.log("Task added:", newTask);

    // Emit the new task to all connected clients
    io.emit("taskAdded", newTask); // Emit to all clients
  } catch (error) {
    console.error("Error in addTask controller:", error);
  }
};
