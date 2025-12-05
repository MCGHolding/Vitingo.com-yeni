import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Save, Plus, Edit2, FolderKanban, Calendar, DollarSign, FileText } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import PaymentTermsBuilder from './PaymentTermsBuilder';
import AddFairModal from './AddFairModal';
import SearchableSelect from '../ui/SearchableSelect';

const CURRENCIES = [
  { value: 'TRY', label: '₺ TRY' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' }
];

export default function NewProjectForm({ onClose, onSave }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fairs, setFairs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [groupCompanies, setGroupCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddFairModal, setShowAddFairModal] = useState(false);
  const [cityEditable, setCityEditable] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Payment profile states
  const [paymentProfiles, setPaymentProfiles] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    paymentTerms: []
  });

  const [formData, setFormData] = useState({
    name: '',
    companyId: undefined,
    companyName: '',
    customerId: '',
    customerName: '',
    fairId: '',
    fairStartDate: '',
    fairEndDate: '',
    installationStartDate: '',
    installationEndDate: '',
    advanceWarehouseStartDate: '',
    advanceWarehouseEndDate: '',
    city: '',
    country: 'TR',
    contractDate: '',
    contractAmount: 0,
    currency: 'TRY',
    paymentTerms: [],
    notes: '',
    isAmericanFair: false,
    // Stand details
    standWidth: '',
    standWidthUnit: 'mt',
    standLength: '',
    standLengthUnit: 'mt',
    standHeight: '',
    standHeightUnit: 'mt',
    // Financial items (invoice items)
    financialItems: [
      { id: 1, description: '', quantity: 1, unit: 'adet', unitPrice: 0, total: 0, productId: '' }
    ]
  });
  
  // Calculate total from financial items
  const calculateTotalFromItems = () => {
    const items = formData.financialItems || [];
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  useEffect(() => {
    loadFairs();
    loadCustomers();
    loadPaymentProfiles();
    loadGroupCompanies();
    loadProducts();
  }, []);

  const loadPaymentProfiles = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/payment-profiles`);
      if (response.ok) {
        const data = await response.json();
        setPaymentProfiles(data);
      }
    } catch (error) {
      console.error('Error loading payment profiles:', error);
    }
  };

  const loadGroupCompanies = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/group-companies`);
      if (response.ok) {
        const data = await response.json();
        // Backend returns array directly, not { companies: [] }
        let companies = Array.isArray(data) ? data : [];
        
        console.log('Loaded group companies:', companies);
        
        // If no group companies, add default company or user name
        if (companies.length === 0) {
          // Check if user has a default company from registration
          if (user?.companyName) {
            companies.push({
              id: 'default',
              name: user.companyName
            });
          } else if (user?.name) {
            // Individual user - use their name
            companies.push({
              id: 'individual',
              name: user.name
            });
          }
        }
        
        setGroupCompanies(companies);
        
        // Don't auto-select company - user should choose
        // Keep companyId and companyName empty by default
      }
    } catch (error) {
      console.error('Error loading group companies:', error);
      // Fallback to user info if API fails
      if (user?.companyName) {
        setGroupCompanies([{ id: 'default', name: user.companyName }]);
      } else if (user?.name) {
        setGroupCompanies([{ id: 'individual', name: user.name }]);
      }
      // Don't auto-select - let user choose
    }
  };

  const loadProducts = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

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

  const loadCustomers = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        // Filter only active customers (not prospects, not passive)
        const activeCustomers = data.filter(c => !c.isProspect && c.status !== 'passive');
        setCustomers(activeCustomers);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
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

  const fillTestData = () => {
    // Select random customer
    if (customers.length > 0) {
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      
      // Select random fair
      if (fairs.length > 0) {
        const randomFair = fairs[Math.floor(Math.random() * fairs.length)];
        
        // Generate random project name
        const projectNames = [
          'Premium Stand Tasarımı',
          'Modüler Fuar Standı',
          'Özel Tasarım Projesi',
          'VIP Lounge Standı',
          'İnteraktif Stand Projesi'
        ];
        const randomName = projectNames[Math.floor(Math.random() * projectNames.length)];
        
        // Generate random amount between 25000-150000
        const randomAmount = Math.floor(Math.random() * (150000 - 25000) + 25000);
        
        // Random currency
        const currencies = ['TRY', 'USD', 'EUR'];
        const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
        
        setFormData({
          name: `${randomCustomer.companyName} - ${randomName}`,
          customerId: randomCustomer.id,
          customerName: randomCustomer.companyName,
          fairId: randomFair.id,
          fairName: randomFair.name,
          fairStartDate: randomFair.defaultStartDate || randomFair.startDate,
          fairEndDate: randomFair.defaultEndDate || randomFair.endDate,
          city: randomFair.defaultCity || randomFair.city,
          country: randomFair.defaultCountry || randomFair.country,
          contractAmount: randomAmount,
          currency: randomCurrency,
          paymentTerms: [],
          notes: 'Test verisi ile otomatik oluşturuldu',
          status: 'yeni',
          isNew: true,
          createdFrom: 'manual'
        });
        
        toast({
          title: "Test verisi dolduruldu",
          description: "Form rastgele test verileriyle dolduruldu"
        });
      }
    }
  };

  const savePaymentProfile = async () => {
    console.log('savePaymentProfile called', profileFormData);
    
    if (!profileFormData.name || profileFormData.paymentTerms.length === 0) {
      toast({
        title: "Eksik Bilgi",
        description: "Profil adı ve en az bir ödeme koşulu gerekli",
        variant: "destructive"
      });
      return;
    }

    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      console.log('Sending to:', `${backendUrl}/api/payment-profiles`);
      console.log('Data:', profileFormData);

      const response = await fetch(`${backendUrl}/api/payment-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileFormData)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);
        toast({
          title: "Başarılı",
          description: "Ödeme profili kaydedildi"
        });
        setShowProfileModal(false);
        setProfileFormData({ name: '', paymentTerms: [] });
        loadPaymentProfiles();
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast({
          title: "Hata",
          description: errorData.detail || "Profil kaydedilemedi",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Hata",
        description: "Profil kaydedilemedi: " + error.message,
        variant: "destructive"
      });
    }
  };

  // Financial Items Management
  const addFinancialItem = () => {
    const items = formData.financialItems || [];
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id), 0) + 1 : 1;
    setFormData({
      ...formData,
      financialItems: [...items, { id: newId, description: '', quantity: 1, unit: 'adet', unitPrice: 0, total: 0, productId: '' }]
    });
  };
  
  const removeFinancialItem = (id) => {
    const items = formData.financialItems || [];
    if (items.length === 1) return; // At least one item
    setFormData({
      ...formData,
      financialItems: items.filter(item => item.id !== id)
    });
  };
  
  const updateFinancialItem = (id, field, value) => {
    const items = formData.financialItems || [];
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Calculate total
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = (updated.quantity || 0) * (updated.unitPrice || 0);
        }
        return updated;
      }
      return item;
    });
    setFormData({ ...formData, financialItems: updatedItems });
  };
  
  const handleProductSelect = (itemId, productId) => {
    const selectedProduct = (products || []).find(p => p.id === productId);
    if (!selectedProduct) return;
    
    const items = formData.financialItems || [];
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const quantity = item.quantity || 1;
        const unitPrice = selectedProduct.default_price || 0;
        return {
          ...item,
          productId: productId,
          description: selectedProduct.name,
          unit: selectedProduct.unit || 'adet',
          unitPrice: unitPrice,
          total: quantity * unitPrice
        };
      }
      return item;
    });
    
    setFormData({ ...formData, financialItems: updatedItems });
  };

  const applyPaymentProfile = (profileId) => {
    const profile = paymentProfiles.find(p => p.id === profileId);
    if (profile && profile.paymentTerms) {
      // Calculate amounts based on contract amount
      const termsWithAmounts = profile.paymentTerms.map(term => ({
        ...term,
        amount: (formData.contractAmount * term.percentage) / 100
      }));
      
      setFormData({
        ...formData,
        paymentTerms: termsWithAmounts
      });
      
      toast({
        title: "Profil Uygulandı",
        description: `"${profile.name}" profili ödeme planına uygulandı`
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.customerId || !formData.fairId) {
      toast({
        title: "Eksik Bilgi",
        description: "Proje adı, müşteri ve fuar seçimi zorunludur",
        variant: "destructive"
      });
      return;
    }

    // Calculate total from items
    const calculatedTotal = calculateTotalFromItems();
    
    if (calculatedTotal <= 0) {
      toast({
        title: "Geçersiz Tutar",
        description: "Lütfen en az bir fatura kalemi ekleyin ve tutar giriniz",
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
        contractAmount: calculatedTotal, // Use calculated total from items
        fairName: selectedFair?.name || '',
        status: 'yeni',
        isNew: true,
        createdFrom: 'manual',
        createdBy: user?.username || '',
        createdByName: user?.name || user?.username || ''
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header - Same style as NewCustomerForm */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FolderKanban className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yeni Proje</h1>
            <p className="text-gray-600">Proje bilgilerini girin ve ödeme koşullarını belirleyin</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={fillTestData} 
            className="flex items-center space-x-2 text-green-600 border-green-300 hover:bg-green-50"
            type="button"
          >
            <FileText className="h-4 w-4" />
            <span>Test Verisi Doldur</span>
          </Button>
          <Button variant="outline" onClick={onClose} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Geri Dön</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Proje Bilgileri - Card format like NewCustomerForm */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Proje Bilgileri</span>
              </CardTitle>
              {/* Amerika Fuarları Checkbox */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAmericanFair}
                  onChange={(e) => setFormData({ ...formData, isAmericanFair: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Amerika Fuarları</span>
              </label>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Name and Company Selection - Same Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proje Adı <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const input = e.target.value;
                    // Convert to title case: first letter of each word uppercase, rest lowercase
                    const titleCase = input
                      .toLowerCase()
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    setFormData({ ...formData, name: titleCase });
                  }}
                  placeholder="Örn: ABC Şirketi - ISK-SODEX 2025"
                  required
                />
              </div>

              {/* Company Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şirketi Seç <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.companyId}
                  onValueChange={(value) => {
                    const selectedCompany = groupCompanies.find(c => c.id === value);
                    setFormData({
                      ...formData,
                      companyId: value,
                      companyName: selectedCompany?.name || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Şirket seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer and Fair Selection - Same Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={formData.customerId} 
                  onValueChange={(customerId) => {
                    const selectedCustomer = customers.find(c => c.id === customerId);
                    setFormData({ 
                      ...formData, 
                      customerId: customerId,
                      customerName: selectedCustomer?.companyName || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Henüz müşteri eklenmemiş.
                  </p>
                )}
              </div>

              {/* Fair Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuar Adı <span className="text-red-500">*</span>
                </label>
                <Select value={formData.fairId} onValueChange={handleFairChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fuar seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fairs.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                    <div className="border-t mt-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddFairModal(true)}
                        className="w-full px-2 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Fuar Ekle
                      </button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Customer Information Display */}
            {formData.customerId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Seçilen Müşteri Bilgileri</h4>
                {(() => {
                  const selectedCustomer = customers.find(c => c.id === formData.customerId);
                  if (!selectedCustomer) return null;
                  
                  return (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Şirket Adı:</span>
                        <span className="ml-2 font-medium">{selectedCustomer.companyName}</span>
                      </div>
                      {selectedCustomer.contactPerson && (
                        <div>
                          <span className="text-gray-600">İletişim Kişisi:</span>
                          <span className="ml-2 font-medium">{selectedCustomer.contactPerson}</span>
                        </div>
                      )}
                      {selectedCustomer.email && (
                        <div>
                          <span className="text-gray-600">E-posta:</span>
                          <span className="ml-2 font-medium">{selectedCustomer.email}</span>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div>
                          <span className="text-gray-600">Telefon:</span>
                          <span className="ml-2 font-medium">{selectedCustomer.phone}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Fair Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuar Başlangıç <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.fairStartDate}
                  onChange={(e) => setFormData({ ...formData, fairStartDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuar Bitiş <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.fairEndDate}
                  onChange={(e) => setFormData({ ...formData, fairEndDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Advance Warehouse Tarihleri - Only for American Fairs */}
            {formData.isAmericanFair && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Warehouse Başlama
                  </label>
                  <Input
                    type="date"
                    value={formData.advanceWarehouseStartDate}
                    onChange={(e) => setFormData({ ...formData, advanceWarehouseStartDate: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Depo başlangıç tarihi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Warehouse Bitiş
                  </label>
                  <Input
                    type="date"
                    value={formData.advanceWarehouseEndDate}
                    onChange={(e) => setFormData({ ...formData, advanceWarehouseEndDate: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Depo bitiş tarihi</p>
                </div>
              </div>
            )}

            {/* Kurulum Tarihleri */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kurulum Başlangıç
                </label>
                <Input
                  type="date"
                  value={formData.installationStartDate}
                  onChange={(e) => setFormData({ ...formData, installationStartDate: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Kurulum ilk günü</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kurulum Bitiş
                </label>
                <Input
                  type="date"
                  value={formData.installationEndDate}
                  onChange={(e) => setFormData({ ...formData, installationEndDate: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Kurulum son günü</p>
              </div>
            </div>

            {/* Sözleşme Tarihi - Moved here from Contract section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sözleşme Tarihi <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.contractDate}
                  onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Peşin ve özel vade hesaplamalarında kullanılır</p>
              </div>
              <div></div>
            </div>

            {/* City and Country */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şehir <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Şehir"
                    disabled={!cityEditable}
                    required
                    className={!cityEditable ? 'bg-gray-100' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setCityEditable(!cityEditable)}
                    title={cityEditable ? "Kilitle" : "Düzenle"}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {cityEditable ? "Şehir değiştirilebilir" : "Fuar'dan otomatik geldi"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ülke
                </label>
                <Input
                  value={formData.country}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Fuar'dan otomatik geldi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finansal Bilgiler (Fatura Kalemleri) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Finansal Bilgiler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Para Birimi Seçimi */}
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Para Birimi <span className="text-red-500">*</span>
              </label>
              <Select 
                value={formData.currency} 
                onValueChange={(v) => setFormData({ ...formData, currency: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fatura Kalemleri Tablosu */}
            <div className="overflow-visible">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700 w-16">Sıra No</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Ürün ve Hizmet Adı</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 w-24">Miktar</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 w-24">Birim</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 w-32">Birim Fiyat</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 w-32">Tutar</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 w-16">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.financialItems || []).map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <SearchableSelect
                          options={(products || []).map(product => ({
                            id: product.id,
                            label: product.name,
                            sublabel: `${product.default_price ? product.default_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ' + product.currency : ''} / ${product.unit}`.trim(),
                            data: product
                          }))}
                          value={item.productId || ''}
                          onChange={(productId) => handleProductSelect(item.id, productId)}
                          placeholder="Ürün/Hizmet seçin..."
                          searchPlaceholder="Ürün ara..."
                          className="min-w-[300px]"
                          emptyMessage="Ürün bulunamadı"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="text"
                          value={item.quantity || ''}
                          onChange={(e) => updateFinancialItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={item.unit || 'adet'}
                          onChange={(e) => updateFinancialItem(item.id, 'unit', e.target.value)}
                          className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="adet">Adet</option>
                          <option value="kg">Kg</option>
                          <option value="m2">M²</option>
                          <option value="m3">M³</option>
                          <option value="lt">Litre</option>
                          <option value="saat">Saat</option>
                          <option value="gün">Gün</option>
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="text"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateFinancialItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="w-full"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="bg-gray-50 px-3 py-2 rounded font-medium">
                          {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : formData.currency === 'AED' ? 'د.إ' : '₺'}
                          {item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            onClick={addFinancialItem}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Yeni satır ekle"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          {formData.financialItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFinancialItem(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Satırı sil"
                            >
                              <span className="text-lg">×</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Display */}
            <div className="flex justify-end">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-[300px]">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Toplam Sözleşme Tutarı:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {calculateTotalFromItems().toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {formData.currency}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Bu tutar ödeme koşullarında kullanılacaktır</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Ödeme Koşulları</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {/* Profile Selection */}
                {paymentProfiles.length > 0 && (
                  <Select onValueChange={applyPaymentProfile}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Profil Seç" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentProfiles.map(profile => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {/* Create Profile Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center space-x-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Profil Oluştur</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PaymentTermsBuilder 
              paymentTerms={formData.paymentTerms} 
              onChange={(t) => setFormData({ ...formData, paymentTerms: t })} 
              contractAmount={calculateTotalFromItems()}
              contractDate={formData.contractDate}
              fairStartDate={formData.fairStartDate}
              installationStartDate={formData.installationStartDate}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Notlar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Proje hakkında notlar..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </CardContent>
        </Card>

        {/* Stand Details Section (collapsible) */}
        {showDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Stand Detayları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Stand Width */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stand Eni
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.standWidth}
                      onChange={(e) => setFormData({ ...formData, standWidth: e.target.value })}
                      placeholder="Eni"
                      className="flex-1"
                    />
                    <Select
                      value={formData.standWidthUnit}
                      onValueChange={(value) => setFormData({ ...formData, standWidthUnit: value })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="mt">mt</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Stand Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stand Boyu
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.standLength}
                      onChange={(e) => setFormData({ ...formData, standLength: e.target.value })}
                      placeholder="Boyu"
                      className="flex-1"
                    />
                    <Select
                      value={formData.standLengthUnit}
                      onValueChange={(value) => setFormData({ ...formData, standLengthUnit: value })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="mt">mt</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Stand Height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stand Yüksekliği
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.standHeight}
                      onChange={(e) => setFormData({ ...formData, standHeight: e.target.value })}
                      placeholder="Yükseklik"
                      className="flex-1"
                    />
                    <Select
                      value={formData.standHeightUnit}
                      onValueChange={(value) => setFormData({ ...formData, standHeightUnit: value })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="mt">mt</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
          >
            İptal
          </Button>
          
          <div className="flex space-x-3">
            <Button 
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {showDetails ? 'Detayları Gizle' : 'Detaylar'}
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                'Oluşturuluyor...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Proje Oluştur
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Payment Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Ödeme Profili Oluştur</h3>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setProfileFormData({ name: '', paymentTerms: [] });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Profile Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profil Adı <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={profileFormData.name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                    placeholder="Örn: Standart 3 Taksit, Peşin Ödeme"
                  />
                </div>

                {/* Payment Terms Builder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Ödeme Koşulları <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <PaymentTermsBuilder 
                      paymentTerms={profileFormData.paymentTerms} 
                      onChange={(terms) => setProfileFormData(prev => ({ ...prev, paymentTerms: terms }))}
                      contractAmount={0}
                      hideAmounts={true}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    * Sadece ödeme yüzdeleri ve vadeleri belirleyin. Tutarlar proje oluştururken otomatik hesaplanacaktır.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowProfileModal(false);
                    setProfileFormData({ name: '', paymentTerms: [] });
                  }}
                >
                  İptal
                </Button>
                <Button
                  type="button"
                  onClick={savePaymentProfile}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddFairModal 
        isOpen={showAddFairModal} 
        onClose={() => setShowAddFairModal(false)} 
        onFairAdded={handleFairAdded} 
      />
    </div>
  );
}