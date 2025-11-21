import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { ArrowLeft, Save, Plus, Edit2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import PaymentTermsBuilder from './PaymentTermsBuilder';
import AddFairModal from './AddFairModal';

const CURRENCIES = [
  { value: 'TRY', label: '₺ TRY' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' }
];

export default function NewProjectForm({ onClose, onSave }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fairs, setFairs] = useState([]);
  const [showAddFairModal, setShowAddFairModal] = useState(false);
  const [cityEditable, setCityEditable] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    fairId: '',
    fairStartDate: '',
    fairEndDate: '',
    city: '',
    country: 'TR',
    contractAmount: 0,
    currency: 'TRY',
    paymentTerms: [],
    notes: ''
  });

  useEffect(() => {
    loadFairs();
  }, []);

  const loadFairs = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/projects/fairs/all`);
      if (response.ok) {
        const data = await response.json();
        setFairs(data);
      }
    } catch (error) {
      console.error('Error loading fairs:', error);
    }
  };

  const handleFairChange = (fairId) => {
    const selectedFair = fairs.find(f => f.id === fairId);
    if (selectedFair) {
      setFormData({
        ...formData,
        fairId: fairId,
        fairStartDate: selectedFair.defaultStartDate || '',
        fairEndDate: selectedFair.defaultEndDate || '',
        city: selectedFair.defaultCity || '',
        country: selectedFair.defaultCountry || 'TR'
      });
      setCityEditable(false);
    }
  };

  const handleFairAdded = (newFair) => {
    setFairs([...fairs, newFair]);
    handleFairChange(newFair.id);
    setShowAddFairModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.fairId) {
      toast({
        title: "Eksik Bilgi",
        description: "Proje adı ve fuar seçimi zorunludur",
        variant: "destructive"
      });
      return;
    }

    if (formData.contractAmount <= 0) {
      toast({
        title: "Geçersiz Tutar",
        description: "Sözleşme tutarı 0'dan büyük olmalıdır",
        variant: "destructive"
      });
      return;
    }

    const totalPercentage = formData.paymentTerms.reduce((sum, term) => sum + term.percentage, 0);
    if (formData.paymentTerms.length > 0 && totalPercentage !== 100) {
      toast({
        title: "Ödeme Koşulları Hatası",
        description: "Ödeme koşullarının toplamı %100 olmalıdır",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const selectedFair = fairs.find(f => f.id === formData.fairId);
      
      const projectData = {
        ...formData,
        fairName: selectedFair?.name || '',
        status: 'yeni',
        isNew: true,
        createdFrom: 'manual'
      };

      const response = await fetch(`${backendUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) throw new Error('Proje oluşturulamadı');

      const result = await response.json();
      
      toast({
        title: "Başarılı",
        description: "Proje başarıyla oluşturuldu"
      });

      if (onSave) onSave(result.project);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Hata",
        description: "Proje oluşturulurken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Yeni Proje</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Proje Adı *</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fuar *</label>
              <Select value={formData.fairId} onValueChange={handleFairChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Fuar seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {fairs.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  <div className="border-t mt-2 pt-2">
                    <button type="button" onClick={() => setShowAddFairModal(true)} className="w-full px-2 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center">
                      <Plus className="h-4 w-4 mr-2" />Yeni Fuar Ekle
                    </button>
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Başlangıç *</label>
                <Input type="date" value={formData.fairStartDate} onChange={(e) => setFormData({ ...formData, fairStartDate: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bitiş *</label>
                <Input type="date" value={formData.fairEndDate} onChange={(e) => setFormData({ ...formData, fairEndDate: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Şehir *</label>
                <div className="flex space-x-2">
                  <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} disabled={!cityEditable} required />
                  <Button type="button" variant="outline" size="icon" onClick={() => setCityEditable(!cityEditable)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ülke</label>
                <Input value={formData.country} disabled className="bg-gray-100" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sözleşme Tutarı *</label>
              <div className="flex space-x-2">
                <Input type="number" step="0.01" value={formData.contractAmount} onChange={(e) => setFormData({ ...formData, contractAmount: parseFloat(e.target.value) || 0 })} required className="flex-1" />
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <PaymentTermsBuilder paymentTerms={formData.paymentTerms} onChange={(t) => setFormData({ ...formData, paymentTerms: t })} contractAmount={formData.contractAmount} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <label className="block text-sm font-medium mb-2">Notlar</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-md" />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>İptal</Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />{loading ? 'Oluşturuluyor...' : 'Proje Oluştur'}
          </Button>
        </div>
      </form>

      <AddFairModal isOpen={showAddFairModal} onClose={() => setShowAddFairModal(false)} onFairAdded={handleFairAdded} />
    </div>
  );
}