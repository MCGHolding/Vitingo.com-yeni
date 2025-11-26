import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Building2, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Tag,
  Plus,
  X,
  Save,
  ArrowLeft,
  User,
  CheckCircle,
  CreditCard,
  Trash2,
  Edit
} from 'lucide-react';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { dbToForm, formToDb, deepDiff } from '../../models/customer.mapper';
import { parseJsonSafe, apiPatchCustomer } from '../../api/utils/parse';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Editable Field Component
const EditableField = ({ 
  label, 
  value, 
  fieldName, 
  editingField, 
  startEdit, 
  cancelEdit, 
  saveField, 
  tempValue, 
  setTempValue, 
  handleFieldKeyPress,
  type = 'text',
  placeholder = '',
  isRequired = false,
  options = null, // For select fields
  customerTypes = [],
  sectors = [],
  countries = []
}) => {
  const isEditing = editingField === fieldName;
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <div className="flex-1 flex items-center space-x-2">
            {type === 'select' ? (
              <Select value={tempValue} onValueChange={setTempValue}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {fieldName === 'customer_type_id' && customerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.name}
                    </SelectItem>
                  ))}
                  {fieldName === 'specialty_id' && sectors.map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.name}
                    </SelectItem>
                  ))}
                  {fieldName === 'country' && countries.map((country) => (
                    <SelectItem key={country.name} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                  {fieldName === 'currency' && (
                    <>
                      <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
                      <SelectItem value="USD">USD - Dolar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - İngiliz Sterlini</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            ) : type === 'textarea' ? (
              <textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyDown={(e) => handleFieldKeyPress(e, fieldName)}
                placeholder={placeholder}
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-20"
              />
            ) : type === 'phone' ? (
              <PhoneInput
                country={'tr'}
                value={tempValue}
                onChange={setTempValue}
                enableSearch={true}
                inputClass="flex-1"
              />
            ) : (
              <Input
                type={type}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyDown={(e) => handleFieldKeyPress(e, fieldName)}
                placeholder={placeholder}
                className="flex-1"
              />
            )}
            <Button size="sm" onClick={() => saveField(fieldName)} className="text-green-600 hover:bg-green-50">
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-red-600 hover:bg-red-50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-200">
            <span className="text-gray-900">
              {type === 'select' ? (
                // Show label for select fields
                fieldName === 'customer_type_id' ? customerTypes.find(t => t.value === value)?.name || value :
                fieldName === 'specialty_id' ? sectors.find(s => s.value === value)?.name || value :
                fieldName === 'currency' ? (
                  value === 'TRY' ? 'TRY - Türk Lirası' :
                  value === 'USD' ? 'USD - Dolar' :
                  value === 'EUR' ? 'EUR - Euro' :
                  value === 'GBP' ? 'GBP - İngiliz Sterlini' : value
                ) : value
              ) : (
                value || <span className="text-gray-400 italic">Henüz girilmemiş</span>
              )}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEdit(fieldName)}
              className="ml-2 text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function EditCustomerPage({ customer, onBack, onSave }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Field-level editing states
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const [formData, setFormData] = useState({
    company_short_name: '',
    company_title: '',
    customer_type_id: '',
    specialty_id: '',
    address: '',
    country: '',
    city: '',
    phone: '',
    mobile: '',
    email: '',
    tax_office: '',
    tax_number: '',
    services: [],
    tags: [],
    notes: '',
    contactPerson: '',
    iban: '',
    currency: 'TRY',
    // Contact person details
    contact_full_name: '',
    contact_mobile: '',
    contact_email: '',
    contact_position: '',
    contact_address: '',
    contact_country: '',
    contact_city: '',
    // Bank details
    bank_name: '',
    bank_branch: '',
    account_holder_name: '',
    swift_code: ''
  });

  // Dropdown data
  const [customerTypes, setCustomerTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [countries, setCountries] = useState([]);
  const [newTag, setNewTag] = useState('');

  // Helper functions replaced by customer.mapper

  // Initialize form with customer data using mapper
  useEffect(() => {
    if (customer) {
      const mappedFormData = dbToForm(customer);
      setFormData(mappedFormData);
    }
    loadDropdownData();
  }, [customer]);

  const loadDropdownData = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      console.log('Loading dropdown data from:', backendUrl);
      
      // Load customer types
      console.log('Fetching customer types...');
      const customerTypesResponse = await fetch(`${backendUrl}/api/customer-types`);
      if (customerTypesResponse.ok) {
        const customerTypesData = await customerTypesResponse.json();
        console.log('Customer types loaded:', customerTypesData);
        setCustomerTypes(customerTypesData);
        
        // Verify customer type mapping for current customer
        if (customer && customer.relationshipType) {
          const mappedValue = mapRelationshipTypeToCustomerType(customer.relationshipType);
          const customerTypeFound = customerTypesData.find(ct => ct.value === mappedValue);
          console.log('Customer type mapping verification:');
          console.log('Original relationshipType:', customer.relationshipType);
          console.log('Mapped value:', mappedValue);
          console.log('Found in API:', !!customerTypeFound);
          if (customerTypeFound) {
            console.log('Customer type found:', customerTypeFound);
            // Update form data with correct customer type value
            setFormData(prev => ({
              ...prev,
              customer_type_id: customerTypeFound.value
            }));
          }
        }
      } else {
        console.error('Failed to load customer types:', customerTypesResponse.status);
      }
      
      // Load sectors
      console.log('Fetching sectors...');
      const sectorsResponse = await fetch(`${backendUrl}/api/sectors`);
      if (sectorsResponse.ok) {
        const sectorsData = await sectorsResponse.json();
        console.log('Sectors loaded:', sectorsData);
        setSectors(sectorsData);
        
        // Verify sector mapping for current customer and update form data
        if (customer && customer.sector) {
          const mappedSectorValue = mapSectorNameToValue(customer.sector, sectorsData);
          const sectorFound = sectorsData.find(s => s.name === customer.sector || s.value === customer.sector || s.value === mappedSectorValue);
          console.log('Sector mapping verification - Customer sector:', customer.sector, 'Mapped value:', mappedSectorValue, 'Found in API:', !!sectorFound);
          if (sectorFound) {
            console.log('Sector found:', sectorFound);
            // Update form data with correct sector value
            setFormData(prev => ({
              ...prev,
              specialty_id: sectorFound.value
            }));
          }
        }
      } else {
        console.error('Failed to load sectors:', sectorsResponse.status);
      }
      
      // Load countries
      console.log('Fetching countries...');
      const countriesResponse = await fetch(`${backendUrl}/api/countries`);
      if (countriesResponse.ok) {
        const countriesData = await countriesResponse.json();
        console.log('Countries loaded:', countriesData);
        setCountries(countriesData);
      } else {
        console.error('Failed to load countries:', countriesResponse.status);
      }
      
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Field-level editing functions
  const startEdit = (fieldName) => {
    setEditingField(fieldName);
    // Special handling for services array field
    if (fieldName === 'services') {
      setTempValue(formData.services ? formData.services.join(', ') : '');
    } else {
      setTempValue(formData[fieldName] || '');
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const saveField = async (fieldName) => {
    try {
      setIsLoading(true);
      
      // Special handling for services array field
      let processedValue = tempValue;
      if (fieldName === 'services') {
        // Convert comma-separated string to array and trim whitespace
        processedValue = tempValue ? tempValue.split(',').map(service => service.trim()).filter(service => service.length > 0) : [];
      }
      
      // Update formData
      const updatedFormData = { ...formData, [fieldName]: processedValue };
      setFormData(updatedFormData);
      
      // Update backend API using safe JSON parsing
      try {
        const payload = formToDb(updatedFormData);
        const result = await apiPatchCustomer(customer.id, payload);
        
        if (result) {
          // Update form data with returned customer data if available
          const updatedCustomer = result.customer || result;
          if (onSave) {
            onSave(updatedCustomer);
          }
        }
        
        console.log('Customer field updated successfully');
        
      } catch (error) {
        console.error('Field update error:', error);
        throw error; // Re-throw to be caught by outer try-catch
      }
      
      setEditingField(null);
      setTempValue('');
      
      toast({
        title: "Başarılı",
        description: "Alan güncellendi",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error saving field:', error);
      toast({
        title: "Hata",
        description: "Güncelleme sırasında hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldKeyPress = (e, fieldName) => {
    if (e.key === 'Enter') {
      saveField(fieldName);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // handleSave function removed - now using field-level editing with saveField function

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-white hover:bg-white/20 p-2 rounded-lg"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Edit className="h-7 w-7" />
                  </div>
                  <h1 className="text-3xl font-bold">Müşteri Düzenle</h1>
                </div>
                <p className="mt-2 text-orange-100">
                  {customer?.companyName || customer?.name || customer?.fullName} - Müşteri bilgilerini düzenleyin
                </p>
              </div>
            </div>
            
            <Button
              onClick={onBack}
              className="bg-white text-orange-600 hover:bg-orange-50 px-6 py-2 font-semibold rounded-lg shadow-lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* Müşteri Bilgileri */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span>Müşteri Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableField
                    label="Müşteri Türü"
                    value={formData.customer_type_id}
                    fieldName="customer_type_id"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    type="select"
                    placeholder="Müşteri türü seçin..."
                    isRequired={true}
                    customerTypes={customerTypes}
                  />

                  <EditableField
                    label="Sektör"
                    value={formData.specialty_id}
                    fieldName="specialty_id"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    type="select"
                    placeholder="Sektör seçin..."
                    isRequired={true}
                    sectors={sectors}
                  />

                  <EditableField
                    label="Kaynak"
                    value={formData.source}
                    fieldName="source"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    type="text"
                    placeholder="Kaynak"
                  />

                  <EditableField
                    label="Durum"
                    value={formData.status}
                    fieldName="status"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    type="text"
                    placeholder="Durum"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Firma Bilgileri */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  <span>Firma Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableField
                    label="Firma Kısa Adı"
                    value={formData.company_short_name}
                    fieldName="company_short_name"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    placeholder="Örn: ABC Ltd"
                    isRequired={true}
                  />
                  
                  <EditableField
                    label="Firma Ünvanı"
                    value={formData.company_title}
                    fieldName="company_title"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    placeholder="Örn: ABC Lojistik Limited Şirketi"
                    isRequired={true}
                  />
                </div>

                <EditableField
                  label="Adres"
                  value={formData.address}
                  fieldName="address"
                  editingField={editingField}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveField={saveField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  handleFieldKeyPress={handleFieldKeyPress}
                  type="textarea"
                  placeholder="Firma adresi..."
                  isRequired={true}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableField
                    label="Ülke"
                    value={formData.country}
                    fieldName="country"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    type="select"
                    placeholder="Ülke seçiniz..."
                    isRequired={true}
                    countries={countries}
                  />

                  <EditableField
                    label="Şehir"
                    value={formData.city}
                    fieldName="city"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    placeholder="Şehir adı"
                    isRequired={true}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableField
                    label="Vergi Dairesi"
                    value={formData.tax_office}
                    fieldName="tax_office"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    placeholder="Örn: Beşiktaş Vergi Dairesi"
                  />
                  
                  <EditableField
                    label="VKN"
                    value={formData.tax_number}
                    fieldName="tax_number"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    placeholder="1234567890"
                  />
                </div>

                <EditableField
                  label="Hizmetler"
                  value={formData.services.join(', ')}
                  fieldName="services"
                  editingField={editingField}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveField={saveField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  handleFieldKeyPress={handleFieldKeyPress}
                  type="textarea"
                  placeholder="Hizmetleri virgül ile ayırarak giriniz (Örn: Web Tasarım, Fuar Organizasyonu, Grafik Tasarım)"
                />
              </CardContent>
            </Card>

            {/* İletişim Bilgileri */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  <span>İletişim Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <EditableField
                    label="Telefon"
                    value={formData.phone}
                    fieldName="phone"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    type="phone"
                    placeholder="+90 212 555 1234"
                    isRequired={true}
                  />

                  <EditableField
                    label="Cep Telefonu"
                    value={formData.mobile}
                    fieldName="mobile"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    type="phone"
                    placeholder="+90 532 123 4567"
                    isRequired={true}
                  />

                  <EditableField
                    label="Email"
                    value={formData.email}
                    fieldName="email"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    type="email"
                    placeholder="ornek@sirket.com"
                    isRequired={true}
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* İletişim Kişisi Detayları */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <span>İletişim Kişisi Detayları</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <EditableField
                  label="İletişim Kişisi Adı"
                  value={formData.contactPerson}
                  fieldName="contactPerson"
                  editingField={editingField}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveField={saveField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  handleFieldKeyPress={handleFieldKeyPress}
                  placeholder="İletişim kişisinin tam adı"
                  isRequired={true}
                />

                <EditableField
                  label="Pozisyon"
                  value={formData.contact_position}
                  fieldName="contact_position"
                  editingField={editingField}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveField={saveField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  handleFieldKeyPress={handleFieldKeyPress}
                  placeholder="İş pozisyonu (Örn: Genel Müdür, İK Uzmanı)"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableField
                    label="Cep Telefonu"
                    value={formData.contact_mobile}
                    fieldName="contact_mobile"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    type="tel"
                    placeholder="+90 555 123 45 67"
                  />

                  <EditableField
                    label="Email"
                    value={formData.contact_email}
                    fieldName="contact_email"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    type="email"
                    placeholder="kisi@firma.com"
                  />
                </div>

                <EditableField
                  label="İletişim Adresi"
                  value={formData.contact_address}
                  fieldName="contact_address"
                  editingField={editingField}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveField={saveField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  handleFieldKeyPress={handleFieldKeyPress}
                  type="textarea"
                  placeholder="İletişim kişisinin detay adresi"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableField
                    label="Ülke"
                    value={formData.contact_country}
                    fieldName="contact_country"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    type="select"
                    placeholder="Ülke seçiniz..."
                    countries={countries}
                  />

                  <EditableField
                    label="Şehir"
                    value={formData.contact_city}
                    fieldName="contact_city"
                    editingField={editingField}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveField={saveField}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    handleFieldKeyPress={handleFieldKeyPress}
                    placeholder="Şehir adı"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Banka Ödeme Bilgileri */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <span>Banka Ödeme Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <EditableField
                  label="Hesap Sahibi"
                  value={formData.account_holder_name}
                  fieldName="account_holder_name"
                  editingField={editingField}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveField={saveField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  handleFieldKeyPress={handleFieldKeyPress}
                  placeholder="Hesap sahibinin adı soyadı"
                />

                <EditableField
                  label="IBAN"
                  value={formData.iban}
                  fieldName="iban"
                  editingField={editingField}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveField={saveField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  handleFieldKeyPress={handleFieldKeyPress}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />

                <EditableField
                  label="Banka Adı"
                  value={formData.bank_name}
                  fieldName="bank_name"
                  editingField={editingField}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveField={saveField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  handleFieldKeyPress={handleFieldKeyPress}
                  placeholder="Banka adı"
                />

                <EditableField
                  label="Şube"
                  value={formData.bank_branch}
                  fieldName="bank_branch"
                  editingField={editingField}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveField={saveField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  handleFieldKeyPress={handleFieldKeyPress}
                  placeholder="Şube adı"
                />

                <EditableField
                  label="Swift Kodu"
                  value={formData.swift_code}
                  fieldName="swift_code"
                  editingField={editingField}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveField={saveField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  handleFieldKeyPress={handleFieldKeyPress}
                  placeholder="SWIFT/BIC kodu"
                />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-orange-600" />
                  <span>Etiketler</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        <span>{tag}</span>
                        <Button
                          onClick={() => removeTag(tag)}
                          size="sm"
                          variant="ghost"
                          className="ml-2 h-4 w-4 p-0 text-blue-600 hover:bg-blue-200"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Yeni etiket ekle"
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button
                      onClick={addTag}
                      size="sm"
                      variant="outline"
                      disabled={!newTag.trim()}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span>Notlar</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <EditableField
                  label="Müşteri Notları"
                  value={formData.notes}
                  fieldName="notes"
                  editingField={editingField}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  saveField={saveField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  handleFieldKeyPress={handleFieldKeyPress}
                  type="textarea"
                  placeholder="Müşteri hakkında notlarınız..."
                />
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}