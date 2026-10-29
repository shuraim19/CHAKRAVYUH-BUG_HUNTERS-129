import React, { useEffect } from 'react';
import { IdeShell } from './components/layout/IdeShell';
import { useProjectStore } from './store/projectStore';
import './styles/index.css';

export const App: React.FC = () => {
  const initialize = useProjectStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <IdeShell />;
};

export default App;
