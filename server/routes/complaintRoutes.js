import express from "express"
import multer from "multer"
import Complaint from "../models/Complaint.js"

const router = express.Router()

// MULTER STORAGE CONFIG
const storage = multer.diskStorage({
destination:"uploads",
filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+file.originalname)
}
})

const upload = multer({storage})


// CREATE COMPLAINT
router.post("/",upload.single("evidence"),async(req,res)=>{

try{

const last = await Complaint.findOne().sort({complaintId:-1})

const complaintId = last ? last.complaintId + 1 : 1

const complaint = await Complaint.create({

complaintId,
username:req.body.username,
incident_type:req.body.type,
description:req.body.desc,
location:req.body.location,
evidence:req.file ? req.file.filename : "",
status:"Pending"

})

res.json({
success:true,
complaint
})

}catch(err){

console.error(err)

res.status(500).json({
error:"Complaint failed"
})

}

})

// GET USER COMPLAINTS
router.get("/user/:username", async (req,res)=>{

try{

const username = req.params.username

const complaints = await Complaint.find({
username: username
}).sort({createdAt:-1})

res.json(complaints)

}catch(err){

console.error(err)

res.status(500).json({
error:"Server error"
})

}

})

// GET ALL COMPLAINTS (ADMIN)
router.get("/", async (req,res)=>{

try{

const complaints = await Complaint.find()
.sort({createdAt:-1})

res.json(complaints)

}catch(err){

console.error(err)

res.status(500).json({
error:"Server error"
})

}

})


// GET COMPLAINT STATS
router.get("/stats", async (req,res)=>{

try{

const total = await Complaint.countDocuments()

const pending = await Complaint.countDocuments({
status:"Pending"
})

const progress = await Complaint.countDocuments({
status:"In Progress"
})

const resolved = await Complaint.countDocuments({
status:"Resolved"
})

res.json({
total,
pending,
progress,
resolved
})

}catch(err){

console.error(err)

res.status(500).json({
error:"Stats error"
})

}

})

// UPDATE COMPLAINT STATUS

router.put("/:id/status", async (req,res)=>{

try{

const { status } = req.body

const updatedComplaint = await Complaint.findOneAndUpdate(

{ complaintId: req.params.id },   // use complaintId

{ status: status },

{ new:true }

)

if(!updatedComplaint){

return res.status(404).json({
error:"Complaint not found"
})

}

res.json({
success:true,
complaint:updatedComplaint
})

}catch(err){

console.error(err)

res.status(500).json({
error:"Update failed"
})

}

})

export default router