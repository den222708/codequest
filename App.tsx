import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import AppRoutes from './routes';

const AppContent: React.FC = () => {
  const { darkMode } = useApp();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return <AppRoutes />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
