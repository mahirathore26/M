import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import BookingDetailsPage from './pages/BookingDetailsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#FBFAF7] text-[#10183D] selection:bg-[#2764D9] selection:text-white">
        <Navbar />
        <main className="flex-1 pb-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/checkout/:quoteId" element={<CheckoutPage />} />
            <Route path="/bookings/:bookingId" element={<BookingDetailsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
