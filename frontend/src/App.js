import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Immobilien from "./pages/Immobilien";
import ImmobilieDetail from "./pages/ImmobilieDetail";
import Kontakte from "./pages/Kontakte";
import Vertraege from "./pages/Vertraege";
import Instandhaltung from "./pages/Instandhaltung";
import Dokumente from "./pages/Dokumente";
import HandwerkerLogin from "./pages/handwerker/HandwerkerLogin";
import HandwerkerTickets from "./pages/handwerker/HandwerkerTickets";
import HandwerkerTicketDetail from "./pages/handwerker/HandwerkerTicketDetail";
// Klientenmanagement
import PflegeWGs from "./pages/PflegeWGs";
import PflegeWGDetail from "./pages/PflegeWGDetail";
import KlientenPipeline from "./pages/KlientenPipeline";
import KlientDetail from "./pages/KlientDetail";
import "./App.css";

function App() {
  return (
    <div className="App min-h-screen bg-[#050505]">
      <BrowserRouter>
        <Routes>
          {/* Main App Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/immobilien" element={<Immobilien />} />
            <Route path="/immobilien/:id" element={<ImmobilieDetail />} />
            <Route path="/kontakte" element={<Kontakte />} />
            <Route path="/vertraege" element={<Vertraege />} />
            <Route path="/instandhaltung" element={<Instandhaltung />} />
            <Route path="/dokumente" element={<Dokumente />} />
            {/* Klientenmanagement Routes */}
            <Route path="/pflege-wgs" element={<PflegeWGs />} />
            <Route path="/pflege-wgs/:wgId" element={<PflegeWGDetail />} />
            <Route path="/pflege-wgs/pipeline" element={<KlientenPipeline />} />
          </Route>
          
          {/* Handwerker Mobile Portal Routes - No Layout */}
          <Route path="/handwerker" element={<HandwerkerLogin />} />
          <Route path="/handwerker/tickets" element={<HandwerkerTickets />} />
          <Route path="/handwerker/ticket/:ticketId" element={<HandwerkerTicketDetail />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

export default App;
