// Import Libraries and Setup

import express from "express";
import http from "http";
import { Server } from "socket.io";

//// REMOVE IF YOU PUT ON RENDER //////
import open, {openApp, apps} from 'open';//only needed for a simple development tool remove if hosting online see above
//// REMOVE IF YOU PUT ON RENDER //////

const app = express();
const server = http.createServer(app);//socket.io needs an http server
const io = new Server(server);
const port = process.env.PORT || 4000;

//Tell our Node.js Server to host our P5.JS sketch from the public folder
app.use(express.static("public"));

// Setup Our Node.js server to listen to connections
server.listen(port, () => {
  console.log("listening on: "+port);
});

//// REMOVE IF YOU PUT ON RENDER //////
//open in browser: dev environment only!
await open(`http://localhost:${port}`);//opens in your default browser
//// REMOVE IF YOU PUT ON RENDER //////

// Callback function for when our P5.JS sketch connects 
io.on("connection", (socket) => {
  console.log("a user connected");

  // Code to run every time we get a message from front-end P5.JS
  socket.on("motionData", (data) => {

    //broadcast.emit means send to everyone but the sender
    socket.broadcast.emit('motionData', data);

    console.log(data);// print to console
  });
});

