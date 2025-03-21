import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          JSON Tools
        </div>
        <div className="navbar-links">
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/schema-validator" className={`navbar-link ${location.pathname === '/schema-validator' ? 'active' : ''}`}>
            JSON Schema Validator
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
