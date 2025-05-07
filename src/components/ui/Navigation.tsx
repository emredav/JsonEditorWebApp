import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../styles/components.css';

const Navigation: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          JSON Editor
        </div>
        <div className="navbar-links">
          <NavLink 
            to="/home" 
            className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}
          >
            Home
          </NavLink>
          <NavLink 
            to="/validator" 
            className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}
          >
            Validator
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
