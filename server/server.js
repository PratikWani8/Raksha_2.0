import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import http from "http"
import { Server } from "socket.io"
import axios from "axios"
import connectDB from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import addressRoutes from "./routes/addressRoutes.js"
import complaintRoutes from "./routes/complaintRoutes.js"
import sosRoutes from "./routes/sosRoutes.js"
import guestSOSRoutes from "./routes/guestSOSRoutes.js"
import heatmapRoutes from "./routes/heatmapRoutes.js"
import futureRoutes from "./routes/futureRoutes.js"
import routeRoutes from "./routes/routeRoutes.js"
import FIRRoutes from "./routes/firRoute.js"
import videoRoutes from "./routes/videoRoutes.js"
import progressRoutes from "./routes/progressRoutes.js"

dotenv.config()

const app = express()

connectDB()

app.use(cors())
app.use(express.json())

//SOCKET SERVER 
const server = http.createServer(app)

const io = new Server(server,{
  cors:{ origin:"*" }
})

io.on("connection",(socket)=>{
  console.log("Client connected:",socket.id)
})

app.use((req,res,next)=>{
  req.io = io
  next()
})

// ROUTES 
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api", addressRoutes)
app.use("/api/complaints", complaintRoutes)
app.use("/uploads", express.static("uploads"))
app.use("/api/sos", sosRoutes)
app.use("/api/guest-sos", guestSOSRoutes)
app.use("/api", heatmapRoutes)
app.use("/api", futureRoutes)
app.use("/api", routeRoutes)
app.use("/api/fir", FIRRoutes)
app.use("/api/videos", videoRoutes)
app.use("/api/progress", progressRoutes)


// ROOT API
app.get("/", (req,res)=>{
  res.send("Raksha API Running")
})

// AI PREDICTION 
app.post("/api/predict", async(req,res)=>{

try{

const {lat,lng} = req.body

const response = await axios.post(
"http://localhost:8000/predict",
{lat,lng}
)

res.json(response.data)

}catch(err){

console.error("AI Error:",err.message)

res.status(500).json({
error:"AI service not available"
})

}

})

// AI HEALTH
app.get("/api/ai-health", async(req,res)=>{

try{

const response = await axios.get(
"http://localhost:8000/health"
)

res.json({
ai:response.data.status
})

}catch(err){

res.status(500).json({
ai:"AI service offline"
})

}

})

// AI SURVEILLANCE
app.post("/api/ai-alert",(req,res)=>{

try{

const { type, object, camera } = req.body

console.log("🚨 AI Threat Detected:", type, object)

const alertData = {
type,
object,
camera,
time:new Date()
}

// Send real-time alert to admin dashboard
io.emit("ai_alert",alertData)

res.json({
message:"AI alert broadcasted"
})

}catch(err){

console.error(err)

res.status(500).json({
error:"Failed to send AI alert"
})

}

})

// Live Evidence 
const liveUsers = {}

io.on("connection",(socket)=>{

console.log("Connected:",socket.id)

//SEND CURRENT LIVE USERS TO NEW ADMIN 
socket.emit("live_users_list",Object.values(liveUsers))


// USER STARTS LIVE
socket.on("start_live",(user)=>{

liveUsers[socket.id] = {
socketId:socket.id,
...user
}

io.emit("live_started",liveUsers[socket.id])

})


// WEBRTC OFFER 
socket.on("offer",(data)=>{

io.to(data.target).emit("offer",{
offer:data.offer,
sender:socket.id
})

})


// WEBRTC ANSWER 
socket.on("answer",(data)=>{

io.to(data.target).emit("answer",{
answer:data.answer,
sender:socket.id
})

})


// ICE CANDIDATE 
socket.on("ice_candidate",(data)=>{

io.to(data.target).emit("ice_candidate",{
candidate:data.candidate,
sender:socket.id
})

})


// STOP LIVE 
socket.on("stop_live",()=>{

delete liveUsers[socket.id]

io.emit("live_stopped",socket.id)

})


socket.on("disconnect",()=>{

delete liveUsers[socket.id]

io.emit("live_stopped",socket.id)

})

})

// START SERVER 
const PORT = process.env.PORT || 5000

server.listen(PORT,()=>{
  console.log(`Raksha server running on port ${PORT}`)
})