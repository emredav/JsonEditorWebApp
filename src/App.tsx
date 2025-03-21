import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import SchemaValidator from './components/SchemaValidator';
import Navbar from './components/ui/Navbar';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schema-validator" element={<SchemaValidator />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
