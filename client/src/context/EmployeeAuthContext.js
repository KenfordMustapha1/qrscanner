import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

const EmployeeAuthContext = createContext();

export const useEmployeeAuth = () => {
  const ctx = useContext(EmployeeAuthContext);
  if (!ctx) throw new Error('useEmployeeAuth must be used within an EmployeeAuthProvider');
  return ctx;
};

export const EmployeeAuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employeeToken, setEmployeeToken] = useState(localStorage.getItem('employeeToken'));

  useEffect(() => {
    // If token exists, we can lazily load /employee/me when needed
    setLoading(false);
  }, [employeeToken]);

  const login = async (employeeId, password) => {
    try {
      const res = await api.post('/employee/login', { employeeId, password });

      const token = res?.data?.token;
      const employeeData = res?.data?.employee;

      // If the API didn't return a valid token, treat it as a failure
      if (!token || !employeeData) {
        // Clear any stale token that might exist
        localStorage.removeItem('employeeToken');
        setEmployeeToken(null);
        setEmployee(null);
        return { success: false, message: 'Invalid login response from server. Please contact the administrator.' };
      }

      localStorage.setItem('employeeToken', token);
      setEmployeeToken(token);
      setEmployee(employeeData);
      return { success: true };
    } catch (error) {
      // On failure, also clear any stale token so we don't loop on a bad token
      localStorage.removeItem('employeeToken');
      setEmployeeToken(null);
      setEmployee(null);

      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('employeeToken');
    setEmployeeToken(null);
    setEmployee(null);
  };

  const value = {
    employee,
    setEmployee,
    employeeToken,
    login,
    logout,
    loading
  };

  return (
    <EmployeeAuthContext.Provider value={value}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};

