import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { roomHandler } from "./room";

const port = 8000;
const app = express();
app.use(cors);
const server = http.createServer(app);

// we need to pass options for the cors to our server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// when the client will try to connect to our web signalling server then this will be triggered
io.on("connection", (socket) => {
  console.log("User is connected");
  roomHandler(socket);
  socket.on("disconnect", () => {
    console.log("User is disconnected");
  });
}); // now the client is been set up in App.tsx in client folder

server.listen(port, () => {
  console.log(`Listening to the server at ${port}`);
});
