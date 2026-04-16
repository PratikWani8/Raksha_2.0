import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import Safety from "./pages/Safety";
import Police from "./pages/Police";
import Dashboard from "./pages/Dashboard";
import Complaint from "./pages/Complaint";
import SOS from "./pages/SOS";
import GuestSOS from "./pages/GuestSOS";
import ComplaintStatus from "./pages/ComplaintStatus";
import Heatmap from "./pages/Heatmap"
import SafeRoute from "./pages/SafeRoute"
import FIRGenerator from "./pages/FIRGenerator";
import LiveEvidence from "./pages/LiveEvidence"; 
import Ecom from "./pages/Ecom";
import CoursePage from "./pages/CoursePage"
import AdminDashboard from "./pages/AdminDashboard";
import AdminSOS from "./pages/AdminSOS";
import AdminFIRPreview from "./pages/AdminFIRPreview";
import AISurveillance from "./pages/AISurveillance";
import AdminLiveDashboard from "./pages/AdminLiveDashboard";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/police" element={<Police />} />
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/complaint" element={<Complaint/>} />
        <Route path="/sos" element={<SOS/>} />
        <Route path="/guest-sos" element={<GuestSOS/>} />
        <Route path="/status"element={<ComplaintStatus/>}/>
        <Route path="/heatmap" element={<Heatmap/>}/>
        <Route path="/safe-route" element={<SafeRoute/>}/>
        <Route path="/fir" element={<FIRGenerator/>}/>
        <Route path="/live-evidence" element={<LiveEvidence/>}/>
        <Route path="/ecom" element={<Ecom/>}/>
        <Route path="/course" element={<CoursePage/>}/>
        <Route path="/admin" element={<AdminDashboard/>}/>
        <Route path="/admin/sos" element={<AdminSOS/>}/>
        <Route path="/admin/fir" element={<AdminFIRPreview/>}/>
        <Route path="/admin/ai-surveillance" element={<AISurveillance/>}/>
        <Route path="/admin/live-dashboard" element={<AdminLiveDashboard/>}/>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;