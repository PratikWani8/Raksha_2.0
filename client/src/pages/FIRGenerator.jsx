import { useState,useEffect } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import { Upload } from "lucide-react"
import Tesseract from "tesseract.js"
import Swal from "sweetalert2"
import { jsPDF } from "jspdf"
import SignatureCanvas from "react-signature-canvas"
import { useRef } from "react"
import { FileText, Download, Send } from "lucide-react"
import policeLogo from "../assets/policeLogo.png"

export default function FIRGenerator(){

const [userNo,setUserNo] = useState("")
const [name,setName] = useState("")
const [phone,setPhone] = useState("")
const [location,setLocation] = useState("")
const [description,setDescription] = useState("")
const [firSrNo, setFirSrNo] = useState("")
const [crimeType,setCrimeType] = useState("")
const [ipc,setIPC] = useState("")
const [output,setOutput] = useState("")
const [lang,setLang] = useState("en")
const [recording,setRecording] = useState(false)
const [file,setFile] = useState(null)
const [fileName,setFileName] = useState("")
const [ocrEnabled, setOcrEnabled] = useState(true)
const sigRef = useRef()
const [submitted,setSubmitted] = useState(false)

// Fetch user profile
useEffect(()=>{

async function loadUser(){

try{
const token = localStorage.getItem("token")

const res = await axios.get(
"http://localhost:5000/api/auth/profile",
{
headers:{
Authorization:`Bearer ${token}`
}
}
)

setUserNo(res.data.userNo)
setName(res.data.name)
setPhone(res.data.phone)

}catch(err){
console.log(err)
}
}

loadUser()

},[])

// Get location
useEffect(()=>{

navigator.geolocation.getCurrentPosition(
async pos=>{

const lat = pos.coords.latitude
const lng = pos.coords.longitude

try{

const res = await axios.get(
`http://localhost:5000/api/address?lat=${lat}&lng=${lng}`
)

setLocation(res.data.place || `${lat}, ${lng}`)

}catch(err){

console.log(err)

setLocation(`${lat}, ${lng}`)

}

},
()=>{

setLocation("Location unavailable")

}
)

},[])

// Voice input
function startVoice(){

if(!('webkitSpeechRecognition' in window)){
alert("Voice not supported")
return
}

const recognition = new window.webkitSpeechRecognition()

recognition.lang =
lang==="hi" ? "hi-IN"
: lang==="mr" ? "mr-IN"
: "en-IN"

setRecording(true)

recognition.start()

recognition.onresult = (e)=>{

const text = e.results[0][0].transcript

setDescription(prev => prev + " " + text)

}

recognition.onend = ()=>{
setRecording(false)
}

}

// FILE UPLOAD 
const handleFile = async (e) => {

  const file = e.target.files[0]
  if (!file) return

  const allowed = ["image/jpeg","image/png","audio/mpeg"]

  if (!allowed.includes(file.type)) {
    Swal.fire("Invalid File","Only image/audio allowed","error")
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    Swal.fire("File too large","Max size is 2MB","error")
    return
  }

  setFile(file)
  setFileName(file.name)

// ocr
  if (!ocrEnabled || !file.type.startsWith("image")) return

  try {

    Swal.fire({
      title: "Scanning Image...",
      text: "Extracting text using OCR",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    })

    const imageUrl = URL.createObjectURL(file)

    const { data } = await Tesseract.recognize(
      imageUrl,
      "eng", 
      {
        logger: m => console.log(m)
      }
    )

    // 
    const extractedText = data.text
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    console.log("OCR TEXT:", extractedText)

    if (!extractedText || extractedText.length < 5) {
      Swal.fire("No Text Found","Try clearer image","warning")
      return
    }

    setDescription(prev => prev + " " + extractedText)

    // nlp for crime detection
    const res = await axios.post(
      "http://localhost:8000/nlp",
      { text: extractedText }
    )

    setCrimeType(res.data.type)
    setIPC(res.data.ipc)

    Swal.fire("Success","Text extracted & crime detected","success")

  } catch (err) {
    console.log(err)
    Swal.fire("Error","OCR failed","error")
  }
}

// Generate FIR
async function generateFIR(){

if(!description){
alert("Please describe the incident")
return
}

const res = await axios.post(
"http://localhost:8000/nlp",
{ text:description }
)

const type = res.data.type
const ipcSections = res.data.ipc

setCrimeType(type)
setIPC(ipcSections)

const date = new Date().toLocaleDateString()
const time = new Date().toLocaleTimeString()

let fir=""

if(lang==="en"){

fir = `
=================================================
           FIRST INFORMATION REPORT (FIR)
=================================================

Date: ${date}
Time: ${time}

--------------------------------------------------
COMPLAINANT DETAILS
--------------------------------------------------
Name            : ${name}
Contact Number  : ${phone}
Address         : ${location}

--------------------------------------------------
INCIDENT DETAILS
--------------------------------------------------
Type of Offence : ${type}
Applicable Law  : ${ipcSections}
Date & Time     : ${date}, ${time}
Place           : ${location}

--------------------------------------------------
DESCRIPTION OF INCIDENT
--------------------------------------------------
${description}

--------------------------------------------------
DECLARATION
--------------------------------------------------
I hereby declare that the information provided above is true
to the best of my knowledge and belief. I request the police
authorities to take appropriate legal action.

Signature: _______________________

Name: ${name}
Date: ${date}

=================================================
    `;
    }

    // -------- HINDI FIR --------
    if(lang === "hi"){
        fir = `
=================================================
          प्रथम सूचना रिपोर्ट (FIR)
=================================================

दिनांक: ${date}
समय: ${time}

--------------------------------------------------
शिकायतकर्ता विवरण
--------------------------------------------------
नाम: ${name}
मोबाइल: ${phone}
पता: ${location}

--------------------------------------------------
घटना विवरण
--------------------------------------------------
अपराध का प्रकार: ${type}
लागू कानून: ${ipcSections}
स्थान: ${location}

--------------------------------------------------
घटना का विवरण
--------------------------------------------------
${description}

--------------------------------------------------
घोषणा
--------------------------------------------------
मैं घोषणा करता/करती हूँ कि दी गई जानकारी सत्य है।

हस्ताक्षर: ____________________

नाम: ${name}
दिनांक: ${date}

=================================================
        `;
    }

    // -------- MARATHI FIR --------
    if(lang === "mr"){
        fir = `
=================================================
        प्रथम माहिती अहवाल (FIR)
=================================================

दिनांक: ${date}
वेळ: ${time}

--------------------------------------------------
तक्रारदार माहिती
--------------------------------------------------
नाव: ${name}
मोबाईल: ${phone}
पत्ता: ${location}

--------------------------------------------------
घटना तपशील
--------------------------------------------------
गुन्ह्याचा प्रकार: ${type}
कायदा: ${ipcSections}
ठिकाण: ${location}

--------------------------------------------------
घटनेचे वर्णन
--------------------------------------------------
${description}

--------------------------------------------------
घोषणा
--------------------------------------------------
मी दिलेली माहिती खरी आहे.

स्वाक्षरी: ____________________

नाव: ${name}
दिनांक: ${date}

=================================================
`}

// -------- TELUGU FIR --------
if(lang === "te"){
    fir = `
=================================================
        ప్రథమ సమాచారం నివేదిక (FIR)
=================================================

తేదీ: ${date}
సమయం: ${time}

--------------------------------------------------
ఫిర్యాదుదారు వివరాలు
--------------------------------------------------
పేరు: ${name}
మొబైల్: ${phone}
చిరునామా: ${location}

--------------------------------------------------
సంఘటన వివరాలు
--------------------------------------------------
నేర రకం: ${type}
చట్టం: ${ipcSections}
స్థలం: ${location}

--------------------------------------------------
సంఘటన వివరణ
--------------------------------------------------
${description}

--------------------------------------------------
ప్రకటన
--------------------------------------------------
నేను ఇచ్చిన సమాచారం నిజమైనది.

సంతకం: ____________________

పేరు: ${name}
తేదీ: ${date}

=================================================
`
}

// -------- TAMIL FIR --------
if(lang === "ta"){
    fir = `
=================================================
        முதல் தகவல் அறிக்கை (FIR)
=================================================

தேதி: ${date}
நேரம்: ${time}

--------------------------------------------------
புகார் அளிப்பவரின் தகவல்
--------------------------------------------------
பெயர்: ${name}
மொபைல்: ${phone}
முகவரி: ${location}

--------------------------------------------------
சம்பவ விவரங்கள்
--------------------------------------------------
குற்ற வகை: ${type}
சட்டம்: ${ipcSections}
இடம்: ${location}

--------------------------------------------------
சம்பவத்தின் விளக்கம்
--------------------------------------------------
${description}

--------------------------------------------------
அறிக்கை
--------------------------------------------------
நான் வழங்கிய தகவல் உண்மையானது.

கையொப்பம்: ____________________

பெயர்: ${name}
தேதி: ${date}

=================================================
`
}

// -------- KANNADA FIR --------
if(lang === "kn"){
    fir = `
=================================================
        ಪ್ರಥಮ ಮಾಹಿತಿ ವರದಿ (FIR)
=================================================

ದಿನಾಂಕ: ${date}
ಸಮಯ: ${time}

--------------------------------------------------
ದೂರುದಾರರ ಮಾಹಿತಿ
--------------------------------------------------
ಹೆಸರು: ${name}
ಮೊಬೈಲ್: ${phone}
ವಿಳಾಸ: ${location}

--------------------------------------------------
ಘಟನೆಯ ವಿವರಗಳು
--------------------------------------------------
ಅಪರಾಧದ ಪ್ರಕಾರ: ${type}
ಕಾನೂನು: ${ipcSections}
ಸ್ಥಳ: ${location}

--------------------------------------------------
ಘಟನೆಯ ವಿವರಣೆ
--------------------------------------------------
${description}

--------------------------------------------------
ಘೋಷಣೆ
--------------------------------------------------
ನಾನು ನೀಡಿದ ಮಾಹಿತಿ ಸತ್ಯವಾಗಿದೆ.

ಸಹಿ: ____________________

ಹೆಸರು: ${name}
ದಿನಾಂಕ: ${date}

=================================================
`
}

// -------- MALAYALAM FIR --------
if(lang === "ml"){
    fir = `
=================================================
        പ്രാഥമിക വിവരം റിപ്പോർട്ട് (FIR)
=================================================

തീയതി: ${date}
സമയം: ${time}

--------------------------------------------------
പരാതിക്കാരന്റെ വിവരങ്ങൾ
--------------------------------------------------
പേര്: ${name}
മൊബൈൽ: ${phone}
വിലാസം: ${location}

--------------------------------------------------
സംഭവത്തിന്റെ വിശദാംശങ്ങൾ
--------------------------------------------------
കുറ്റത്തിന്റെ തരം: ${type}
നിയമം: ${ipcSections}
സ്ഥലം: ${location}

--------------------------------------------------
സംഭവത്തിന്റെ വിവരണം
--------------------------------------------------
${description}

--------------------------------------------------
പ്രഖ്യാപനം
--------------------------------------------------
ഞാൻ നൽകിയ വിവരങ്ങൾ സത്യമാണ്.

ഒപ്പ്: ____________________

പേര്: ${name}
തീയതി: ${date}

=================================================
`
}

// -------- GUJARATI FIR --------
if(lang === "gu"){
    fir = `
=================================================
        પ્રથમ માહિતી અહેવાલ (FIR)
=================================================

તારીખ: ${date}
સમય: ${time}

--------------------------------------------------
ફરિયાદી માહિતી
--------------------------------------------------
નામ: ${name}
મોબાઇલ: ${phone}
સરનામું: ${location}

--------------------------------------------------
ઘટનાની વિગતો
--------------------------------------------------
ગુનાનો પ્રકાર: ${type}
કાયદો: ${ipcSections}
સ્થળ: ${location}

--------------------------------------------------
ઘટનાનું વર્ણન
--------------------------------------------------
${description}

--------------------------------------------------
જાહેરાત
--------------------------------------------------
હું આપેલી માહિતી સાચી છે.

હસ્તાક્ષર: ____________________

નામ: ${name}
તારીખ: ${date}

=================================================
`
}

// -------- PUNJABI FIR --------
if(lang === "pa"){
    fir = `
=================================================
        ਪਹਿਲੀ ਜਾਣਕਾਰੀ ਰਿਪੋਰਟ (FIR)
=================================================

ਤਾਰੀਖ: ${date}
ਸਮਾਂ: ${time}

--------------------------------------------------
ਸ਼ਿਕਾਇਤਕਰਤਾ ਦੀ ਜਾਣਕਾਰੀ
--------------------------------------------------
ਨਾਂ: ${name}
ਮੋਬਾਈਲ: ${phone}
ਪਤਾ: ${location}

--------------------------------------------------
ਘਟਨਾ ਦੇ ਵੇਰਵੇ
--------------------------------------------------
ਅਪਰਾਧ ਦੀ ਕਿਸਮ: ${type}
ਕਾਨੂੰਨ: ${ipcSections}
ਥਾਂ: ${location}

--------------------------------------------------
ਘਟਨਾ ਦਾ ਵੇਰਵਾ
--------------------------------------------------
${description}

--------------------------------------------------
ਘੋਸ਼ਣਾ
--------------------------------------------------
ਮੈਂ ਦਿੱਤੀ ਜਾਣਕਾਰੀ ਸਹੀ ਹੈ।

ਦਸਤਖਤ: ____________________

ਨਾਂ: ${name}
ਤਾਰੀਖ: ${date}

=================================================
`
}

// -------- BENGALI FIR --------
if(lang === "bn"){
    fir = `
=================================================
        প্রথম তথ্য প্রতিবেদন (FIR)
=================================================

তারিখ: ${date}
সময়: ${time}

--------------------------------------------------
অভিযোগকারীর তথ্য
--------------------------------------------------
নাম: ${name}
মোবাইল: ${phone}
ঠিকানা: ${location}

--------------------------------------------------
ঘটনার বিবরণ
--------------------------------------------------
অপরাধের ধরন: ${type}
আইন: ${ipcSections}
স্থান: ${location}

--------------------------------------------------
ঘটনার বর্ণনা
--------------------------------------------------
${description}

--------------------------------------------------
ঘোষণা
--------------------------------------------------
আমি প্রদত্ত তথ্য সঠিক।

স্বাক্ষর: ____________________

নাম: ${name}
তারিখ: ${date}

=================================================
`
}

setOutput(fir)

}

// Download FIR as PDF
async function downloadFIR(){

if(!output){
alert("Generate FIR first")
return
}

const doc = new jsPDF()

// border
doc.rect(5,5,200,287)

// watermark
doc.setTextColor(220)
doc.setFontSize(60)
doc.text("SAMPLE FIR COPY",115,160,{align:"center",angle:45})
doc.setTextColor(0)

// logo
doc.addImage(policeLogo,"PNG",90,10,30,30)

// title
doc.setFontSize(18)
doc.text("MAHARASHTRA POLICE",105,50,{align:"center"})

doc.setFontSize(14)
doc.text("FIRST INFORMATION REPORT (FIR)",105,58,{align:"center"})

doc.line(20,62,190,62)

// FIR text
doc.setFontSize(11)
const lines = doc.splitTextToSize(output,170)
doc.text(lines,20,75)

// check signature
if(sigRef.current.isEmpty()){
alert("Please add signature before downloading FIR")
return
}

const pageHeight = doc.internal.pageSize.height
const finalY = 75 + (lines.length * 6)

let signatureY = finalY + 10

if(signatureY > pageHeight - 60){
signatureY = pageHeight - 60
}

// signature image
const signatureImage = sigRef.current
.getCanvas()
.toDataURL("image/png")

doc.addImage(signatureImage,"PNG",150,signatureY,40,20)

doc.line(150,signatureY + 22,195,signatureY + 22) // line under signature

doc.text("Digital Signature",150,signatureY + 30)

doc.save("FIR.pdf")

}

// Submit FIR
async function submitFIR(){

if(!output){
alert("Generate FIR first")
return
}

const formData = new FormData()

formData.append("userNo",userNo)
formData.append("name",name)
formData.append("phone",phone)
formData.append("location",location)
formData.append("crimeType",crimeType)
formData.append("ipc",ipc)
formData.append("description",description)
formData.append("fir",output)

if(file){
formData.append("evidence",file)
}

const res = await axios.post(
"http://localhost:5000/api/fir",
formData,
{
headers:{ "Content-Type":"multipart/form-data" }
}
)

setFirSrNo(res.data.firSrNo)

setSubmitted(true)

setTimeout(()=>{
setSubmitted(false)
},3000)

}

return (

<div className="min-h-screen bg-linear-to-br from-blue-200 via-purple-200 to-pink-200 flex items-center justify-center p-6">

<motion.div
initial={{opacity:0,scale:0.9}}
animate={{opacity:1,scale:1}}
className="backdrop-blur-xl bg-white/30 border border-white/40 shadow-2xl rounded-2xl p-8 w-full max-w-2xl"
>

{/* FIR HEADER */}
<div className="text-center mb-6 border-b pb-4">

<div className="flex items-center justify-center gap-3">

<svg width="40" height="40" viewBox="0 0 24 24" fill="#1e40af">
<path d="M12 2L2 7l10 5 10-5-10-5zm0 7l10-5v13l-10 5-10-5V4l10 5z"/>
</svg>

<h2 className="text-2xl font-bold text-blue-900">
First Information Report (FIR)
</h2>

</div>

<p className="text-sm text-gray-700 mt-1">
AI Assisted FIR Registration
</p>

</div>

{/* INPUTS */}
<div className="space-y-3">

<input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Complainant Name" className="input"/>
<input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Phone Number" className="input"/>
<input value={location || ""} onChange={(e)=>setLocation(e.target.value)} placeholder="Incident Location" className="input"/>

</div>

{/* INCIDENT DESCRIPTION */}
<div className="relative mt-3">

<textarea
value={description}
onChange={(e)=>setDescription(e.target.value)}
placeholder="Describe the incident..."
className="input h-40 pr-14"
/>

<button
onClick={startVoice}
className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition
${recording ? "bg-red-600 animate-pulse scale-110" : "bg-blue-600 hover:scale-105"}
`}
>

<svg width="18" height="18" fill="white" viewBox="0 0 24 24">
<path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z"/>
<path d="M19 11a7 7 0 0 1-14 0H3a9 9 0 0 0 18 0h-2z"/>
</svg>

</button>
</div>

{/* FILE UPLOAD & OCR TOGGLE */}
<div className="mt-4">

<label className="font-medium block mb-2">
Upload Evidence
</label>

<div className="flex gap-3">

{/* Upload Button */}
<label className="w-1/2 flex items-center justify-center gap-2 border border-dashed border-pink-400 rounded-lg p-3 cursor-pointer hover:bg-pink-50 transition">

<Upload size={18}/>
<span className="text-sm">Upload</span>

<input
type="file"
accept="image/*,audio/*"
onChange={handleFile}
className="hidden"
/>

</label>

{/* OCR Toggle */}
<div className="w-1/2 flex items-center justify-between bg-gray-100 px-3 rounded-lg">

<span className="text-sm font-medium">OCR</span>

<div
onClick={() => setOcrEnabled(!ocrEnabled)}
className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition
${ocrEnabled ? "bg-green-500" : "bg-gray-400"}`}
>
<div className={`bg-white w-4 h-4 rounded-full shadow transform transition
${ocrEnabled ? "translate-x-5" : ""}
`} />
</div>

</div>

</div>

<p className="text-xs text-gray-500 mt-1">
Image / Audio only (max 2MB)
</p>

{fileName && (
<p className="text-xs text-green-600 mt-1">
📎 Uploaded: {fileName}
</p>
)}

{/* Image Preview */}
{file && file.type.startsWith("image") && (
<img
src={URL.createObjectURL(file)}
alt="preview"
className="mt-2 w-full h-40 object-cover rounded-lg"
/>
)}

</div>

{/* CRIME DETECTION DISPLAY */}
{crimeType && (
<div className="bg-blue-100 p-3 rounded-lg mt-3">
<p className="text-sm font-semibold">
Detected Crime: {crimeType}
</p>
<p className="text-xs text-gray-600">
IPC: {ipc}
</p>
</div>
)}

{/* DIGITAL SIGNATURE */}
<div className="mt-6">

<p className="text-sm font-semibold mb-2">
Digital Signature
</p>

<SignatureCanvas
ref={sigRef}
penColor="black"
canvasProps={{
width:400,
height:150,
className:"border rounded-lg bg-white"
}}
/>

<button
onClick={()=>sigRef.current.clear()}
className="mt-2 bg-red-500 text-white px-4 py-1 rounded"
>
Clear Signature
</button>

</div>

{/* LANGUAGE */}
<select
value={lang}
onChange={(e)=>setLang(e.target.value)}
className="input mt-4"
>
<option value="en">English</option>
<option value="hi">Hindi</option>
<option value="mr">Marathi</option>
<option value="te">Telugu</option>
<option value="ta">Tamil</option>
<option value="kn">Kannada</option>
<option value="ml">Malayalam</option>
<option value="gu">Gujarati</option>
<option value="pa">Punjabi</option>
<option value="bn">Bengali</option>
</select>

{/* BUTTONS */}
<button
  onClick={generateFIR}
  disabled={!description}
  className="w-full bg-blue-700 text-white p-3 rounded-xl mt-3 disabled:bg-gray-400 flex items-center justify-center gap-2"
>
  <FileText size={20} />
  <span>Generate FIR</span>
</button>

<button
  onClick={downloadFIR}
  className="w-full bg-green-600 text-white p-3 rounded-xl mt-3 flex items-center justify-center gap-2"
>
  <Download size={20} />
  <span>Download FIR</span>
</button>

<button
  onClick={submitFIR}
  className="w-full bg-purple-700 text-white p-3 rounded-xl mt-3 flex items-center justify-center gap-2"
>
  <Send size={20} />
  <span>Submit to Police Admin</span>
</button>

{/* SUCCESS */}
{submitted && (

<motion.div
initial={{scale:0,opacity:0}}
animate={{scale:1,opacity:1}}
transition={{type:"spring",stiffness:200}}
className="flex flex-col items-center mt-4"
>

<div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg">

<svg width="32" height="32" fill="white" viewBox="0 0 24 24">
<path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z"/>
</svg>

</div>

<p className="text-green-700 font-semibold mt-2">
FIR Submitted Successfully
</p>

</motion.div>

)}

{/* OUTPUT */}
<textarea
value={output}
readOnly
className="input h-52 mt-4 bg-white/40 backdrop-blur-md"
/>

</motion.div>
</div>

)
}