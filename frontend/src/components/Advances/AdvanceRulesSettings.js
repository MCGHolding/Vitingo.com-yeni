import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CheckIcon, XIcon, CreditCardIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdvanceRulesSettings = () => {
  const { checkAuth } = useAuth();
  const [advanceRules, setAdvanceRules] = useState(null);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [updatingRules, setUpdatingRules] = useState(false);
  
  // User advance rights reset
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [resettingUser, setResettingUser] = useState(false);
  
  // User limits management  
  const [userLimits, setUserLimits] = useState(null);
  const [selectedUserForLimits, setSelectedUserForLimits] = useState('');
  const [loadingLimits, setLoadingLimits] = useState(false);
  const [updatingLimits, setUpdatingLimits] = useState(false);
  
  // Currencies management
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [allowedCurrencies, setAllowedCurrencies] = useState([]);
  const [baseCurrency, setBaseCurrency] = useState('TRY');
  const [currencySearchTerm, setCurrencySearchTerm] = useState('');

  // Fetch advance rules
  const fetchAdvanceRules = async () => {
    try {
      setRulesLoading(true);
      const response = await axios.get(`${API}/advance-rules`);
      setAdvanceRules(response.data);
    } catch (error) {
      toast.error('Kurallar yüklenirken hata oluştu');
    } finally {
      setRulesLoading(false);
    }
  };

  // Update advance rules
  const updateAdvanceRules = async () => {
    if (!advanceRules) return;

    setUpdatingRules(true);
    try {
      await axios.put(`${API}/advance-rules`, {
        standard_days: advanceRules.standard_days,
        medium_days: advanceRules.medium_days,
        extended_days: advanceRules.extended_days,
        yearly_medium_limit: advanceRules.yearly_medium_limit || 4,
        yearly_extended_limit: advanceRules.yearly_extended_limit,
        max_open_advances: advanceRules.max_open_advances || 3,
        max_total_amount: advanceRules.max_total_amount || 5000,
        rules_enabled: advanceRules.rules_enabled
      });
      
      toast.success('Avans kuralları başarıyla güncellendi');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kurallar güncellenirken hata oluştu');
    } finally {
      setUpdatingRules(false);
    }
  };

  // Fetch users for reset functionality
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      // Ensure users is always an array and extract user objects
      const userData = Array.isArray(response.data) ? response.data : [];
      // Extract just the user objects from the response
      const usersList = userData.map(item => item.user).filter(Boolean);
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]); // Set empty array on error
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    }
  };

  // Reset user advance usage
  const resetUserAdvanceUsage = async () => {
    if (!selectedUserId) {
      toast.error('Lütfen kullanıcı seçin');
      return;
    }

    const selectedUser = users.find(u => u.id === selectedUserId);
    const confirmMessage = `${selectedUser?.full_name} kullanıcısının avans haklarını sıfırlamak istediğinizden emin misiniz?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setResettingUser(true);
    try {
      await axios.post(`${API}/advance-usage/reset/${selectedUserId}`);
      toast.success('Kullanıcı avans hakları başarıyla sıfırlandı');
      setSelectedUserId('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Avans hakları sıfırlanırken hata oluştu');
    } finally {
      setResettingUser(false);
    }
  };

  // Fetch user limits
  const fetchUserLimits = async (userId) => {
    if (!userId) return;
    
    setLoadingLimits(true);
    try {
      const response = await axios.get(`${API}/users/${userId}/limits`);
      setUserLimits(response.data);
    } catch (error) {
      toast.error('Kullanıcı limitleri alınamadı');
    } finally {
      setLoadingLimits(false);
    }
  };

  // Update user limits
  const updateUserLimits = async () => {
    if (!selectedUserForLimits || !userLimits) return;

    setUpdatingLimits(true);
    try {
      await axios.put(`${API}/users/${selectedUserForLimits}/limits`, {
        max_open_advances: userLimits.max_open_advances,
        max_total_amount_usd: userLimits.max_total_amount_usd
      });
      
      toast.success('Kullanıcı limitleri başarıyla güncellendi');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Limitler güncellenirken hata oluştu');
    } finally {
      setUpdatingLimits(false);
    }
  };

  // Handle user selection for limits
  const handleUserSelectionForLimits = (userId) => {
    setSelectedUserForLimits(userId);
    if (userId) {
      fetchUserLimits(userId);
    } else {
      setUserLimits(null);
    }
  };

  // Fetch currencies
  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${API}/currencies/public`);
      const data = response.data;
      const currenciesList = data.currencies || data;
      setCurrencies(currenciesList);
    } catch (error) {
      console.error('Error fetching currencies:', error);
      toast.error('Para birimleri yüklenirken hata oluştu');
    } finally {
      setLoadingCurrencies(false);
    }
  };

  // Fetch company info for allowed currencies
  const fetchCompanyInfo = async () => {
    try {
      // Get user info which includes company data
      const response = await axios.get(`${API}/auth/me`);
      const userData = response.data;
      const companyData = userData.company;
      
      if (!companyData) {
        console.error('❌ No company data found');
        return;
      }
      
      console.log('📊 Company Data:', companyData);
      
      const baseCurr = companyData.base_currency || 'TRY';
      const allowed = companyData.allowed_currencies || [];
      
      console.log('💰 Base Currency:', baseCurr);
      console.log('📋 Allowed Currencies (from DB):', allowed);
      
      // Ensure base currency is always in allowed currencies
      if (!allowed.includes(baseCurr)) {
        allowed.unshift(baseCurr); // Add to beginning
      }
      
      console.log('✅ Final Allowed Currencies:', allowed);
      
      setAllowedCurrencies(allowed);
      setBaseCurrency(baseCurr);
    } catch (error) {
      console.error('❌ Error fetching company info:', error);
    }
  };

  // Handle currency toggle
  const handleCurrencyToggle = (currencyCode) => {
    // Can't remove base currency
    if (currencyCode === baseCurrency && allowedCurrencies.includes(currencyCode)) {
      toast.error('Temel para biriminizi kaldıramazsınız');
      return;
    }
    
    if (allowedCurrencies.includes(currencyCode)) {
      // Remove currency
      setAllowedCurrencies(allowedCurrencies.filter(c => c !== currencyCode));
    } else {
      // Add currency (base + max 4 others = 5 total)
      // Count non-base currencies
      const nonBaseCurrencies = allowedCurrencies.filter(c => c !== baseCurrency);
      if (nonBaseCurrencies.length >= 4) {
        toast.error('Temel para birimi dışında en fazla 4 para birimi seçebilirsiniz (toplam 5)');
        return;
      }
      setAllowedCurrencies([...allowedCurrencies, currencyCode]);
    }
  };

  // Save allowed currencies
  const saveAllowedCurrencies = async () => {
    try {
      setUpdatingRules(true);
      
      console.log('💾 Saving allowed currencies:', allowedCurrencies);
      console.log('🔑 Base currency:', baseCurrency);
      
      const response = await axios.put(`${API}/company/update`, {
        allowed_currencies: allowedCurrencies
      });
      
      console.log('✅ Backend response:', response.data);
      console.log('✅ Saved currencies from backend:', response.data.allowed_currencies);
      
      // Show success message
      toast.success('✅ Para birimleri kaydedildi! Sayfa yenileniyor...');
      
      // Force page reload to refresh all data including Dashboard currencies
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Save error:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Güncelleme sırasında hata oluştu');
      setUpdatingRules(false);
    }
  };

  useEffect(() => {
    fetchAdvanceRules();
    fetchUsers();
    fetchCurrencies();
    fetchCompanyInfo();
  }, []);

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Avans Kuralları</h3>
          <p className="text-gray-600 mt-2">Şirketiniz için avans kapama sürelerini ve kurallarını yönetin</p>
        </div>

        {rulesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner mr-3"></div>
            <span>Kurallar yükleniyor...</span>
          </div>
        ) : advanceRules ? (
          <div className="space-y-6">
            {/* Rules Enable/Disable */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Kuralları Uygula</h4>
                  <p className="text-sm text-gray-600">
                    Kapalı olduğunda kullanıcılar her zaman 3 seçenekten birini seçebilir
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={advanceRules.rules_enabled}
                    onChange={(e) => setAdvanceRules(prev => ({...prev, rules_enabled: e.target.checked}))}
                    data-testid="rules-enabled-checkbox"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </Card>

            {/* Days Configuration */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Gün Sayıları Yapılandırması</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="standard-days" className="form-label">Standart Gün Sayısı</Label>
                  <Input
                    id="standard-days"
                    type="number"
                    min="1"
                    max="365"
                    value={advanceRules.standard_days}
                    onChange={(e) => setAdvanceRules(prev => ({...prev, standard_days: parseInt(e.target.value) || 15}))}
                    className="form-input"
                    data-testid="standard-days-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Varsayılan kapama süresi</p>
                </div>

                <div>
                  <Label htmlFor="medium-days" className="form-label">Orta Seçenek Gün Sayısı</Label>
                  <Input
                    id="medium-days"
                    type="number"
                    min="1"
                    max="365"
                    value={advanceRules.medium_days}
                    onChange={(e) => setAdvanceRules(prev => ({...prev, medium_days: parseInt(e.target.value) || 30}))}
                    className="form-input"
                    data-testid="medium-days-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Modal tetikleyen seçenek</p>
                </div>

                <div>
                  <Label htmlFor="extended-days" className="form-label">Uzun Seçenek Gün Sayısı</Label>
                  <Input
                    id="extended-days"
                    type="number"
                    min="1"
                    max="365"
                    value={advanceRules.extended_days}
                    onChange={(e) => setAdvanceRules(prev => ({...prev, extended_days: parseInt(e.target.value) || 60}))}
                    className="form-input"
                    data-testid="extended-days-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Sınırlı kullanım hakkı</p>
                </div>
              </div>
            </Card>

            {/* Yearly Limits */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Yıllık Haklar</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="yearly-medium-limit" className="form-label">Yıllık Orta Seçenek Hakkı</Label>
                  <Input
                    id="yearly-medium-limit"
                    type="number"
                    min="0"
                    max="24"
                    value={advanceRules.yearly_medium_limit || 4}
                    onChange={(e) => setAdvanceRules(prev => ({...prev, yearly_medium_limit: parseInt(e.target.value) || 4}))}
                    className="form-input"
                    data-testid="yearly-medium-limit-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Bir takvim yılında kaç kez {advanceRules.medium_days} gün kullanılabilir</p>
                </div>
                
                <div>
                  <Label htmlFor="yearly-extended-limit" className="form-label">Yıllık Uzun Seçenek Hakkı</Label>
                  <Input
                    id="yearly-extended-limit"
                    type="number"
                    min="0"
                    max="12"
                    value={advanceRules.yearly_extended_limit}
                    onChange={(e) => setAdvanceRules(prev => ({...prev, yearly_extended_limit: parseInt(e.target.value) || 2}))}
                    className="form-input"
                    data-testid="yearly-extended-limit-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Bir takvim yılında kaç kez {advanceRules.extended_days} gün kullanılabilir</p>
                </div>
              </div>
            </Card>

            {/* Advance Limits */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Avans Limitleri</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="max-open-advances" className="form-label">Maksimum Açık Avans Sayısı</Label>
                  <Input
                    id="max-open-advances"
                    type="number"
                    min="1"
                    max="999"
                    value={advanceRules.max_open_advances || 3}
                    onChange={(e) => setAdvanceRules(prev => ({...prev, max_open_advances: parseInt(e.target.value) || 3}))}
                    className="form-input"
                    data-testid="max-open-advances-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kullanıcı aynı anda en fazla kaç avans alabilir</p>
                </div>
                
                <div>
                  <Label htmlFor="max-total-amount" className="form-label">Maksimum Toplam Tutar (Temel Para Birimi)</Label>
                  <Input
                    id="max-total-amount"
                    type="number"
                    min="0"
                    step="100"
                    value={advanceRules.max_total_amount || 5000}
                    onChange={(e) => setAdvanceRules(prev => ({...prev, max_total_amount: parseFloat(e.target.value) || 5000}))}
                    className="form-input"
                    data-testid="max-total-amount-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Açık avansların toplam tutarı bu limiti aşamaz</p>
                </div>
              </div>
            </Card>

            {/* Preview */}
            <Card className="p-6 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-4">Önizleme</h4>
              <div className="flex gap-4">
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm">
                  <div className="font-medium">{advanceRules.standard_days} Gün</div>
                  <div className="text-xs text-gray-500">Standart</div>
                </div>
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm">
                  <div className="font-medium">{advanceRules.medium_days} Gün</div>
                  {advanceRules.rules_enabled && (
                    <div className="text-xs text-amber-600">({advanceRules.yearly_medium_limit || 4} hak/yıl)</div>
                  )}
                </div>
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm">
                  <div className="font-medium">{advanceRules.extended_days} Gün</div>
                  {advanceRules.rules_enabled && (
                    <div className="text-xs text-teal-600">({advanceRules.yearly_extended_limit} hak/yıl)</div>
                  )}
                </div>
              </div>
            </Card>

            {/* Currency Management Info - Moved to General Settings */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCardIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Para Birimleri Yönetimi Taşındı</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Para birimi ayarları artık <strong>Ayarlar → Şirket Bilgileri</strong> bölümünde bulunmaktadır.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>✓ Temel para biriminizi seçin</p>
                    <p>✓ İstediğiniz 4 ek para birimini ekleyin (toplam 5)</p>
                    <p>✓ Avans talep ve kapama işlemlerinde sadece seçili para birimleri görünür</p>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="mt-4 border-blue-400 text-blue-700 hover:bg-blue-100"
                    onClick={() => window.location.href = '/dashboard/settings'}
                  >
                    Şirket Bilgilerine Git →
                  </Button>
                </div>
              </div>
            </Card>

            {/* User Advance Rights Reset */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Kullanıcı Avans Hakları Yönetimi</h4>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Bu kullanıcı için avans haklarını sıfırla</p>
                    <p className="text-sm text-amber-700">
                      Seçilen kullanıcının takvim yılı avans hakları sıfırlanır, sanki yılın ilk günü başlamış gibi olur.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label htmlFor="user-select" className="form-label text-sm">Kullanıcı Seçin</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger data-testid="user-reset-select" className="form-input">
                        <SelectValue placeholder="Sıfırlanacak kullanıcıyı seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{user.full_name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {user.email}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={resetUserAdvanceUsage}
                    disabled={resettingUser || !selectedUserId}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="reset-user-btn"
                  >
                    {resettingUser ? (
                      <div className="loading-spinner mr-2"></div>
                    ) : (
                      <XIcon className="w-4 h-4 mr-2" />
                    )}
                    <span>{resettingUser ? 'Sıfırlanıyor...' : 'Hakları Sıfırla'}</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* User Limits Management */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Kullanıcı Avans Limitleri</h4>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center mt-0.5">
                    <CheckIcon className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-800 font-medium">Kullanıcı Bazlı Avans Limitleri</p>
                    <p className="text-sm text-purple-700">
                      Her kullanıcı için maksimum açık avans sayısı ve toplam tutar limitlerini ayarlayın.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="limits-user-select" className="form-label text-sm">Kullanıcı Seçin</Label>
                    <Select value={selectedUserForLimits} onValueChange={handleUserSelectionForLimits}>
                      <SelectTrigger data-testid="limits-user-select" className="form-input">
                        <SelectValue placeholder="Limit ayarlanacak kullanıcıyı seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{user.full_name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {user.email}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {loadingLimits && (
                    <div className="flex items-center justify-center py-4">
                      <div className="loading-spinner mr-2"></div>
                      <span className="text-sm text-gray-600">Kullanıcı limitleri yükleniyor...</span>
                    </div>
                  )}

                  {userLimits && !loadingLimits && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label htmlFor="max-open-advances" className="form-label text-sm">Maksimum Açık Avans Sayısı</Label>
                        <Input
                          id="max-open-advances"
                          type="number"
                          min="1"
                          max="10"
                          value={userLimits.max_open_advances}
                          onChange={(e) => setUserLimits(prev => ({...prev, max_open_advances: parseInt(e.target.value) || 3}))}
                          className="form-input"
                          data-testid="max-open-advances-input"
                        />
                        <p className="text-xs text-gray-500 mt-1">Kullanıcının aynı anda kaç avans talebi olabileceği</p>
                      </div>

                      <div>
                        <Label htmlFor="max-total-usd" className="form-label text-sm">Maksimum Toplam Tutar (USD)</Label>
                        <Input
                          id="max-total-usd"
                          type="number"
                          min="100"
                          max="50000"
                          value={userLimits.max_total_amount_usd}
                          onChange={(e) => setUserLimits(prev => ({...prev, max_total_amount_usd: parseInt(e.target.value) || 5000}))}
                          className="form-input"
                          data-testid="max-total-usd-input"
                        />
                        <p className="text-xs text-gray-500 mt-1">Açık avansların toplam USD karşılığı limiti</p>
                      </div>

                      <div className="col-span-full">
                        <Button
                          onClick={updateUserLimits}
                          disabled={updatingLimits}
                          className="btn-primary"
                          data-testid="update-limits-btn"
                        >
                          {updatingLimits ? (
                            <div className="loading-spinner mr-2"></div>
                          ) : (
                            <CheckIcon className="w-4 h-4 mr-2" />
                          )}
                          <span>{updatingLimits ? 'Güncelleniyor...' : 'Limitleri Güncelle'}</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={updateAdvanceRules}
                disabled={updatingRules}
                className="btn-primary"
                data-testid="save-rules-btn"
              >
                {updatingRules ? (
                  <div className="loading-spinner mr-2"></div>
                ) : (
                  <CheckIcon className="w-4 h-4 mr-2" />
                )}
                <span>{updatingRules ? 'Kaydediliyor...' : 'Kuralları Kaydet'}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Kurallar yüklenemedi
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvanceRulesSettings;