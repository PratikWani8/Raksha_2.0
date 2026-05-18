import { useEffect,useRef,useState } from "react"
import { io } from "socket.io-client"
import { BASE_URL } from "../api/api"
import { motion,AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"

import sirenSound from "../assets/alert.mp3"

const socket = io(BASE_URL, {
  transports: ["websocket"],
});

export default function AdminLiveDashboard(){

const [users,setUsers] = useState([])
const [alert,setAlert] = useState(null)
const [soundEnabled,setSoundEnabled] = useState(false)

const peerConnections = useRef({})
const videoRefs = useRef({})
const audioRef = useRef(null)

/* INITIALIZE AUDIO */
useEffect(()=>{

audioRef.current = new Audio(sirenSound)
audioRef.current.loop = true
audioRef.current.volume = 0.8

},[])

/* PLAY SOUND WHEN ALERT TRIGGERS */
useEffect(()=>{

if(alert && soundEnabled && audioRef.current){

audioRef.current.currentTime = 0

audioRef.current.play().catch(err=>{
console.log("Audio blocked",err)
})

}

},[alert,soundEnabled])

useEffect(()=>{

socket.on("live_users_list",(list)=>{
setUsers(list)
})

socket.on("live_started",(user)=>{

setUsers(prev=>{

const exists = prev.find(u=>u.socketId===user.socketId)
if(exists) return prev

createPeerConnection(user.socketId)

return [...prev,user]

})

/* ALERT */
setAlert({
name:user.name,
phone:user.phone,
location:user.location
})

setTimeout(()=>{

setAlert(null)

if(audioRef.current){
audioRef.current.pause()
audioRef.current.currentTime=0
}

},5000)

})

socket.on("live_stopped",(id)=>{

setUsers(prev=>prev.filter(u=>u.socketId!==id))

if(peerConnections.current[id]){
peerConnections.current[id].close()
delete peerConnections.current[id]
}

})

socket.on("answer", async(data)=>{

const pc = peerConnections.current[data.sender]

if(!pc) return

if(pc.signalingState !== "have-local-offer") return

await pc.setRemoteDescription(
new RTCSessionDescription(data.answer)
)

})

socket.on("ice_candidate",(data)=>{

const pc = peerConnections.current[data.sender]

if(!pc) return

pc.addIceCandidate(new RTCIceCandidate(data.candidate))

})

return ()=>{

socket.off("live_users_list")
socket.off("live_started")
socket.off("live_stopped")
socket.off("answer")
socket.off("ice_candidate")

}

},[])

/* CREATE PEER */
const createPeerConnection = async(socketId)=>{

if(peerConnections.current[socketId]) return

const pc = new RTCPeerConnection({
iceServers:[
{ urls:"stun:stun.l.google.com:19302" }
]
})

peerConnections.current[socketId] = pc

pc.addTransceiver("video",{ direction:"recvonly" })
pc.addTransceiver("audio",{ direction:"recvonly" })

pc.ontrack=(event)=>{

const video = videoRefs.current[socketId]

if(video && !video.srcObject){
video.srcObject = event.streams[0]
}

}

pc.onicecandidate=(event)=>{

if(event.candidate){

socket.emit("ice_candidate",{
target:socketId,
candidate:event.candidate
})

}

}

const offer = await pc.createOffer()

await pc.setLocalDescription(offer)

socket.emit("offer",{
target:socketId,
offer
})

}

return(

<div className="flex min-h-screen bg-black text-white">

{/* SIDEBAR */}
<div className="w-64 bg-gray-900 text-white p-6 space-y-6 sticky top-0 h-screen">

<h2 className="text-xl font-bold mb-6">Admin Panel</h2>

<nav className="space-y-3">

<Link to="/admin" className="flex items-center gap-3  hover:bg-gray-700 p-3 rounded">

{/* DASHBOARD SVG */}
<svg width="20" height="20" fill="white" viewBox="0 0 24 24">
<path d="M3 13h8V3H3v10zm10 8h8v-6h-8v6zM3 21h8v-6H3v6zm10-8h8V3h-8v10z"/>
</svg>

Dashboard
</Link>

<Link to="/admin/sos" className="flex items-center gap-3 hover:bg-gray-700 p-3 rounded">

{/* SOS SVG */}
<svg width="20" height="20" fill="white" viewBox="0 0 24 24">
<path d="M12 2L2 7v7c0 5 3.8 9.7 10 10 6.2-.3 10-5 10-10V7l-10-5z"/>
</svg>

SOS Alerts
</Link>

{/* Live Video */}
<Link to="/admin/live-dashboard" className="flex items-center gap-3  bg-green-500 p-3 rounded">

<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">

<path
strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14V10z"/>

<rect x="3" y="6" width="12" height="12" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>

Live Video
</Link>

{/* FIR Records */}
<Link
to="/admin/fir"
className="flex items-center gap-3 hover:bg-gray-700 p-3 rounded"
>

{/* FIR SVG */}
<svg width="20" height="20" fill="white" viewBox="0 0 24 24">
<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
<path d="M14 2v6h6"/>
<path d="M16 13H8"/>
<path d="M16 17H8"/>
<path d="M10 9H8"/>
</svg>

FIR Records

</Link>

{/* Surveillance */}
<Link to="/admin/ai-surveillance"
className="flex items-center gap-3 hover:bg-gray-700 p-3 rounded"
>

<svg
xmlns="http://www.w3.org/2000/svg"
fill="none"
viewBox="0 0 24 24"
strokeWidth={1.5}
stroke="currentColor"
className="w-5 h-5"
>
<path
strokeLinecap="round"
strokeLinejoin="round"
d="M3 7h18M3 7l2 10h14l2-10M9 11v4M15 11v4"
/>
</svg>

Surveillance

</Link>

<a className="flex items-center gap-3 hover:bg-gray-700 p-3 rounded">

{/* LOCK SVG */}
<svg width="20" height="20" fill="white" viewBox="0 0 24 24">
<path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-7h-1V7a5 5 0 10-10 0v3H6v10h12V10zm-3 0H9V7a3 3 0 116 0v3z"/>
</svg>

Change Password
</a>

<Link to="/" className="flex items-center gap-3 bg-red-500 p-3 rounded">

{/* LOGOUT SVG */}
<svg width="20" height="20" fill="white" viewBox="0 0 24 24">
<path d="M16 17l5-5-5-5v3H9v4h7v3zM4 5h8V3H4a2 2 0 00-2 2v14a2 2 0 002 2h8v-2H4V5z"/>
</svg>

Logout
</Link>

</nav>

</div>

{/* MAIN CONTROL ROOM */}
<div className="flex-1 p-8">

{/* HEADER */}
<div className="flex justify-between items-center mb-6">

<h1 className="text-5xl font-bold">
Raksha Live Control Room
</h1>

<button
onClick={()=>setSoundEnabled(true)}
className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
soundEnabled
? "bg-green-600"
: "bg-red-600 animate-pulse"
}`}
>

{/* SPEAKER SVG */}
<svg
xmlns="http://www.w3.org/2000/svg"
fill="none"
viewBox="0 0 24 24"
strokeWidth={1.8}
stroke="currentColor"
className="w-5 h-5"
>
<path
strokeLinecap="round"
strokeLinejoin="round"
d="M11 5L6 9H3v6h3l5 4V5z"
/>
<path
strokeLinecap="round"
strokeLinejoin="round"
d="M15 9a3 3 0 010 6"
/>
<path
strokeLinecap="round"
strokeLinejoin="round"
d="M18 7a6 6 0 010 10"
/>
</svg>

{soundEnabled ? "Sound Enabled" : "Enable Alert Sound"}

</button>

</div>

{/* ALERT */}
<AnimatePresence>

{alert &&(

<motion.div
initial={{y:-80,opacity:0}}
animate={{y:0,opacity:1}}
exit={{y:-80,opacity:0}}
className="bg-gradient-to-r from-red-700 to-red-500 text-white p-5 rounded-xl mb-6 shadow-2xl flex justify-between items-center"
>

<div>

<h2 className="font-bold text-lg">
🚨 LIVE EVIDENCE ALERT
</h2>

<p className="text-sm">
{alert.name} • {alert.phone}
</p>

<p className="text-xs">
📍 {alert.location}
</p>

</div>

<span className="animate-pulse text-sm">
LIVE STREAM ACTIVE
</span>

</motion.div>

)}

</AnimatePresence>

{/* LIVE VIDEO GRID */}
<div className="grid grid-cols-3 gap-6">

{users.map((u)=>(
<motion.div
key={u.socketId}
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-lg"
>

<div className="flex justify-between">

<h2 className="font-bold">{u.name}</h2>

<span className="text-red-400 text-xs animate-pulse">
LIVE
</span>

</div>

<p className="text-sm text-gray-400">{u.phone}</p>

<p className="text-xs text-gray-500">
📍 {u.location}
</p>

<video
ref={(el)=>videoRefs.current[u.socketId]=el}
autoPlay
playsInline
muted
className="w-full mt-3 rounded-lg bg-black"
/>

</motion.div>
))}

</div>

{users.length===0 &&(

<div className="text-center mt-20 text-gray-500">
No active live evidence streams
</div>

)}

</div>

</div>

)

}