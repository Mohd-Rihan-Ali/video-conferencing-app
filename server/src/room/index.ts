import { Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const rooms: Record<string, string[]> = {}; // for storing the room ids'

interface IroomParams {
  roomId: string;
  peerId: string;
}

export const roomHandler = (socket: Socket) => {
  const createRoom = () => {
    const roomId = uuidv4();
    rooms[roomId] = [];
    socket.emit("room-created", { roomId });
    console.log("User created the room");
  };
  const joinRoom = ({ roomId, peerId }: IroomParams) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      rooms[roomId].push(peerId); // storing the ids' of the paricipants which are joining
      console.log("User joined the room, his/her id:", roomId, peerId);

      // for sending user-joined event to every participants and his/her id (of new user who joined)
      socket.to(roomId).emit("user-joined", { peerId });

      // for showing the list of joined paricipants to everyone in the room
      socket.emit("get-users", {
        roomId,
        participants: rooms[roomId],
      });
    }
    // if the user leaves the meet
    socket.on("disconnect", () => {
      console.log("user left the room", peerId);
      leaveRoom({ roomId, peerId });
    });
  };
  const leaveRoom = ({ roomId, peerId }: IroomParams) => {
    rooms[roomId] = rooms[roomId].filter((id) => id !== peerId);
    socket.to(roomId).emit("user-disconnected", peerId);
  };
  socket.on("create-room", createRoom);
  socket.on("join-room", joinRoom);
};
