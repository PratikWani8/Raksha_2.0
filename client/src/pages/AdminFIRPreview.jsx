import { useEffect,useState } from "react"
import API, { BASE_URL } from "../api/api";
import { motion } from "framer-motion"
import { Link } from "react-router-dom"

import {
Pagination,
PaginationContent,
PaginationItem,
PaginationNext,
PaginationPrevious,
PaginationLink
} from "@/components/ui/pagination"

export default function AdminFIRPreview(){

const [firs,setFirs] = useState([])
const [search,setSearch] = useState("")
const [preview,setPreview] = useState(null)
const [page,setPage] = useState(1)
const [newFIRs,setNewFIRs] = useState(0)

const perPage = 6

const [stats,setStats] = useState({
total:0
})

useEffect(()=>{
loadFIRs()
},[])

const loadFIRs = async () => {
  try {

    const res = await API.get("/api/fir");

    setFirs(res.data);

    setStats({
      total: res.data.length,
    });

    // detect FIRs created in last 24 hours
    const today = new Date();

    const newCount = res.data.filter((f) => {
      const created = new Date(f.date);

      return today - created < 86400000;
    }).length;

    setNewFIRs(newCount);

  } catch (err) {
    console.error("Error loading FIRs:", err);
  }
};

const filtered = firs.filter(f=>
f.name?.toLowerCase().includes(search.toLowerCase())
)

const totalPages = Math.ceil(filtered.length/perPage)

const start = (page-1)*perPage

const paginated = filtered.slice(start,start+perPage)

return(

<div className="flex min-h-screen bg-gray-100">

{/* SIDEBAR */}
<div className="w-64 bg-gray-900 text-white p-6 space-y-6 sticky top-0 h-screen">

<h2 className="text-xl font-bold mb-6">Admin Panel</h2>

<nav className="space-y-3">

<Link to="/admin" className="flex items-center gap-3  hover:bg-gray-700 p-3 rounded">

{/* DASHBOARD SVG */}
<svg width="20" height="20" fill="white" viewBox="0 0 24 24">
<path d="M3 13h8V3H3v10zm10 8h8v-6h-8v6zM3 21h8v-6H3v6zm10-8h8V3h-8v10z"/>
</svg>

Dashboard
</Link>

<Link to="/admin/sos" className="flex items-center gap-3 hover:bg-gray-700 p-3 rounded">

{/* SOS SVG */}
<svg width="20" height="20" fill="white" viewBox="0 0 24 24">
<path d="M12 2L2 7v7c0 5 3.8 9.7 10 10 6.2-.3 10-5 10-10V7l-10-5z"/>
</svg>

SOS Alerts
</Link>

{/* Live Video */}
<Link to="/admin/live-dashboard" className="flex items-center gap-3  hover:bg-gray-700 p-3 rounded">

<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">

<path
strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14V10z"/>

<rect x="3" y="6" width="12" height="12" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>

Live Video
</Link>

{/* FIR */}
<Link
to="/admin/fir"
className="flex items-center gap-3  bg-green-500 p-3 rounded"
>

{/* FIR SVG */}
<svg width="20" height="20" fill="white" viewBox="0 0 24 24">
<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
<path d="M14 2v6h6"/>
<path d="M16 13H8"/>
<path d="M16 17H8"/>
<path d="M10 9H8"/>
</svg>

FIR Records

{newFIRs>0 && (

<span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
🚨 {newFIRs}
</span>

)}

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

<h1 className="text-3xl font-bold sticky top-0 bg-white p-4 shadow">
FIR Dashboard
</h1>

{/* STATS */}
<div className="grid grid-cols-1 gap-6">

<motion.div
whileHover={{scale:1.05}}
className="bg-purple-600 text-white rounded-xl p-6 shadow text-center"

>

<p className="text-3xl font-bold">{stats.total}</p>
<p>Total FIRs</p>

</motion.div>

</div>

{/* SEARCH */}
<div className="bg-white p-6 rounded-xl shadow">

<input
placeholder="Search by complainant name..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border p-3 rounded-full border-gray-500 w-full mb-6"
/>

{/* TABLE */}
<table className="w-full text-sm">

<thead className="bg-gray-100">

<tr>
<th className="p-3 text-left">FIR No</th>
<th className="p-3 text-left">Name</th>
<th className="p-3 text-left">Crime</th>
<th className="p-3 text-left">IPC</th>
<th className="p-3 text-left">Location</th>
<th className="p-3 text-left">Description</th>
<th className="p-3 text-left">Evidence</th>
<th className="p-3 text-left">Date</th>
</tr>

</thead>

<tbody>

{paginated.map(fir=>(

<tr key={fir._id} className="border-b">

<td className="p-3">{fir.firSrNo}</td>

<td className="p-3">{fir.name}</td>

<td className="p-3">{fir.crimeType}</td>

<td className="p-3">{fir.ipc}</td>

<td className="p-3">{fir.location}</td>

<td className="p-3">{fir.description}</td>


<td className="p-3">

{fir.evidence && (

<button
onClick={()=>setPreview(fir.evidence)}
className="text-blue-600"

>

Preview

</button>

)}

</td>

<td className="p-3">{new Date(fir.date).toLocaleDateString()}</td>

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

<div className="p-4 rounded bg-white">

<img
src={`${BASE_URL}/uploads/${preview}`}
className="max-w-lg"
alt="Evidence"
/>

</div>

</div>

)}

</div>

)

}
