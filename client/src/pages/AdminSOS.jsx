import { useEffect,useState } from "react"
import io from "socket.io-client"
import axios from "axios"
import { MapContainer,TileLayer,Marker,Popup } from "react-leaflet"
import L from "leaflet"
import { motion } from "framer-motion"
import "leaflet/dist/leaflet.css"

const socket = io("http://localhost:5000")

const icon = new L.Icon({
iconUrl:"https://cdn-icons-png.flaticon.com/512/564/564619.png",
iconSize:[35,35]
})

export default function AdminControlRoom(){

const [alerts,setAlerts] = useState([])

useEffect(()=>{

loadSOS()

socket.on("newSOS",(data)=>{

setAlerts(prev=>{

const exists = prev.find(a=>a.sosId===data.sosId)

if(exists) return prev

playSiren()

return [data,...prev]

})

})

socket.on("sosLocationUpdate",(data)=>{

setAlerts(prev =>
prev.map(a =>
a.sosId===data.sosId
? {...a,latitude:data.latitude,longitude:data.longitude,location:data.location}
: a
)
)

})

socket.on("sosStopped",(data)=>{

setAlerts(prev =>
prev.filter(a=>a.sosId!==data.sosId)
)

})

return ()=>{
socket.off("newSOS")
socket.off("sosLocationUpdate")
socket.off("sosStopped")
}

},[])

const loadSOS = async()=>{

const res = await axios.get("http://localhost:5000/api/sos/admin")

setAlerts(res.data)

}

const playSiren = ()=>{

const audio = new Audio("/alert.mp3")

audio.play()

}

const active = alerts.filter(a=>{

const sent = new Date(a.createdAt)
const now = new Date()

return (now - sent)/(1000*60) <= 10

})

return(

<div className="h-screen w-full flex bg-black text-white">

{/* LEFT PANEL */}
<div className="w-80 bg-gray-900 overflow-y-auto p-4">

<h2 className="text-xl font-bold mb-4 flex items-center gap-2">

🚨 Emergency Alerts

<span className="bg-red-600 px-2 py-1 text-xs rounded-full animate-pulse">

{active.length}

</span>

</h2>

{active.map(s=>(

<motion.div
key={s.sosId}
initial={{opacity:0,y:10}}
animate={{opacity:1,y:0}}
className="bg-red-600 p-3 mb-3 rounded shadow animate-pulse"
>

<p className="text-sm">

<b>SOS:</b> {s.sosId}<br/>

<b>User:</b> {s.username}<br/>

<b>Location:</b> {s.location}<br/>

<b>Message:</b> {s.message}

</p>

</motion.div>

))}

</div>

{/* MAP */}
<div className="flex-1">

<MapContainer
center={[20.5937,78.9629]}
zoom={5}
style={{height:"100%",width:"100%"}}
>

<TileLayer
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>

{active.map(s=>(

<Marker
key={s.sosId}
position={[s.latitude,s.longitude]}
icon={icon}
>

<Popup>

<b>SOS #{s.sosId}</b><br/>

{s.username}<br/>

{s.location}<br/>

{s.message}

</Popup>

</Marker>

))}

</MapContainer>

</div>

</div>

)
}