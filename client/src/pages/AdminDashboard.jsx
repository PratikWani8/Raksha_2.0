import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import API from "../api/api";
import { motion } from "framer-motion"
import {
Pagination,
PaginationContent,
PaginationItem,
PaginationLink,
PaginationNext,
PaginationPrevious
} from "@/components/ui/pagination"
import { Bar, Doughnut } from "react-chartjs-2"
import {
Chart as ChartJS,
CategoryScale,
LinearScale,
BarElement,
ArcElement,
Tooltip,
Legend
} from "chart.js"

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
ArcElement,
Tooltip,
Legend
)

/* CHART PERCENTAGE PLUGIN */
const percentPlugin = {
id:"percentPlugin",
afterDatasetsDraw(chart){
const {ctx} = chart
const data = chart.data.datasets[0].data
const total = data.reduce((a,b)=>a+b,0)

chart.getDatasetMeta(0).data.forEach((bar,i)=>{
const value = data[i]
if(!value) return

const percent = ((value/total)*100).toFixed(1)+"%"

ctx.fillStyle="#fff"
ctx.font="bold 12px sans-serif"
ctx.textAlign="center"

ctx.fillText(percent,bar.x,bar.y+20)
})
}
}

const doughnutPercentPlugin = {
  id: "doughnutPercentPlugin",
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    const dataset = chart.data.datasets[0]
    const meta = chart.getDatasetMeta(0)

    const total = dataset.data.reduce((a, b) => a + b, 0)

    meta.data.forEach((arc, i) => {
      const value = dataset.data[i]
      if (!value) return

      const percent = ((value / total) * 100).toFixed(1) + "%"

      const angle = (arc.startAngle + arc.endAngle) / 2

      const radius = (arc.innerRadius + arc.outerRadius) / 2

      const x = arc.x + Math.cos(angle) * radius
      const y = arc.y + Math.sin(angle) * radius

      ctx.save()
      ctx.fillStyle = "#fff"
      ctx.font = "bold 12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(percent, x, y)
      ctx.restore()
    })
  }
}

