import React from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../Dashboard/Dashboard';

const NavigationWrapper = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Dashboard onNavigate={handleNavigation} />
  );
};

export default NavigationWrapper;