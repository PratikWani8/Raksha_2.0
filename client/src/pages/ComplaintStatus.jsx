import { useEffect,useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { FileText,CheckCircle,Clock,Search } from "lucide-react"
import { BASE_URL } from "../api/api"

export default function ComplaintStatus(){

const [complaints,setComplaints] = useState([])
const navigate = useNavigate()

const username = localStorage.getItem("username")

/* FETCH COMPLAINTS */
const loadComplaints = async () => {
  try {

    const res = await fetch(
      `${BASE_URL}/api/complaints/user/${username}`
    );

    const data = await res.json();

    setComplaints(data);

  } catch (err) {
    console.error("Error loading complaints:", err);
  }
};

/* LIVE REFRESH EVERY 5 SECONDS */
useEffect(()=>{

loadComplaints()

const interval = setInterval(loadComplaints,5000)

return ()=>clearInterval(interval)

},[])

/* STATUS ICON */
const getIcon = (status)=>{

if(status==="Pending") return <Clock size={18} className="text-yellow-600"/>
if(status==="Under Investigation") return <Search size={18} className="text-blue-600"/>
if(status==="Resolved") return <CheckCircle size={18} className="text-green-600"/>

}

/* PROGRESS WIDTH */
const progressWidth = (status)=>{

if(status==="Pending") return "33%"
if(status==="Under Investigation") return "66%"
if(status==="Resolved") return "100%"

}

return(

<div className="min-h-screen bg-[#fff5f8]">

<header className="pt-6">

<div className="max-w-md mx-auto bg-[#e91e63] text-white rounded-full py-3 text-center font-semibold shadow flex items-center justify-center gap-2">

<FileText size={20}/>

Complaint Status

</div>

</header>

<motion.div
initial={{opacity:0,y:30}}
animate={{opacity:1,y:0}}
className="max-w-md mx-auto mt-8 bg-white p-6 rounded-2xl shadow-lg"
>

{complaints.length === 0 ?(

<p className="text-center text-gray-500">
No complaints submitted yet.
</p>

):(complaints.map((c,index)=>(

<motion.div
key={index}
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:index*0.1}}
className="p-4 border rounded-lg mb-5"
>

{/* INCIDENT */}
<p className="font-semibold text-[#e91e63]">
{c.incident_type}
</p>

{/* STATUS */}
<div className="flex items-center gap-2 mt-2">

{getIcon(c.status)}

<span className="text-sm font-semibold">
{c.status}
</span>

</div>

{/* PROGRESS BAR */}
<div className="w-full bg-gray-200 h-2 rounded-full mt-3">

<motion.div
initial={{width:0}}
animate={{width:progressWidth(c.status)}}
transition={{duration:0.6}}
className="h-2 rounded-full bg-[#e91e63]"
/>

</div>

<p className="text-xs text-gray-500 mt-2">
Date: {new Date(c.createdAt).toLocaleDateString()}
</p>

</motion.div>

)))}

<button
onClick={()=>navigate("/dashboard")}
className="w-full mt-4 bg-gray-200 py-2 rounded-full hover:bg-gray-300 transition"
>

Back to Dashboard

</button>

</motion.div>

</div>

)

}