export default function AdminDashboard(){

const [complaints,setComplaints] = useState([])
const [search,setSearch] = useState("")
const [stats,setStats] = useState({
total:0,
pending:0,
progress:0,
resolved:0
})

/* pagination */
const [page,setPage] = useState(1)
const perPage = 10

/* modal */
const [preview,setPreview] = useState(null)

useEffect(()=>{
loadComplaints()
loadStats()
},[])

const loadComplaints = async () => {
  try {
    const res = await API.get("/api/complaints");
    setComplaints(res.data);
  } catch (err) {
    console.error("Error loading complaints:", err);
  }
};

const loadStats = async () => {
  try {
    const res = await API.get("/api/complaints/stats");
    setStats(res.data);
  } catch (err) {
    console.error("Error loading stats:", err);
  }
};

const updateStatus = async (id, status) => {
  try {
    await API.put(`/api/complaints/${id}/status`, { status });

    // reload data after update
    await Promise.all([loadComplaints(), loadStats()]);
  } catch (err) {
    console.error("Error updating status:", err);
  }
};

/* SEARCH */
const filtered = complaints.filter(c=>{
const name = c.username || ""
return name.toLowerCase().includes(search.toLowerCase())
})

/* PAGINATION */
const totalPages = Math.ceil(filtered.length/perPage)

const paginated = filtered.slice(
(page-1)*perPage,
page*perPage
)

/* CHART DATA */
const chartData = {
labels:["Pending","In Progress","Resolved"],
datasets:[
{
data:[stats.pending,stats.progress,stats.resolved],
backgroundColor:["#ff9800","#03a9f4","#4caf50"],
borderRadius:10,
barThickness:55
}
]
}

const doughnutData = {
labels:["Pending","In Progress","Resolved"],
datasets:[
{
data:[stats.pending,stats.progress,stats.resolved],
backgroundColor:["#ff9800","#03a9f4","#4caf50"]
}
]
}

return(

<div className="flex min-h-screen bg-gray-100">

{/* SIDEBAR */}
<div className="w-64 bg-gray-900 text-white p-6 space-y-6 sticky top-0 h-screen">

<h2 className="text-xl font-bold mb-6">Admin Panel</h2>

<nav className="space-y-3">

<a className="flex items-center gap-3 bg-green-500 p-3 rounded">

{/* DASHBOARD SVG */}
<svg width="20" height="20" fill="white" viewBox="0 0 24 24">
<path d="M3 13h8V3H3v10zm10 8h8v-6h-8v6zM3 21h8v-6H3v6zm10-8h8V3h-8v10z"/>
</svg>

Dashboard
</a>

<Link to="/admin/sos" className="flex items-center gap-3 hover:bg-gray-700 p-3 rounded">

{/* SOS SVG */}
<svg width="20" height="20" fill="white" viewBox="0 0 24 24">
<path d="M12 2L2 7v7c0 5 3.8 9.7 10 10 6.2-.3 10-5 10-10V7l-10-5z"/>
</svg>

SOS Alerts
</Link>

{/* Live Video */}
<Link to="/admin/live-dashboard" className="flex items-center gap-3  hover:bg-gray-700 p-3 rounded">

{/* LIVE CAMERA SVG */}
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">

<path
strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14V10z"/>

<rect x="3" y="6" width="12" height="12" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>

</svg>

Live Video

</Link>

{/*F.I.R */}
<Link
to="/admin/fir"
className="flex items-center gap-3 hover:bg-gray-700 p-3 rounded"
>

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

{/* MAIN */}
<div className="flex-1 p-8 space-y-6">

<h1 className="text-3xl font-bold sticky top-0 bg-white p-4 shadow">Complaint Dashboard</h1>

{/* STATS */}
<div className="grid grid-cols-4 gap-6">

{[
{label:"Total",value:stats.total,color:"bg-purple-600"},
{label:"Pending",value:stats.pending,color:"bg-orange-500"},
{label:"In Progress",value:stats.progress,color:"bg-sky-500"},
{label:"Resolved",value:stats.resolved,color:"bg-green-500"}
].map((s,i)=>(

<motion.div
key={i}
whileHover={{scale:1.05}}
className={`${s.color} text-white rounded-xl p-6 shadow text-center`}
>

<p className="text-3xl font-bold">{s.value}</p>
<p>{s.label}</p>

</motion.div>

))}

</div>

{/* CHARTS*/}
<div className="grid grid-cols-3 gap-6">

<div className="col-span-2 bg-white p-6 rounded-xl shadow">

<h3 className="font-semibold text-xl mb-4">
Complaints Distribution
</h3>

<div className="h-72">

<Bar
data={chartData}
plugins={[percentPlugin]}
options={{
maintainAspectRatio:false,
plugins:{legend:{display:false}},
scales:{y:{beginAtZero:true}}
}}
/>

</div>

</div>

<div className="bg-white p-6 rounded-xl shadow">

<h3 className="font-semibold mb-4">
Status Overview
</h3>

<div className="h-72">

<Doughnut
data={doughnutData}
plugins={[doughnutPercentPlugin]}
options={{
maintainAspectRatio:false,
cutout:"70%",
plugins:{
legend:{
position:"bottom"
}
}
}}
/>

</div>

</div>

</div>

{/* SEARCH */}

<div className="bg-white p-6 rounded-xl shadow">

<input
placeholder="Search by accused name..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border p-3 rounded-full border-gray-500 w-full mb-6"
/>

{/* TABLE */}
<table className="w-full text-sm">

<thead className="bg-gray-100">

<tr>
<th className="p-3 text-left">ID</th>
<th className="p-3 text-left">Accused</th>
<th className="p-3 text-left">Type</th>
<th className="p-3 text-left">Status</th>
<th className="p-3 text-left">Evidence</th>
<th className="p-3 text-left">Update</th>
</tr>

</thead>

<tbody>

{paginated.map(c=>(

<tr key={c._id} className="border-b">

<td className="p-3">{c.complaintId}</td>

<td className="p-3">{c.username}</td>

<td className="p-3">{c.incident_type}</td>

<td className="p-3">

<span className={`px-2 py-1 rounded text-white text-xs
${c.status==="Pending" && "bg-orange-500"}
${c.status==="In Progress" && "bg-sky-500"}
${c.status==="Resolved" && "bg-green-500"}
`}>
{c.status}
</span>

</td>

<td className="p-3">

{c.evidence && (

<button
onClick={()=>setPreview(c.evidence)}
className="text-blue-600"
>

Preview

</button>

)}

</td>

<td className="p-3">

<select
value={c.status}
onChange={(e)=>updateStatus(c.complaintId,e.target.value)}
className="border rounded px-2 py-1"
>

<option>Pending</option>
<option>In Progress</option>
<option>Resolved</option>

</select>

</td>

</tr>

))}

</tbody>

</table>

{/* PAGINATION */}

<Pagination className="mt-6">
<PaginationContent>

<PaginationItem>
<PaginationPrevious
href="#"
onClick={(e)=>{
e.preventDefault()
if(page>1) setPage(page-1)
}}
/>
</PaginationItem>

{Array.from({length:totalPages}).map((_,i)=>(
<PaginationItem key={i}>
<PaginationLink
href="#"
isActive={page===i+1}
onClick={(e)=>{
e.preventDefault()
setPage(i+1)
}}
>
{i+1}
</PaginationLink>
</PaginationItem>
))}

<PaginationItem>
<PaginationNext
href="#"
onClick={(e)=>{
e.preventDefault()
if(page<totalPages) setPage(page+1)
}}
/>
</PaginationItem>

</PaginationContent>
</Pagination>

</div>

</div>

{/* EVIDENCE MODAL */}
{preview && (

<div
className="fixed inset-0 bg-black/60 flex items-center justify-center"
onClick={()=>setPreview(null)}
>

<div className="p-4 rounded">

<img
src={`http://localhost:5000/uploads/${preview}`}
className="max-w-lg"
/>

</div>

</div>

)}

</div>

)

}