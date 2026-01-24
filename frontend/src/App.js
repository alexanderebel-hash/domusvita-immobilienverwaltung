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
import "./App.css";

function App() {
  return (
    <div className="App min-h-screen bg-[#050505]">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/immobilien" element={<Immobilien />} />
            <Route path="/immobilien/:id" element={<ImmobilieDetail />} />
            <Route path="/kontakte" element={<Kontakte />} />
            <Route path="/vertraege" element={<Vertraege />} />
            <Route path="/instandhaltung" element={<Instandhaltung />} />
            <Route path="/dokumente" element={<Dokumente />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

export default App;
