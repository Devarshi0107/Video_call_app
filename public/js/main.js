
const createUserbtn = document.getElementById("create-user")
const username = document.getElementById("username")
const socket =io();
const alluserhtml =document.getElementById("allusers");
const localvideo=document.getElementById("localVideo");
const remotevideo=document.getElementById("remoteVideo")
const endCallBtn = document.getElementById("end-call-btn");

let localStream;
let caller= [];
//handle browser events


//singleton method peerconnection

const PeerConnection = (function(){
    let peerConnection;

    const createPeerconnection =()=>{
        const config={
            iceServers:[{
                urls: "stun:stun.l.google.com:19302"
            }]
        }
        peerConnection = new  RTCPeerConnection(config);

        // add local stream to peer connection

        localStream.getTracks().forEach(track=>{
            peerConnection.addTrack(track,localStream);
        })
        //listen to remote stream and add to peer ocnnection
        peerConnection.ontrack = function(event){
            remotevideo.srcObject = event.streams[0];  // ✅ Use 'event.streams'

        }
        //listen for ice candidate

        peerConnection.onicecandidate=function(event){
            if(event.candidate){
                console.log("ICE Candidate:", event.candidate);

                socket.emit("icecandidate",event.candidate)
                    sendCandidateToRemote(event.candidate);  // Send it via signaling

            }
        }
        return peerConnection;
    }
    return{
        getInstance : () => {
            if(!peerConnection){
                peerConnection = createPeerconnection();
            }
            return peerConnection;
        }

    }
})();

createUserbtn.addEventListener("click",(e)=>{
    if(username.value!==""){
        socket.emit("join-user",username.value); 
        const usernamecontainer= document.querySelector('.username-input');
        usernamecontainer.style.display='none';
    }
})
endCallBtn.addEventListener("click",(e)=>{
    socket.emit("call-ended",caller);
})

//handle socket events

socket.on("joined",allusers=>{
    console.log({allusers});

    const createhtml =()=>{
        alluserhtml.innerHTML="";
        for(const user in allusers){
            const li=document.createElement('li');
            li.textContent=`${user} ${user === username.value? "YOu" : ""}`
    
            if(user !== username.value){
                const button = document.createElement("button");
                button.classList.add("call-btn");
                button.addEventListener("click",(e)=>{
                    startcall(user);
                })
                const img = document.createElement("img");
                img.setAttribute("src" ,"images/phone.png");
                img.setAttribute("width" , 20);
    
                button.appendChild(img);
                li.appendChild(button);
            }
            alluserhtml.appendChild(li);
        }
    }
    
    createhtml();
})

socket.on("offer",async ({from,to,offer})=>{
    const pc= PeerConnection.getInstance();
    await pc.setRemoteDescription(offer);
    const answer =await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer",({from,to,answer:pc.localDescription}));
    caller = [from, to];
})

socket.on("answer",async ({from,to,answer})=>{
    const pc= PeerConnection.getInstance();
    await pc.setRemoteDescription(answer);
     // show end call button
     endCallBtn.style.display = 'block';
     socket.emit("end-call", {from, to});
     caller = [from, to];
})

socket.on("icecandidate",async candidate=>{
    console.log({candidate});
    const pc =PeerConnection.getInstance();
    await pc.addIceCandidate (new RTCIceCandidate(candidate));
})

socket.on("end-call",({from,to})=>{
    endCallBtn.style.display = 'block';
})

socket.on("call-ended",(caller)=>{
    endcall();
})



//start call method

const startcall= async (user)=>{
    console.log({user});
    const pc = PeerConnection.getInstance();
    
    const offer=await pc.createOffer();
    console.log({offer}); 
    await pc.setLocalDescription(offer);
    socket.emit("offer",{from: username.value , to : user , offer : pc.localDescription})
}

const endcall =()=>{
    const pc =PeerConnection.getInstance();
    if(pc){
        pc.close();
        endCallBtn.style.display="none";
    }
}

//intializing app by video and adudio staring

const startmyvideo=async ()=>{
    try{
       const stream = await navigator.mediaDevices.getUserMedia({audio:true , video:true}); 
       console.log(stream);
       localStream=stream;
       localvideo.srcObject=stream;
       localvideo.muted = true;
    }
    catch(err){}
}

startmyvideo();