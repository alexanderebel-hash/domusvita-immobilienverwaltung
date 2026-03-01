import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./lib/auth/AuthProvider";
import Datenschutz from "./pages/Datenschutz";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Immobilien from "./pages/Immobilien";
import ImmobilieDetail from "./pages/ImmobilieDetail";
import Kontakte from "./pages/Kontakte";
import Vertraege from "./pages/Vertraege";
import Instandhaltung from "./pages/Instandhaltung";
import Dokumente from "./pages/Dokumente";
import Login from "./pages/Login";
import HandwerkerLogin from "./pages/handwerker/HandwerkerLogin";
import HandwerkerTickets from "./pages/handwerker/HandwerkerTickets";
import HandwerkerTicketDetail from "./pages/handwerker/HandwerkerTicketDetail";
// Klientenmanagement
import PflegeWGs from "./pages/PflegeWGs";
import PflegeWGDetail from "./pages/PflegeWGDetail";
import KlientenPipeline from "./pages/KlientenPipeline";
import KlientDetail from "./pages/KlientDetail";
import NeuerKlient from "./pages/NeuerKlient";
import Besichtigungen from "./pages/Besichtigungen";
import EinzugspaketGenerator from "./pages/EinzugspaketGenerator";
import "./App.css";

// Protected routes wrapper - redirects to login if not authenticated
function ProtectedApp() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
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
        <Route path="/pflege-wgs/pipeline" element={<KlientenPipeline />} />
        <Route path="/pflege-wgs/besichtigungen" element={<Besichtigungen />} />
        <Route path="/pflege-wgs/einzugspaket" element={<EinzugspaketGenerator />} />
        <Route path="/pflege-wgs/klienten/neu" element={<NeuerKlient />} />
        <Route path="/pflege-wgs/klienten/:klientId" element={<KlientDetail />} />
        <Route path="/pflege-wgs/:wgId" element={<PflegeWGDetail />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <div className="App min-h-screen bg-slate-50">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Handwerker Mobile Portal Routes - No Auth Guard */}
            <Route path="/handwerker" element={<HandwerkerLogin />} />
            <Route path="/handwerker/tickets" element={<HandwerkerTickets />} />
            <Route path="/handwerker/ticket/:ticketId" element={<HandwerkerTicketDetail />} />

            {/* Public route — accessible without authentication */}
            <Route path="/datenschutz" element={<Datenschutz />} />

            {/* Protected Main App Routes */}
            <Route path="/*" element={<ProtectedApp />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" theme="light" />
      </AuthProvider>
    </div>
    </ErrorBoundary>
  );
}

export default App;
