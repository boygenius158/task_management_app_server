const mongoose = require("mongoose");

const connectDatabase = async () => {
  const uri = 'mongodb+srv://albinshiju30284:albin555@tmd.d3yh5.mongodb.net/?retryWrites=true&w=majority&appName=tmd';

  const options = {
    useNewUrlParser: true, // Use the new URL parser to handle the URI connection string.
    useUnifiedTopology: true, // Use the new topology engine.
    serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds if no server is selected.
    socketTimeoutMS: 45000, // Timeout for socket inactivity after 45 seconds.
  };

  try {
    await mongoose.connect(uri, options);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error.message);
    // Retry after 5 seconds in case of an error
    setTimeout(connectDatabase, 5000);
  }
};

module.exports = connectDatabase;
