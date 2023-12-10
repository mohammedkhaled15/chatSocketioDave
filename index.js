import express from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import {
  activateUser,
  buildMsg,
  getActiveUserInRoom,
  getRoomsForUsers,
  getUserBySocketId,
  leavesRoom,
} from "./actions.mjs";
dotenv.config();

//to use direname value in es module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3500;
const ADMIN = "Admin";

const expressServer = app.listen(PORT, () => {
  console.log(`Listening to port : ${PORT}`);
});

//to serve the front on the same server
app.use(express.static(path.join(__dirname, "public")));

const io = new Server(expressServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production" ? false : "http://127.0.0.1:5500",
  },
});

io.on("connection", (socket) => {
  console.log(`${socket.id} is Connected`);

  //for user only
  socket.emit("message", buildMsg(ADMIN, "Welcome To Chat App!"));

  socket.on("enterRoom", async ({ username, joinedRoom }) => {
    //create User with new joined room
    const { newUser, newRoom, activeUserInRoom } = await activateUser(
      username,
      socket.id,
      joinedRoom
    );

    //socket join room
    socket.join(newRoom.roomName);

    //saying welcome to user in room
    socket.emit(
      "message",
      buildMsg(ADMIN, `You have Joined ${newRoom.roomName} Chat room`)
    );

    //saying for all that this user joined room
    socket.broadcast
      .to(newRoom.roomName)
      .emit(
        "message",
        buildMsg(ADMIN, `${newUser.username} has Joined the room`)
      );

    //updating usersList in this room
    const activeUsers = await getActiveUserInRoom(newRoom.roomName);
    io.to(newRoom.roomName).emit("usersList", activeUsers);

    //updating activeRooms in this room
    const activeRooms = await getRoomsForUsers(newUser.username);
    socket.emit("activeRooms", activeRooms);
  });

  //if socket disconnected
  socket.on("disconnect", async () => {
    const user = await getUserBySocketId(socket.id);
    if (user) {
      io.to(user.activeRoom).emit(
        "message",
        buildMsg(ADMIN, `${user.username} has left this Chat Room`)
      );
      await leavesRoom(user.username, user.activeRoom);
      socket.leave(user.activeRoom);
      //updating usersList in this room
      const activeUsers = await getActiveUserInRoom(user.activeRoom);
      io.to(user.activeRoom).emit("usersList", activeUsers);

      // updating activeRooms for the user
      const activeRooms = await getRoomsForUsers(user.username);
      // io.to(user.activeRoom).emit("activeRooms", activeRooms);
      io.to(user.activeRoom).emit("activeRooms", activeRooms);
    }
  });

  socket.on("message", async ({ username, text, socketId }) => {
    const user = await getUserBySocketId(socketId);
    const room = user?.activeRoom;
    if (room) {
      io.to(room).emit("message", buildMsg(username, text));
    }
  });
  //listen for activity
  socket.on("activity", async ({ username, socketId }) => {
    const user = await getUserBySocketId(socketId);
    const room = user?.activeRoom;
    if (room) {
      socket.broadcast.to(room).emit("activity", username);
    }
  });
});
