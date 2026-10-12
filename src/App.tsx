// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from './app/hooks';
import { rehydrate } from './app/authSlice';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import Dashboard from './features/dashboard/Dashboard';
import CreateStory from './features/createStory/CreateStory';
import RundownView from './features/rundowns/RundownView';
import TickerView from './features/ticker/TickerView';
import UsersView from './features/users/UsersView';
import Prompter from './features/prompter/Prompter';

// Layout wrapper – hides Header on login page
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  return (
    <>
      {!isLoginPage && <Header />}
      <main
        style={{
          height: isLoginPage ? '100vh' : 'calc(100vh - 56px)',
          overflow: 'hidden',
          background: '#f8fafc',
        }}
      >
        {children}
      </main>
    </>
  );
};

function App() {
  const dispatch = useAppDispatch();

  // Rehydrate auth state from localStorage on app load
  useEffect(() => {
    dispatch(rehydrate());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />
        <Route path="/" element={<Layout><ProtectedRoute><Dashboard /></ProtectedRoute></Layout>} />
        <Route path="/dashboard" element={<Layout><ProtectedRoute><Dashboard /></ProtectedRoute></Layout>} />
        <Route path="/create-story" element={<Layout><ProtectedRoute><CreateStory /></ProtectedRoute></Layout>} />
        <Route path="/rundowns" element={<Layout><ProtectedRoute><RundownView /></ProtectedRoute></Layout>} />
        <Route path="/tickers" element={<Layout><ProtectedRoute><TickerView /></ProtectedRoute></Layout>} />
        <Route path="/users" element={<Layout><ProtectedRoute><UsersView /></ProtectedRoute></Layout>} />
        <Route path="/prompter" element={<Prompter />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;