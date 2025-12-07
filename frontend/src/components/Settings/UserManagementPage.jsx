import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, UserPlus, Mail, UserX, Archive, 
  Edit2, Trash2, Search, Filter, RefreshCw
} from 'lucide-react';
import NewUserModal from './NewUserModal';
import InviteUserModal from './InviteUserModal';
import UserCreatedSuccessModal from './UserCreatedSuccessModal';
import apiClient from '../../utils/apiClient';

const UserManagementPage = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdUserData, setCreatedUserData] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all users with different statuses
      const [activeUsers, invitedUsers, inactiveUsers, archivedUsers] = await Promise.all([
        apiClient.getUsers({ status: 'active' }).catch(() => []),
        apiClient.getUsers({ status: 'invited' }).catch(() => []),
        apiClient.getUsers({ status: 'inactive' }).catch(() => []),
        apiClient.getUsers({ status: 'archived' }).catch(() => [])
      ]);

      setUsers({
        active: Array.isArray(activeUsers) ? activeUsers : [],
        invited: Array.isArray(invitedUsers) ? invitedUsers : [],
        inactive: Array.isArray(inactiveUsers) ? inactiveUsers : [],
        archived: Array.isArray(archivedUsers) ? archivedUsers : []
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const data = await apiClient.createUser(userData);
      setCreatedUserData(data);
      setShowNewUserModal(false);
      setShowSuccessModal(true);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.message || 'Kullanıcı oluşturulurken bir hata oluştu');
    }
  };

  const handleInviteUser = async (inviteData) => {
    try {
      // Use buildUrl to get the correct tenant-aware URL
      const url = apiClient.buildUrl('/users/invite', true);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(inviteData)
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setShowInviteModal(false);
        fetchUsers(); // Refresh list
      } else {
        const error = await response.json();
        alert(error.detail || 'Davet gönderilirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`${userName} kullanıcısını arşivlemek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await apiClient.deleteUser(userId);
      alert('Kullanıcı başarıyla arşivlendi');
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Kullanıcı silinirken bir hata oluştu');
    }
  };

  const getTotalUserCount = () => {
    if (!users.active) return 0;
    return users.active.length + (users.invited?.length || 0);
  };

  const filterUsers = (userList) => {
    if (!searchTerm) return userList;
    return userList.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const UserCard = ({ user, showActions = true }) => (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {user.name || 'İsimsiz'}
        </h3>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
        
        <div className="flex gap-2 mt-2">
          {user.position && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {user.position}
            </span>
          )}
          {user.department && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              {user.department}
            </span>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0">
        {user.status === 'active' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Aktif
          </span>
        )}
        {user.status === 'invited' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Davetli
          </span>
        )}
        {user.status === 'inactive' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Pasif
          </span>
        )}
        {user.status === 'archived' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Arşiv
          </span>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => handleDeleteUser(user.id, user.name || user.email)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );

  const EmptyState = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Takım üyelerini davet edin ve kullanıcı yetkilerini yönetin
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Kullanıcı Sayısı</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {getTotalUserCount()} / 1000
                  </div>
                  <div className="text-xs text-gray-500">997 slot kaldı</div>
                </div>
              </div>
              
              <button
                onClick={() => setShowNewUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                Kullanıcı Ekle
              </button>
              
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                <Mail className="h-5 w-5" />
                Davet Gönder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Takım Üyeleri */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Takım Üyeleri</h2>
              <p className="text-sm text-gray-500">Takımınıza yeni üye ekleyin veya davet gönderin</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid gap-3">
            {filterUsers(users.active || []).length > 0 ? (
              filterUsers(users.active).map(user => (
                <UserCard key={user.id} user={user} />
              ))
            ) : (
              <EmptyState
                icon={Users}
                title="Henüz kullanıcı bulunmuyor"
                description="İlk kullanıcıyı davet edin!"
              />
            )}
          </div>
        </div>

        {/* Davet Bekleyen Kullanıcılar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Davet Bekleyen Kullanıcılar</h2>
              <p className="text-sm text-gray-500">Henüz kaydını tamamlamamış kullanıcılar</p>
            </div>
            <span className="text-sm text-orange-600 font-medium">
              {users.invited?.length || 0} bekleyen
            </span>
          </div>

          <div className="grid gap-3">
            {users.invited && users.invited.length > 0 ? (
              users.invited.map(user => (
                <UserCard key={user.id} user={user} showActions={false} />
              ))
            ) : (
              <EmptyState
                icon={Mail}
                title="Bekleyen davet bulunmuyor"
                description="Yeni kullanıcılar davet ettiğinizde burada görünecek"
              />
            )}
          </div>
        </div>

        {/* Pasif Kullanıcılar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pasif Kullanıcılar</h2>
              <p className="text-sm text-gray-500">Hesabı pasif hale getirilmiş kullanıcılar</p>
            </div>
            <span className="text-sm text-gray-600 font-medium">
              {users.inactive?.length || 0} pasif
            </span>
          </div>

          <div className="grid gap-3">
            {users.inactive && users.inactive.length > 0 ? (
              users.inactive.map(user => (
                <UserCard key={user.id} user={user} showActions={false} />
              ))
            ) : (
              <EmptyState
                icon={UserX}
                title="Pasif kullanıcı bulunmuyor"
                description="Tüm kullanıcılar aktif durumda"
              />
            )}
          </div>
        </div>

        {/* Arşiv Kullanıcılar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Arşiv Kullanıcılar</h2>
              <p className="text-sm text-gray-500">İşten ayrılmış kullanıcılar (sadece kayıt amaçlı)</p>
            </div>
            <span className="text-sm text-red-600 font-medium">
              {users.archived?.length || 0} arşivde
            </span>
          </div>

          <div className="grid gap-3">
            {users.archived && users.archived.length > 0 ? (
              users.archived.map(user => (
                <UserCard key={user.id} user={user} showActions={false} />
              ))
            ) : (
              <EmptyState
                icon={Archive}
                title="Arşivlenmiş kullanıcı bulunmuyor"
                description="Pasif kullanıcıları arşivleyerek burada görüntüleyebilirsiniz"
              />
            )}
          </div>
        </div>

        {/* Yakında Geliyor Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 Yakında Geliyor</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Toplu kullanıcı işlemleri</li>
            <li>• Kullanıcı detay görüntüleme</li>
            <li>• Kullanıcı aktivite logları</li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      {showNewUserModal && (
        <NewUserModal
          onClose={() => setShowNewUserModal(false)}
          onCreate={handleCreateUser}
        />
      )}

      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteUser}
        />
      )}

      {showSuccessModal && createdUserData && (
        <UserCreatedSuccessModal
          userData={createdUserData}
          onClose={() => {
            setShowSuccessModal(false);
            setCreatedUserData(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
