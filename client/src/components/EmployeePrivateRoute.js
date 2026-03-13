import React from 'react';
import { Navigate } from 'react-router-dom';
import { useEmployeeAuth } from '../context/EmployeeAuthContext';

const EmployeePrivateRoute = ({ children }) => {
  const { employeeToken, loading } = useEmployeeAuth();

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return employeeToken ? children : <Navigate to="/employee/login" replace />;
};

export default EmployeePrivateRoute;

