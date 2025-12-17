import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { StoreProvider, useStore } from './context/StoreContext';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import RateOrder from './pages/RateOrder';

// Background component for customer pages
const BackgroundLayer: React.FC = () => {
  const { settings } = useStore();
  
  if (!settings.backgroundImage) return null;
  
  // Calculate overlay opacity (inverse of background opacity)
  // Higher backgroundOpacity = less overlay = more visible background
  const overlayOpacity = 1 - (settings.backgroundOpacity || 15) / 100;
  
  return (
    <>
      {/* Background Image - Full opacity for vivid colors */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${settings.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />
      {/* Overlay to make content readable */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none bg-white"
        style={{
          opacity: overlayOpacity,
        }}
      />
    </>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-secondary-50 font-cairo text-secondary-900 dir-rtl relative">
      {/* Background for customer pages only */}
      {!isAdminPage && <BackgroundLayer />}
      
      {/* Content layer */}
      <div className="relative z-10">
        {!isAdminPage && <Navbar />}
        {!isAdminPage && <CartSidebar />}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/rate/:orderId" element={<RateOrder />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <StoreProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Router>
          <AppContent />
        </Router>
      </StoreProvider>
    </HelmetProvider>
  );
};

export default App;