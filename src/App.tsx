import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import SchemaValidator from './components/SchemaValidator';
import Navigation from './components/ui/Navigation';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Navigation />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/validator" element={<SchemaValidator />} />
        <Route path="/" element={<Navigate to="/home" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
