import express from "express"
import axios from "axios"

const router = express.Router()

router.post("/safe-route", async (req,res)=>{

try{

const {points} = req.body

let totalRisk = 0

for(const p of points){

const ai = await axios.post(
"http://localhost:8000/predict",
{lat:p.lat,lng:p.lng}
)

totalRisk += ai.data.risk

}

const avgRisk = totalRisk / points.length

res.json({

risk:avgRisk,
safe: avgRisk < 0.6

})

}catch(err){

res.status(500).json({error:"AI route check failed"})

}

})

export default router