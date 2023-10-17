import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { roomHandler } from "./room";

const port = 8080;
const app = express();
app.use(cors);
const server = http.createServer(app); // this is our 'http' server

// we need to pass options for the cors to our server
// creating instance of our server i.e. 'io', using this Server (from socket.io) and passing our http server to it
// used origin like this to be used from everywhere just for simplicity
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// when the client will try to connect to our web signalling server then this will be triggered i.e. connection event will be fired
// ... and we will be listening to the server
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
