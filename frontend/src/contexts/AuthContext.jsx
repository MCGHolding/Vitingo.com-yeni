import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [originalAdminUser, setOriginalAdminUser] = useState(null); // For admin impersonation
  const [loading, setLoading] = useState(true);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('vitingo_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('vitingo_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const { username, password, rememberMe } = credentials;

    // Mock users database
    const users = [
      {
        id: 1,
        username: 'admin',
        password: 'admin123',
        fullName: 'Sistem Yöneticisi',
        email: 'admin@vitingo.com',
        role: 'admin',
        department: 'IT',
        avatar: null,
        permissions: ['all']
      },
      {
        id: 2,
        username: 'satis1',
        password: 'satis123',
        fullName: 'Ahmet Yılmaz',
        email: 'ahmet@vitingo.com',
        role: 'sales_rep',
        department: 'Satış',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 3,
        username: 'mudur1',
        password: 'mudur123',
        fullName: 'Fatma Demir',
        email: 'fatma@vitingo.com',
        role: 'sales_manager',
        department: 'Satış',
        avatar: null,
        permissions: ['read_team', 'write_team', 'reports']
      },
      {
        id: 4,
        username: 'satis2',
        password: 'satis123',
        fullName: 'Mehmet Kaya',
        email: 'mehmet@vitingo.com',
        role: 'sales_rep',
        department: 'Satış',
        avatar: null,
        permissions: ['read_own', 'write_own']
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (!foundUser) {
      throw new Error('Kullanıcı adı veya şifre hatalı');
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = foundUser;
    const loginTime = new Date().toISOString();
    
    const userData = {
      ...userWithoutPassword,
      loginTime,
      lastActivity: loginTime
    };

    setUser(userData);

    // Save to localStorage if remember me is checked
    if (rememberMe) {
      localStorage.setItem('vitingo_user', JSON.stringify(userData));
    }

    return userData;
  };

  const logout = () => {
    setUser(null);
    setOriginalAdminUser(null);
    localStorage.removeItem('vitingo_user');
    localStorage.removeItem('vitingo_admin_session');
  };

  const updateLastActivity = () => {
    if (user) {
      const updatedUser = {
        ...user,
        lastActivity: new Date().toISOString()
      };
      setUser(updatedUser);
      
      // Update localStorage if exists
      const savedUser = localStorage.getItem('vitingo_user');
      if (savedUser) {
        localStorage.setItem('vitingo_user', JSON.stringify(updatedUser));
      }
    }
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  const getRoleName = (role) => {
    const roles = {
      admin: 'Sistem Yöneticisi',
      sales_manager: 'Satış Müdürü',
      sales_rep: 'Satış Temsilcisi'
    };
    return roles[role] || role;
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated,
    hasPermission,
    getRoleName,
    updateLastActivity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};