import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { 
  X,
  Save,
  CheckCircle,
  User,
  DollarSign,
  Calendar,
  FileText,
  Building
} from 'lucide-react';

export default function AvansDetayModal({ avans, isOpen, onClose, onSave, onApprove }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: avans?.title || '',
    description: avans?.description || '',
    amount: avans?.amount || 0,
    currency: avans?.currency || 'TRY',
    employee_name: avans?.employee_name || '',
    employee_id: avans?.employee_id || '',
    department: avans?.department || '',
    project_name: avans?.project_name || '',
    reason: avans?.reason || '',
    notes: avans?.notes || ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(avans.id, formData);
      toast({
        title: "Başarılı",
        description: "Avans bilgileri kaydedildi",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kaydetme sırasında hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await onApprove(avans.id);
      toast({
        title: "Başarılı",
        description: "Avans onaylandı ve kapanmış avanslara taşındı",
        variant: "default"
      });
      onClose();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Onaylama sırasında hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !avans) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Avans Detayı</h2>
            <p className="text-sm text-gray-600">Avans bilgilerini inceleyin ve düzenleyin</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Avans Tutarı</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(avans.amount, avans.currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Oluşturma Tarihi</p>
                    <p className="font-semibold text-gray-900 text-sm">{formatDate(avans.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Durum</p>
                    <Badge className={`${
                      avans.finance_approved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    } border-0 text-xs`}>
                      {avans.finance_approved ? 'Onaylandı' : 'Finans Onayı Bekliyor'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avans Başlığı *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Avans başlığını girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Çalışan Adı *
                </label>
                <Input
                  value={formData.employee_name}
                  onChange={(e) => handleInputChange('employee_name', e.target.value)}
                  placeholder="Çalışan adını girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Çalışan ID
                </label>
                <Input
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  placeholder="Çalışan ID'sini girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departman
                </label>
                <Input
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Departman adını girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proje Adı
                </label>
                <Input
                  value={formData.project_name}
                  onChange={(e) => handleInputChange('project_name', e.target.value)}
                  placeholder="İlgili proje adını girin"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar *
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <select 
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avans Sebebi *
                </label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="Avans talebinin sebebini açıklayın"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Ek açıklama ekleyin"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Dahili notlar ekleyin"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={loading || !formData.title || !formData.employee_name || !formData.reason}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            
            {!avans.finance_approved && (
              <Button
                onClick={handleApprove}
                disabled={loading || !formData.title || !formData.employee_name || !formData.reason}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {loading ? 'Onaylanıyor...' : 'Onayla'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}