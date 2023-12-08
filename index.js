import express from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import {
  activateUser,
  buildMsg,
  getActiveUserInRoom,
  getUser,
  getUsersInRoom,
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
    // //if there is a prev room
    // const prevRoom = await getUser(username,joinedRoom)?.joinedRoom;
    // if (prevRoom) {
    //   socket.leave(prevRoom);
    //   io.to(prevRoom).emit(
    //     "message",
    //     buildMsg(ADMIN, `${username} has left the room!`)
    //   );
    // }

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
    io.to(newRoom.roomName).emit(
      "usersList",
      await getActiveUserInRoom(newRoom.roomName)
    );
    io.to(newUser.userName).emit("activeRooms", await getRoomsForUsers());
  });

  // //All users except user himself
  // socket.broadcast.emit("message", `${socket.id.substring(0, 5)} is Connected`);

  // //listening to message event
  // socket.on("message", (data) => {
  //   console.log(`${data}`);
  //   io.emit("message", `${socket.id.substring(0, 5)}: ${data}`);
  // });

  // //when user disconnects
  // socket.on("disconnect", () => {
  //   socket.broadcast.emit(
  //     "message",
  //     buildMsg(ADMIN, `${socket.id.substring(0, 5)} is disconnected`)
  //   );
  // });

  //listen for activity
  socket.on("activity", (name) => {
    socket.broadcast.emit("activity", name);
  });
});
