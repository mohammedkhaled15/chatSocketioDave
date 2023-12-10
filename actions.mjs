import prisma from "./dbConnection/connectDb.mjs";

//build Msg
export function buildMsg(name, text) {
  return {
    name,
    text,
    time: new Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(new Date()),
  };
}

//activate new user
export async function activateUser(username, socketId, joinedRoom) {
  try {
    const newRoom = await prisma.room.upsert({
      where: {
        roomName: joinedRoom,
      },
      update: {},
      create: {
        roomName: joinedRoom,
      },
    });

    const newUser = await prisma.user.upsert({
      where: {
        username,
      },
      update: {
        socketId,
        activeRoom: joinedRoom,
      },
      create: {
        socketId,
        username,
        activeRoom: joinedRoom,
      },
    });
    const activeUserInRoom = await prisma.usersInRooms.upsert({
      where: { usernameInRoom: username, roomForUser: joinedRoom },
      update: {},
      create: { usernameInRoom: username, roomForUser: joinedRoom },
    });
    return { newUser, newRoom, activeUserInRoom };
  } catch (error) {
    console.log("Error in creating user or room ", error);
  }
}

//get User by username
export async function getUserBySocketId(socketId) {
  try {
    const user = await prisma.user.findUnique({ where: { socketId } });
    return user;
  } catch (error) {
    console.log("error getting user by id", error);
  }
}

//get active user in room
export async function getActiveUserInRoom(roomName) {
  try {
    const data = await prisma.room.findUnique({
      where: { roomName },
      include: { users: true },
    });
    return data;
  } catch (error) {
    console.log("error in getting userList for room", error);
  }
}

//get active rooms for certain user
export async function getRoomsForUsers(username) {
  try {
    const rooms = await prisma.user.findUnique({
      where: { username },
      include: { rooms: true },
    });
    // console.log(rooms);
    return rooms;
  } catch (error) {
    console.log("Error from getting list of active rooms for user", error);
  }
}

//deactivating user from app
export async function leavesRoom(usernameInRoom, roomForUser) {
  try {
    await prisma.UsersInRooms.delete({
      where: { usernameInRoom, roomForUser },
    });
  } catch (err) {
    console.log("Error leaving room user");
  }
}
