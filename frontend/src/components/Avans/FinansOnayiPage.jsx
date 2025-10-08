import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import AvansDetayModal from './AvansDetayModal';
import { 
  Search, 
  Eye,
  Filter,
  Clock,
  DollarSign,
  User
} from 'lucide-react';

export default function FinansOnayiPage({ onBackToDashboard }) {
  const { toast } = useToast();
  const [avanslar, setAvanslar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAvans, setSelectedAvans] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Load advances pending finance approval
  useEffect(() => {
    loadFinansOnayiAvanslar();
  }, []);

  const loadFinansOnayiAvanslar = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/avans/finans-onayi`);
      if (response.ok) {
        const data = await response.json();
        setAvanslar(data);
      } else {
        console.error('Failed to load finance approval advances');
      }
    } catch (error) {
      console.error('Error loading finance approval advances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncele = (avans) => {
    setSelectedAvans(avans);
    setModalOpen(true);
  };

  const handleSaveAvans = async (avansId, formData) => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/avans/${avansId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error('Failed to save avans');
    }

    // Reload the list
    loadFinansOnayiAvanslar();
  };

  const handleApproveAvans = async (avansId) => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/avans/${avansId}/onayla`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to approve avans');
    }

    // Reload the list
    loadFinansOnayiAvanslar();
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAvans(null);
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Filter advances
  const filteredAvanslar = avanslar.filter(avans => 
    avans.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    avans.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    avans.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-500">Finans onayı avansları yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finans Onayı</h1>
          <p className="text-gray-600">Finans onayı bekleyen avanslar</p>
        </div>
        <Button 
          variant="outline" 
          onClick={onBackToDashboard}
        >
          Dashboard'a Dön
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Bekleyen Avanslar</p>
                <p className="text-2xl font-bold text-gray-900">{filteredAvanslar.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Tutar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    filteredAvanslar.reduce((sum, avans) => sum + (avans.amount || 0), 0),
                    'TRY'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Çalışan Sayısı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(filteredAvanslar.map(a => a.employee_name)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtreler ve Arama</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Avans başlığı, çalışan adı veya departman ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advances Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Finans Onayı Bekleyen Avanslar</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAvanslar.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Finans onayı bekleyen avans bulunamadı</p>
              <p className="text-sm text-gray-400">Tüm avanslar onaylanmış görünüyor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">No.</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Başlık</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Çalışan</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Departman</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Tutar</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Tarih</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Durum</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 text-xs">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAvanslar.map((avans, index) => (
                    <tr 
                      key={avans.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-medium text-blue-600 text-sm">{index + 1}</span>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-900 text-sm max-w-[140px] truncate">
                          {avans.title}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-900 text-sm">
                          {avans.employee_name}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="text-gray-700 text-sm">
                          {avans.department || '-'}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900 text-sm">
                          {formatCurrency(avans.amount, avans.currency)}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="text-gray-700 text-sm">
                          {formatDate(avans.created_at)}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <Badge className="bg-orange-100 text-orange-800 border-0 text-[10px] px-2 py-1">
                          Finans Onayı Bekliyor
                        </Badge>
                      </td>
                      
                      <td className="py-3 px-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => handleIncele(avans)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}