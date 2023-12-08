import prisma from "./dbConnection/connectDb.js";

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
    // const upsertedRoom = await prisma.room.upsert({
    //   where: {
    //     roomName: joinedRoom,
    //   },
    //   update: {},
    //   create: {
    //     roomName: joinedRoom,
    //   },
    // });

    // const upsertedUser = await prisma.user.upsert({
    //   where: {
    //     username,
    //   },
    //   update: {
    //     socketId,
    //     joinedRoom,
    //   },
    //   create: {
    //     socketId,
    //     username,
    //     joinedRoom,
    //   },
    // });

    const newUser = await prisma.user.create({ data: { username, socketId } });
    const newRoom = await prisma.room.create({
      data: { roomName: joinedRoom },
    });
    const activeUserInRoom = await prisma.usersInRooms.create({
      data: { usernameInRoom: username, roomForUser: joinedRoom },
    });
    return { newUser, newRoom, activeUserInRoom };
  } catch (error) {
    console.log(error);
  }
}

//get User by username
export async function getUser(username) {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    return user;
  } catch (error) {
    console.log("error getting user by id");
  }
}

//get active user in room
export async function getActiveUserInRoom(roomForUser) {
  try {
    const data = await prisma.usersInRooms.findMany({
      where: { roomForUser },
    });
    return data;
  } catch (error) {
    console.log("error in getting userList for room", error);
  }
}

//get active rooms for certain user
export async function getRoomsForUsers(socketId, roomName) {
  try {
    const rooms = await prisma.user.findUnique({
      where: { socketId },
      include: { roomList },
    });
  } catch (error) {}
}

//deactivating user from app
export async function leavesPrevRoom(username, newRoom) {
  try {
    await prisma.user.update({
      where: { username },
      data: { joinedRoom: newRoom },
    });
  } catch (err) {
    console.log("Error updating user");
  }
}
