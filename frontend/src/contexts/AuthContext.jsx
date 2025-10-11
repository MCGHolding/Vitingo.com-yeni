import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

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
    const savedAdminSession = localStorage.getItem('vitingo_admin_session');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // Restore admin session if exists
        if (savedAdminSession) {
          const adminData = JSON.parse(savedAdminSession);
          setOriginalAdminUser(adminData);
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('vitingo_user');
        localStorage.removeItem('vitingo_admin_session');
      }
    } else {
      // TEMPORARY: Auto-login as murb for testing (NO PASSWORD REQUIRED)
      console.log('🔓 TEMPORARY AUTO-LOGIN: Logging in as murb without password');
      const autoLoginUser = {
        id: 1,
        username: 'murb',
        fullName: 'Murat Bucak',
        email: 'murat.bucak@quattrostand.com',
        role: 'super-admin',
        department: 'Süper Admin',
        avatar: null,
        permissions: ['all'],
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      setUser(autoLoginUser);
      localStorage.setItem('vitingo_user', JSON.stringify(autoLoginUser));
    }

    // Save users data to localStorage for other components to use
    const users = [
      {
        id: 1,
        username: 'murb',
        password: 'Murat2024!',
        fullName: 'Murat Bucak',
        email: 'murat.bucak@quattrostand.com',
        role: 'super-admin',
        department: 'Süper Admin',
        avatar: null,
        permissions: ['all']
      },
      {
        id: 2,
        username: 'tame',
        password: 'Tamer2024!',
        fullName: 'Tamer Erdim',
        email: 'tamer.erdim@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 3,
        username: 'batc',
        password: 'Batuhan2024!',
        fullName: 'Batuhan Cücük',
        email: 'batuhan.cucuk@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 4,
        username: 'vatd',
        password: 'Vatan2024!',
        fullName: 'Vatan Dalkılıç',
        email: 'vatan.dalkilic@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 5,
        username: 'biry',
        password: 'Birtan2024!',
        fullName: 'Birtan Yılmaz',
        email: 'birtan.yilmaz@quattrostand.com',
        role: 'admin',
        department: 'Admin',
        avatar: null,
        permissions: ['all']
      },
      {
        id: 6,
        username: 'beyn',
        password: 'Beyza2024!',
        fullName: 'Beyza Nur',
        email: 'beyza.nur@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 7,
        username: 'niyk',
        password: 'Niyazi2024!',
        fullName: 'Niyazi Karahan',
        email: 'niyazi.karahan@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 8,
        username: 'sukb',
        password: 'Sukran2024!',
        fullName: 'Şükran Bucak',
        email: 'sukran.bucak@quattrostand.com',
        role: 'user',
        department: 'Muhasebe',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 9,
        username: 'icla',
        password: 'Iclal2024!',
        fullName: 'İclal Aksu',
        email: 'iclal.aksu@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 10,
        username: 'meha',
        password: 'Mehmet2024!',
        fullName: 'Mehmet Ağdaş',
        email: 'info@noktafuar.com',
        role: 'user',
        department: 'Üretim Müdürü',
        avatar: null,
        permissions: ['read_own', 'write_own']
      }
    ];
    localStorage.setItem('vitingo_users', JSON.stringify(users));
    
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const { username, password, rememberMe } = credentials;

    // Real users database - Quattro Stand employees
    const users = [
      {
        id: 1,
        username: 'murb',
        password: 'Murat2024!',
        fullName: 'Murat Bucak',
        email: 'murat.bucak@quattrostand.com',
        role: 'super-admin',
        department: 'Süper Admin',
        avatar: null,
        permissions: ['all']
      },
      {
        id: 2,
        username: 'tame',
        password: 'Tamer2024!',
        fullName: 'Tamer Erdim',
        email: 'tamer.erdim@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 3,
        username: 'batc',
        password: 'Batuhan2024!',
        fullName: 'Batuhan Cücük',
        email: 'batuhan.cucuk@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 4,
        username: 'vatd',
        password: 'Vatan2024!',
        fullName: 'Vatan Dalkılıç',
        email: 'vatan.dalkilic@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 5,
        username: 'biry',
        password: 'Birtan2024!',
        fullName: 'Birtan Yılmaz',
        email: 'birtan.yilmaz@quattrostand.com',
        role: 'admin',
        department: 'Admin',
        avatar: null,
        permissions: ['all']
      },
      {
        id: 6,
        username: 'beyn',
        password: 'Beyza2024!',
        fullName: 'Beyza Nur',
        email: 'beyza.nur@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 7,
        username: 'niyk',
        password: 'Niyazi2024!',
        fullName: 'Niyazi Karahan',
        email: 'niyazi.karahan@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 8,
        username: 'sukb',
        password: 'Sukran2024!',
        fullName: 'Şükran Bucak',
        email: 'sukran.bucak@quattrostand.com',
        role: 'user',
        department: 'Muhasebe',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 9,
        username: 'icla',
        password: 'Iclal2024!',
        fullName: 'İclal Aksu',
        email: 'iclal.aksu@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 10,
        username: 'meha',
        password: 'Mehmet2024!',
        fullName: 'Mehmet Ağdaş',
        email: 'info@noktafuar.com',
        role: 'user',
        department: 'Üretim Müdürü',
        avatar: null,
        permissions: ['read_own', 'write_own']
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user (password check temporarily disabled for testing)
    const foundUser = users.find(u => u.username === username);
    
    if (!foundUser) {
      throw new Error('Kullanıcı adı bulunamadı');
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
      'super-admin': 'Süper Admin',
      'admin': 'Admin',
      'user': 'Kullanıcı'
    };
    return roles[role] || role;
  };

  // Admin-only: Switch to another user without password
  const switchUser = async (targetUserId) => {
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
      throw new Error('Bu işlem sadece admin kullanıcıları tarafından yapılabilir');
    }

    // Get all users - same as login function
    const users = [
      {
        id: 1,
        username: 'murb',
        password: 'Murat2024!',
        fullName: 'Murat Bucak',
        email: 'murat.bucak@quattrostand.com',
        role: 'super-admin',
        department: 'Süper Admin',
        avatar: null,
        permissions: ['all']
      },
      {
        id: 2,
        username: 'tame',
        password: 'Tamer2024!',
        fullName: 'Tamer Erdim',
        email: 'tamer.erdim@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 3,
        username: 'batc',
        password: 'Batuhan2024!',
        fullName: 'Batuhan Cücük',
        email: 'batuhan.cucuk@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 4,
        username: 'vatd',
        password: 'Vatan2024!',
        fullName: 'Vatan Dalkılıç',
        email: 'vatan.dalkilic@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 5,
        username: 'biry',
        password: 'Birtan2024!',
        fullName: 'Birtan Yılmaz',
        email: 'birtan.yilmaz@quattrostand.com',
        role: 'admin',
        department: 'Admin',
        avatar: null,
        permissions: ['all']
      },
      {
        id: 6,
        username: 'beyn',
        password: 'Beyza2024!',
        fullName: 'Beyza Nur',
        email: 'beyza.nur@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 7,
        username: 'niyk',
        password: 'Niyazi2024!',
        fullName: 'Niyazi Karahan',
        email: 'niyazi.karahan@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 8,
        username: 'sukb',
        password: 'Sukran2024!',
        fullName: 'Şükran Bucak',
        email: 'sukran.bucak@quattrostand.com',
        role: 'user',
        department: 'Muhasebe',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 9,
        username: 'icla',
        password: 'Iclal2024!',
        fullName: 'İclal Aksu',
        email: 'iclal.aksu@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null,
        permissions: ['read_own', 'write_own']
      },
      {
        id: 10,
        username: 'meha',
        password: 'Mehmet2024!',
        fullName: 'Mehmet Ağdaş',
        email: 'info@noktafuar.com',
        role: 'user',
        department: 'Üretim Müdürü',
        avatar: null,
        permissions: ['read_own', 'write_own']
      }
    ];

    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Save original admin session if not already saved
    if (!originalAdminUser) {
      setOriginalAdminUser(user);
      localStorage.setItem('vitingo_admin_session', JSON.stringify(user));
    }

    // Remove password from target user object
    const { password: _, ...userWithoutPassword } = targetUser;
    const loginTime = new Date().toISOString();
    
    const userData = {
      ...userWithoutPassword,
      loginTime,
      lastActivity: loginTime,
      impersonatedBy: originalAdminUser?.id || user.id // Track who is impersonating
    };

    setUser(userData);
    
    // Update localStorage
    localStorage.setItem('vitingo_user', JSON.stringify(userData));

    return userData;
  };

  // Admin-only: Return to original admin account
  const returnToAdmin = () => {
    if (!originalAdminUser) {
      throw new Error('Orijinal admin oturumu bulunamadı');
    }

    const updatedAdminUser = {
      ...originalAdminUser,
      lastActivity: new Date().toISOString()
    };

    setUser(updatedAdminUser);
    setOriginalAdminUser(null);
    
    localStorage.setItem('vitingo_user', JSON.stringify(updatedAdminUser));
    localStorage.removeItem('vitingo_admin_session');
  };

  // Get available users for admin to switch to
  const getAvailableUsers = () => {
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) return [];
    
    const users = [
      {
        id: 2,
        username: 'tame',
        fullName: 'Tamer Erdim',
        email: 'tamer.erdim@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null
      },
      {
        id: 3,
        username: 'batc',
        fullName: 'Batuhan Cücük',
        email: 'batuhan.cucuk@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null
      },
      {
        id: 4,
        username: 'vatd',
        fullName: 'Vatan Dalkılıç',
        email: 'vatan.dalkilic@quattrostand.com',
        role: 'user',
        department: 'Müşteri Temsilcisi',
        avatar: null
      },
      {
        id: 5,
        username: 'biry',
        fullName: 'Birtan Yılmaz',
        email: 'birtan.yilmaz@quattrostand.com',
        role: 'admin',
        department: 'Admin',
        avatar: null
      },
      {
        id: 6,
        username: 'beyn',
        fullName: 'Beyza Nur',
        email: 'beyza.nur@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null
      },
      {
        id: 7,
        username: 'niyk',
        fullName: 'Niyazi Karahan',
        email: 'niyazi.karahan@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null
      },
      {
        id: 8,
        username: 'sukb',
        fullName: 'Şükran Bucak',
        email: 'sukran.bucak@quattrostand.com',
        role: 'user',
        department: 'Muhasebe',
        avatar: null
      },
      {
        id: 9,
        username: 'icla',
        fullName: 'İclal Aksu',
        email: 'iclal.aksu@quattrostand.com',
        role: 'user',
        department: 'Tasarım',
        avatar: null
      },
      {
        id: 10,
        username: 'meha',
        fullName: 'Mehmet Ağdaş',
        email: 'info@noktafuar.com',
        role: 'user',
        department: 'Üretim Müdürü',
        avatar: null
      }
    ];

    return users.filter(u => u.id !== user.id);
  };

  // Check if user is impersonating
  const isImpersonating = () => {
    return !!(user && user.impersonatedBy) || !!originalAdminUser;
  };

  const value = {
    user,
    originalAdminUser,
    login,
    logout,
    loading,
    isAuthenticated,
    hasPermission,
    getRoleName,
    updateLastActivity,
    switchUser,
    returnToAdmin,
    getAvailableUsers,
    isImpersonating
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};