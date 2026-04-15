import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, MapPin, Send } from "lucide-react"
import Swal from "sweetalert2"

export default function Complaint() {

const [type,setType] = useState("")
const [desc,setDesc] = useState("")
const [location,setLocation] = useState("")
const [file,setFile] = useState(null)
const [fileName,setFileName] = useState("")
const [loading,setLoading] = useState(false)
const [success,setSuccess] = useState(false)

const username = localStorage.getItem("username")

/* FILE UPLOAD */
const handleFile = (e)=>{

const file = e.target.files[0]

if(!file) return

const allowed = ["image/jpeg","image/png","audio/mpeg"]

if(!allowed.includes(file.type)){
Swal.fire("Invalid File","Only image/audio allowed","error")
return
}

if(file.size > 2 * 1024 * 1024){
Swal.fire("File too large","Max size is 2MB","error")
return
}

setFile(file)
setFileName(file.name)

}

/* GET LOCATION */
const getLocation = () => {

if(navigator.geolocation){

navigator.geolocation.getCurrentPosition(

async(pos)=>{

const lat = pos.coords.latitude
const lon = pos.coords.longitude

const res = await fetch(
`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
)

const data = await res.json()

const place = data.display_name

setLocation(place)

Swal.fire({
icon:"success",
title:"Location captured",
text:place
})

},

()=>{
Swal.fire("Error","Location permission denied","error")
}

)

}else{

Swal.fire("Error","Geolocation not supported","error")

}

}

/* SUBMIT COMPLAINT */
const handleSubmit = async(e)=>{

e.preventDefault()

if(!location){
Swal.fire("Location Missing","Please capture location first","warning")
return
}

const confirm = await Swal.fire({
title:"Submit Complaint?",
text:"Your complaint will be recorded in the system.",
icon:"warning",
showCancelButton:true,
confirmButtonColor:"#e91e63"
})

if(!confirm.isConfirmed) return

setLoading(true)

try{

const formData = new FormData()

formData.append("username",username)
formData.append("type",type)
formData.append("desc",desc)
formData.append("location",location)
formData.append("evidence",file)

const res = await fetch(
"http://localhost:5000/api/complaints",
{
method:"POST",
body:formData
}
)

const data = await res.json()

if(data.success){

setSuccess(true)

}else{

Swal.fire("Error",data.error,"error")

}

}catch{

Swal.fire("Error","Submission failed","error")

}

setLoading(false)

}

/* SUCCESS SCREEN */
if(success){

return(

<div className="min-h-screen flex items-center justify-center bg-[#fff5f8]">

<motion.div
initial={{scale:0}}
animate={{scale:1}}
transition={{duration:0.4}}
className="text-center"
>

<div className="text-green-600 text-7xl">✔</div>

<h2 className="text-2xl font-bold mt-4 text-green-600">
Complaint Submitted Successfully
</h2>

<p className="text-gray-600 mt-2">
Your complaint has been recorded.
</p>

<a href="/dashboard">

<button className="mt-6 bg-[#e91e63] text-white px-6 py-2 rounded-full hover:bg-pink-700 transition">
Back to Dashboard
</button>

</a>

</motion.div>

</div>

)

}

/* MAIN FORM */
return(

<div className="min-h-screen bg-[#fff5f8]">

<header className="pt-6">

<div className="max-w-md mx-auto bg-[#e91e63] text-white rounded-full py-3 text-center font-semibold shadow">
🚨 Report Safety Complaint
</div>

</header>

<motion.div
initial={{opacity:0,y:30}}
animate={{opacity:1,y:0}}
transition={{duration:0.5}}
className="max-w-md mx-auto mt-8 bg-white p-6 rounded-2xl shadow-lg"
>

<form onSubmit={handleSubmit} className="space-y-4">

{/* INCIDENT TYPE */}
<div>

<label className="font-medium">Incident Type</label>

<input
type="text"
value={type}
onChange={(e)=>setType(e.target.value)}
placeholder="Harassment / Threat / Abuse"
required
className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-[#e91e63]"
/>

</div>

{/* DESCRIPTION */}
<div>

<label className="font-medium">Description</label>

<textarea
rows="4"
value={desc}
onChange={(e)=>setDesc(e.target.value)}
placeholder="Describe the incident"
required
className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-[#e91e63]"
/>

</div>

{/* LOCATION */}
<div>

<label className="font-medium">Live Location</label>

<button
type="button"
onClick={getLocation}
className="w-full flex items-center justify-center gap-2 bg-pink-100 text-[#e91e63] py-2 rounded-lg mt-1 hover:bg-pink-200 transition"
>

<MapPin size={18}/>
Capture Live Location

</button>

{location && (
<p className="text-xs text-green-600 mt-1">
📍 {location}
</p>
)}

</div>

{/* FILE UPLOAD */}
<div>

<label className="font-medium block mb-1">
Upload Evidence
</label>

<label className="flex items-center justify-center gap-2 border border-dashed border-pink-400 rounded-lg p-3 cursor-pointer hover:bg-pink-50 transition">

<Upload size={18}/>

<span className="text-sm">
Upload Image / Audio
</span>

<input
type="file"
accept="image/*,audio/*"
onChange={handleFile}
className="hidden"
/>

</label>

<p className="text-xs text-gray-500 mt-1">
Image / Audio only (max 2MB)
</p>

{fileName && (

<p className="text-xs text-green-600 mt-1">
📎 Uploaded: {fileName}
</p>

)}

</div>

{/* SUBMIT BUTTON */}
<button
disabled={loading}
className="w-full bg-green-600 text-white py-2 rounded-full flex items-center justify-center gap-2 hover:bg-green-700 transition"
>

{loading ? "Submitting..." :
<>
<Send size={18}/>
Submit Complaint
</>
}

</button>

</form>

<a href="/dashboard">

<button className="mt-4 w-full bg-gray-200 py-2 rounded-full hover:bg-gray-300 transition">

⬅ Back to Dashboard

</button>

</a>

</motion.div>

</div>

)
}