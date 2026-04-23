const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const connectDB = require("./config/database");
const passport = require("./config/passport");
const { initializeSocket } = require("./socket");
const documentRoutes = require("./routes/documents");
const authRoutes = require("./routes/auth");

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

initializeSocket(io);

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});