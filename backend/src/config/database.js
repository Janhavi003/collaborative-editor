const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    // Log when connection is lost
    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("[MongoDB] Reconnected.");
    });

  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    // Exit process — server is useless without a DB
    process.exit(1);
  }
};

module.exports = connectDB;