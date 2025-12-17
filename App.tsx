import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { StoreProvider, useStore } from './context/StoreContext';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import WishlistSidebar from './components/WishlistSidebar';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import RateOrder from './pages/RateOrder';



const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === '/hive-control-x9k2m';

  return (
    <div className="min-h-screen bg-secondary-50 font-cairo text-secondary-900 dir-rtl relative">
      {/* Content layer */}
      <div className="flex flex-col min-h-screen bg-gray-50">
        {!isAdminPage && <Navbar />}
        {!isAdminPage && <CartSidebar />}
        {!isAdminPage && <WishlistSidebar />}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/hive-control-x9k2m" element={<Admin />} />
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