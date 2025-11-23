import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';

const NewUserModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    manager_id: '',
    notification_method: 'email'
  });

  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      // Fetch positions
      const posRes = await fetch(`${backendUrl}/api/positions`);
      if (posRes.ok) {
        const posData = await posRes.json();
        setPositions(posData);
      }

      // Fetch departments
      const deptRes = await fetch(`${backendUrl}/api/departments`);
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData);
      }

      // Fetch users for manager selection
      const usersRes = await fetch(`${backendUrl}/api/users?status=active`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert('Lütfen zorunlu alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      await onCreate(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Yeni Kullanıcı Oluştur</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Info Box */}
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">ℹ️ Bilgilendirme</p>
            <p>Sistem otomatik güvenli şifre oluşturacak ve seçtiğiniz yöntemle kullanıcıya gönderecektir.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Ad Soyad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Soyad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Ahmet Yılmaz"
              required
            />
          </div>

          {/* E-posta Adresi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-posta Adresi <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="ahmet@sirket.com"
              required
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon (WhatsApp için - Opsiyonel)
            </label>
            <div className="flex gap-2">
              <select
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="+90">🇹🇷 +90</option>
              </select>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: '+90 ' + e.target.value.replace('+90 ', '') })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="5551234567"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Sadece rakam girin. Örnek: +90 5551234567</p>
          </div>

          {/* Kullanıcı Pozisyonu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kullanıcı Pozisyonu <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
            >
              <option value="">Pozisyon seçin</option>
              {positions.map(pos => (
                <option key={pos.id} value={pos.name}>{pos.name}</option>
              ))}
            </select>
          </div>

          {/* Departman */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departman
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">Departman Yok</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Yönetici */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yönetici
            </label>
            <select
              value={formData.manager_id}
              onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">Yönetici Yok</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          {/* Bilgileri Nasıl Gönderilsin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bilgileri Nasıl Gönderilsin? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="notification_method"
                  value="email"
                  checked={formData.notification_method === 'email'}
                  onChange={(e) => setFormData({ ...formData, notification_method: e.target.value })}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">📧 Email ile gönder</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="notification_method"
                  value="whatsapp"
                  checked={formData.notification_method === 'whatsapp'}
                  onChange={(e) => setFormData({ ...formData, notification_method: e.target.value })}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                  disabled={!formData.phone}
                />
                <span className="text-sm text-gray-700">💬 WhatsApp ile paylaş</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="notification_method"
                  value="both"
                  checked={formData.notification_method === 'both'}
                  onChange={(e) => setFormData({ ...formData, notification_method: e.target.value })}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                  disabled={!formData.phone}
                />
                <span className="text-sm text-gray-700">📧 💬 Her ikisi ile</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Oluşturuluyor...' : '✓ Oluştur ve Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewUserModal;
