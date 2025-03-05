import express from "express";
import { Server } from "socket.io";
import { createServer } from 'http';
// import { Socket } from "node:dgram";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const app = express();
const server = createServer(app);
const io= new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));

const allusers = {};

//exposing public director to outside world
app.use(express.static("public"))

//handle io - scoket connnection

io.on("connection" , (socket)=>{
    console.log("somepn connected  , id : " , socket.id)
    socket.on("join-user",username=>{
        console.log(`${username} joined scoket connection`)
        allusers[username]={username,id:socket.id};
        io.emit("joined",allusers);
    })
    socket.on("offer",({from,to,offer})=>{
        console.log({from,to,offer});
        io.to(allusers[to].id).emit("offer",{from,to,offer});
    })

    socket.on("answer",({from,to,answer})=>{
        // console.log({from,to,offer});
        io.to(allusers[from].id).emit("answer",{from,to,answer});
    })
    socket.on("end-call",({from,to})=>{
        io.to(allusers[to].id).emit("end-call",({from,to}))
    })
    socket.on("call-ended",caller=>{
        const [from,to]=caller;
    io.to(allusers[from].id).emit("call-ended",caller);
    io.to(allusers[to].id).emit("call-ended",caller);    

})

    // socket.on("icecandidate", candidate => {
    //     console.log({ candidate });
    //     //broadcast to other peers  //only to 
    //     socket.broadcast.emit("icecandidate", candidate);
    // }); 
    socket.on("icecandidate", ({ to, candidate }) => {
        console.log(`ICE candidate from ${socket.id} to ${to}:`, candidate);
        if (allusers[to]) {
            io.to(allusers[to].id).emit("icecandidate", { candidate });
        }
    });
    
})

app.get('/',(req,res)=>{
    console.log("get request");
    res.sendFile(join(__dirname, '/app/index.html'));
})

server.listen(3000,()=>{
    console.log("app listenning on : 3000")
})