import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Plus, 
  Download, 
  Eye, 
  Trash2, 
  Filter,
  Grid,
  List as ListIcon,
  Search,
  CheckCircle,
  Edit,
  CheckSquare,
  XCircle,
  TrendingUp,
  FileText,
  Users,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ContractsPage = ({ setCurrentView }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', 'week', 'month', 'year'
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    completed: 0
  });
  const [chartData, setChartData] = useState([]);
  const [showGraphs, setShowGraphs] = useState(true);

  // Fetch contracts
  useEffect(() => {
    fetchContracts();
  }, []);

  // Calculate monthly data for chart
  const calculateMonthlyData = (contracts) => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const currentDate = new Date();
    const last6Months = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      const year = date.getFullYear();
      
      const monthContracts = contracts.filter(c => {
        const contractDate = new Date(c.created_at);
        return contractDate.getMonth() === date.getMonth() && 
               contractDate.getFullYear() === date.getFullYear();
      });
      
      last6Months.push({
        ay: `${monthName.substring(0, 3)} '${year.toString().substring(2)}`,
        aktif: monthContracts.filter(c => c.status === 'active').length,
        taslak: monthContracts.filter(c => c.status === 'draft').length,
        tamamlandi: monthContracts.filter(c => c.status === 'completed').length,
        toplam: monthContracts.length
      });
    }
    
    return last6Months;
  };

  // Filter by date range
  const filterByDateRange = (contract) => {
    if (dateRange === 'all') return true;
    
    const contractDate = new Date(contract.created_at);
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        return contractDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return contractDate >= weekAgo;
      case 'month':
        return contractDate.getMonth() === now.getMonth() && 
               contractDate.getFullYear() === now.getFullYear();
      case 'year':
        return contractDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  const fetchContracts = async () => {
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      // TODO: Get user email from auth context
      const userEmail = 'mbucak@gmail.com';

      const response = await fetch(`${backendUrl}/api/contracts?user_email=${userEmail}`);
      
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
        
        // Calculate stats
        const stats = {
          total: data.contracts.length,
          active: data.contracts.filter(c => c.status === 'active').length,
          draft: data.contracts.filter(c => c.status === 'draft').length,
          completed: data.contracts.filter(c => c.status === 'completed').length
        };
        setStats(stats);
        
        // Calculate chart data - Monthly trend for last 6 months
        const monthlyData = calculateMonthlyData(data.contracts);
        setChartData(monthlyData);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contractId) => {
    if (!confirm('Bu sözleşmeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/contracts/${contractId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setContracts(contracts.filter(c => c.id !== contractId));
        alert('✅ Sözleşme silindi!');
        fetchContracts(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Hata oluştu');
    }
  };

  const handleDownload = async (contractId, title) => {
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/contracts/${contractId}/pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('İndirme hatası');
    }
  };

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesStatus = filterStatus === 'all' || contract.status === filterStatus;
    const matchesSearch = contract.contract_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.template_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Aktif' },
      draft: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Edit, label: 'Taslak' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckSquare, label: 'Tamamlandı' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'İptal' }
    };
    const badge = badges[status] || badges.active;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sözleşmeler</h1>
            <p className="text-sm text-gray-600 mt-1">Tüm sözleşmelerinizi görüntüleyin ve yönetin</p>
          </div>
          
          <button
            onClick={() => window.location.href = '/contracts/new'}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Sözleşme
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Toplam</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileCheck className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Aktif</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Taslak</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
              </div>
              <Edit className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tamamlandı</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters and View Mode */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sözleşme ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="draft">Taslak</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Grid/List */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <FileCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz sözleşme yok</h3>
          <p className="text-gray-600 mb-4">İlk sözleşmenizi oluşturun</p>
          <button
            onClick={() => window.location.href = '/contracts/new'}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Sözleşme
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((contract) => (
            <div key={contract.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{contract.contract_title}</h3>
                  <p className="text-xs text-gray-600 mb-2">{contract.template_name}</p>
                  {getStatusBadge(contract.status)}
                </div>
              </div>
              
              <div className="space-y-2 mb-3 text-xs text-gray-600">
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1.5" />
                  <span>{contract.created_by}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1.5" />
                  <span>{new Date(contract.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleDownload(contract.id, contract.contract_title)}
                  className="flex-1 flex items-center justify-center px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 text-xs font-medium"
                >
                  <Download className="h-3 w-3 mr-1" />
                  İndir
                </button>
                <button
                  onClick={() => handleDelete(contract.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Şablon</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oluşturan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{contract.contract_title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{contract.template_name}</td>
                  <td className="px-4 py-3">{getStatusBadge(contract.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{contract.created_by}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(contract.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(contract.id, contract.contract_title)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="İndir"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contract.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContractsPage;
