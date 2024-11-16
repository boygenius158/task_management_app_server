// db.js
const mongoose = require("mongoose");

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

module.exports = connectDatabase;
