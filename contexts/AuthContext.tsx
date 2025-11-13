import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, User } from '../lib/storage';

interface AuthContextType {
  currentUser: Omit<User, 'password'> | null;
  login: (username: string, pass: string) => Promise<Omit<User, 'password'> | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'vinielaCurrentUser';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Omit<User, 'password'> | null>(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      return null;
    }
  });

  const navigate = useNavigate();

  const login = async (username: string, pass: string): Promise<Omit<User, 'password'> | null> => {
    const users = getUsers();
    const foundUser = users.find(
      (user) => user.username.toLowerCase() === username.toLowerCase() && user.password === pass
    );

    if (foundUser) {
      const { password, ...userToStore } = foundUser;
      setCurrentUser(userToStore);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
      return userToStore;
    }
    return null;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};