const mongoose = require("mongoose");

const connectDatabase = async () => {
//   const uri = "mongodb://127.0.0.1:27017/tmd"; // Local URI (commented for reference)
  const uri = 'mongodb+srv://albinshiju30284:albin555@tmd.d3yh5.mongodb.net/?retryWrites=true&w=majority&appName=tmd';

  try {
    await mongoose.connect(uri);
    console.log("Database connected");
  } catch (error) {
    console.error("Database error:", error);
  }
};

module.exports = connectDatabase;
