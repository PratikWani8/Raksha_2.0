import express from "express"

const router = express.Router()

router.post("/ai-alert",(req,res)=>{

try{

const { type, object, camera } = req.body

const alertData = {
type,
object,
camera,
time:new Date()
}

// send alert to admin dashboard 
req.io.emit("ai_alert",alertData)

console.log("🚨 AI Alert:",alertData)

res.json({
message:"AI alert broadcasted",
data:alertData
})

}catch(err){

console.error("AI Alert Error:",err)

res.status(500).json({
error:"Failed to broadcast AI alert"
})

}

})

export default router