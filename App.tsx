import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import AppRoutes from './routes';
import { initDevtoolProtection } from './services/devtoolProtection';

// Initialize devtool protection once at module load (production only).
initDevtoolProtection({
  bypassHash: import.meta.env.VITE_DEVTOOL_BYPASS_HASH as string | undefined,
});

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
