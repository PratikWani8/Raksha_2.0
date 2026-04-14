import express from "express"
import SOS from "../models/SOS.js"
import GuestSOS from "../models/GuestSOS.js"

const router = express.Router()

router.get("/admin", async (req,res)=>{

try{

const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

const regSOS = await SOS.find({
createdAt:{$gte:tenMinutesAgo}
}).lean()

const guestSOS = await GuestSOS.find({
createdAt:{$gte:tenMinutesAgo}
}).lean()

const registered = regSOS.map(s=>({

sosId:s.sosId,
username:s.username,
location:s.location,
latitude:s.latitude,
longitude:s.longitude,
message:s.message,
createdAt:s.createdAt,
type:"Registered"

}))

const guest = guestSOS.map(s=>({

sosId:s.sosId,
username:"Guest User",
location:s.location,
latitude:s.latitude,
longitude:s.longitude,
message:s.message,
createdAt:s.createdAt,
type:"Guest"

}))

const merged = [...registered,...guest]

merged.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt))

res.json(merged)

}catch(err){

res.status(500).json({error:"Failed to fetch SOS alerts"})

}

})

export default router