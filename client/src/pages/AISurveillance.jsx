import { useEffect, useRef, useState } from "react"
import io from "socket.io-client"
import { BASE_URL } from "../api/api"
import { AI_BASE_URL } from "../api/api";

const socket = io(BASE_URL, {
  transports: ["websocket"],
});

export default function AISurveillance(){

const videoRef = useRef(null)
const canvasRef = useRef(null)

const [alert,setAlert] = useState(null)

let streamRef = useRef(null)

useEffect(()=>{

socket.on("ai_alert",(data)=>{
setAlert(data)
})

return ()=>{
socket.off("ai_alert")
}

},[])

useEffect(()=>{

navigator.mediaDevices.getUserMedia({video:true})
.then(stream=>{
streamRef.current = stream
videoRef.current.srcObject = stream
})

return ()=>{

// stop camera when leaving page
if(streamRef.current){
streamRef.current.getTracks().forEach(track=>track.stop())
}

}

},[])

const captureFrame = async ()=>{

const video = videoRef.current

if(!video.videoWidth) return

const tempCanvas = document.createElement("canvas")
const ctx = tempCanvas.getContext("2d")

tempCanvas.width = video.videoWidth
tempCanvas.height = video.videoHeight

ctx.drawImage(video,0,0)

const frame = tempCanvas.toDataURL("image/jpeg")

 try {

    const res = await fetch(`${AI_BASE_URL}/detect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: frame }),
    });

    const data = await res.json();

    drawBoxes(data.detections);

  } catch (err) {
    console.error("Detection error:", err);
  }

}

const drawBoxes = (detections)=>{

const canvas = canvasRef.current
const ctx = canvas.getContext("2d")
const video = videoRef.current

canvas.width = video.videoWidth
canvas.height = video.videoHeight

ctx.clearRect(0,0,canvas.width,canvas.height)

detections?.forEach(det=>{

const [x1,y1,x2,y2] = det.box

ctx.strokeStyle = "red"
ctx.lineWidth = 3

ctx.strokeRect(x1,y1,x2-x1,y2-y1)

ctx.fillStyle = "red"
ctx.font = "16px Arial"

ctx.fillText(
`${det.label} ${det.confidence.toFixed(2)}`,
x1,
y1-5
)

})

}

useEffect(()=>{

const interval = setInterval(captureFrame,900)

return ()=>clearInterval(interval)

},[])

return(

<div className="min-h-screen bg-black text-white p-10">

<h1 className="text-3xl mb-8">
Raksha AI Surveillance Monitoring
</h1>

<div className="grid grid-cols-2 gap-8">

<div className="relative">

<video
ref={videoRef}
autoPlay
playsInline
muted
className="rounded-lg w-full"
/>

<canvas
ref={canvasRef}
className="absolute top-0 left-0 w-full h-full pointer-events-none"
/>

</div>

<div className="bg-gray-800 p-6 rounded-xl">

<h2 className="text-xl mb-4">
AI Threat Detection
</h2>

{alert ? (

<div className="bg-red-600 p-4 rounded-lg animate-pulse">

🚨 Threat Detected

<br/>

Type : {alert.type}

<br/>

Object : {alert.object}

<br/>

Camera : {alert.camera}

</div>

):( 

<div className="text-green-400">
System Monitoring... No Threats
</div>

)}

</div>

</div>

</div>

)
}