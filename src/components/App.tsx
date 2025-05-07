import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import SchemaValidator from './SchemaValidator';
import Navigation from './ui/Navigation';

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
