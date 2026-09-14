/**
 * @file src/App.jsx
 * @description Top-level component establishing the application layout shell and route definitions.
 */
import TenderDetails from './pages/TenderDetails';
import { Routes, Route } from 'react-router-dom';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ScrollToTop } from './components/layout/ScrollToTop';

// Pages
import Home from './pages/Home';
import Tenders from './pages/Tenders';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-paper text-charcoal">
      <ScrollToTop />
      <Navbar />

      {/* Main content area grows to push the footer to the bottom */}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tenders" element={<Tenders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/tenders/:id" element={<TenderDetails />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}