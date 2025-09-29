import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import SearchableSelect from '../ui/SearchableSelect';
import VitingoPhoneInput from '../ui/SupplierPhone';
import VitingoPhoneInput from '../ui/VitingoPhoneInput';
import { 
  Building2, 
  Users, 
  X,
  Save,
  Tag,
  Plus,
  User,
  CheckCircle,
  Home,
  ArrowLeft
} from 'lucide-react';

const EditSupplierModal = ({ supplier, onClose, onSave }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [supplierUpdated, setSupplierUpdated] = useState(false);
  const [updatedSupplierInfo, setUpdatedSupplierInfo] = useState(null);
  const [isIndividualSupplier, setIsIndividualSupplier] = useState(false);
  
  const [formData, setFormData] = useState({
    company_short_name: '',
    company_title: '',
    address: '',
    phone: '',
    mobile: '',
    email: '',
    tax_office: '',
    tax_number: '',
    services: [],
    supplier_type_id: '',
    specialty_id: '',
    status: 'active'
  });

  const [currentService, setCurrentService] = useState('');
  const [currentContactTag, setCurrentContactTag] = useState('');

  // Initialize form data when supplier prop changes
  useEffect(() => {
    if (supplier) {
      setFormData({
        company_short_name: supplier.company_short_name || '',
        company_title: supplier.company_title || '',
        address: supplier.address || '',
        phone: supplier.phone || '',
        mobile: supplier.mobile || '',
        email: supplier.email || '',
        tax_office: supplier.tax_office || '',
        tax_number: supplier.tax_number || '',
        services: supplier.services || [],
        supplier_type_id: supplier.supplier_type_id || '',
        specialty_id: supplier.specialty_id || '',
        status: supplier.status || 'active'
      });

      // Check if this might be an individual supplier
      const isIndividual = supplier.company_short_name === supplier.company_title || 
                          supplier.company_short_name === 'Bireysel Tedarikçi';
      setIsIndividualSupplier(isIndividual);

      loadSupplierContacts(supplier.id);
    }
    loadCategories();
  }, [supplier]);

  // Load specialties when category changes
  useEffect(() => {
    if (formData.supplier_type_id) {
      loadSpecialties(formData.supplier_type_id);
    } else {
      setSpecialties([]);
    }
  }, [formData.supplier_type_id]);

  const loadCategories = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/supplier-categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSpecialties = async (categoryId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/supplier-specialties/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data);
      }
    } catch (error) {
      console.error('Error loading specialties:', error);
    }
  };

  const loadSupplierContacts = async (supplierId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/supplier-contacts/${supplierId}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error loading supplier contacts:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddService = () => {
    if (currentService.trim()) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, currentService.trim()]
      }));
      setCurrentService('');
    }
  };

  const handleRemoveService = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value
    };
    setContacts(updatedContacts);
  };

  const handleAddContactTag = (contactIndex) => {
    if (currentContactTag.trim()) {
      const updatedContacts = [...contacts];
      updatedContacts[contactIndex].tags = [...updatedContacts[contactIndex].tags, currentContactTag.trim()];
      setContacts(updatedContacts);
      setCurrentContactTag('');
    }
  };

  const handleRemoveContactTag = (contactIndex, tagIndex) => {
    const updatedContacts = [...contacts];
    updatedContacts[contactIndex].tags = updatedContacts[contactIndex].tags.filter((_, i) => i !== tagIndex);
    setContacts(updatedContacts);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Bilinmiyor';
  };

  const getSpecialtyName = (specialtyId) => {
    const specialty = specialties.find(spec => spec.id === specialtyId);
    return specialty ? specialty.name : 'Bilinmiyor';
  };

  const handleGoBack = () => {
    setSupplierUpdated(false);
  };

  const handleGoToDashboard = () => {
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const requiredFieldsValid = isIndividualSupplier 
      ? formData.supplier_type_id && formData.specialty_id
      : formData.company_short_name && formData.company_title && formData.supplier_type_id && formData.specialty_id;
    
    if (!requiredFieldsValid) {
      toast({
        title: "Hata",
        description: isIndividualSupplier 
          ? "Tedarikçi türü ve uzmanlık alanı seçimi zorunludur"
          : "Zorunlu alanları doldurunuz (Firma adı, ünvan, kategori, uzmanlık)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Prepare supplier data
      const supplierData = isIndividualSupplier 
        ? {
            ...formData,
            company_short_name: contacts[0]?.full_name || formData.company_short_name,
            company_title: contacts[0]?.full_name || formData.company_title,
            phone: contacts[0]?.mobile || formData.phone,
            mobile: contacts[0]?.mobile || formData.mobile,
            email: contacts[0]?.email || formData.email
          }
        : formData;

      // Update supplier
      const supplierResponse = await fetch(`${backendUrl}/api/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      });

      if (!supplierResponse.ok) {
        const error = await supplierResponse.json();
        throw new Error(error.detail || 'Failed to update supplier');
      }

      const updatedSupplier = await supplierResponse.json();

      // Update contacts
      for (const contact of contacts) {
        if (contact.full_name.trim()) {
          if (contact.id) {
            // Update existing contact
            const contactData = {
              full_name: contact.full_name,
              mobile: contact.mobile,
              email: contact.email,
              position: contact.position,
              tags: contact.tags,
              notes: contact.notes
            };
            
            await fetch(`${backendUrl}/api/supplier-contacts/${contact.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(contactData)
            });
          } else {
            // Create new contact
            const contactData = {
              ...contact,
              supplier_id: supplier.id
            };
            
            await fetch(`${backendUrl}/api/supplier-contacts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(contactData)
            });
          }
        }
      }

      // Set success state
      setUpdatedSupplierInfo({
        company_name: updatedSupplier.company_short_name,
        supplier_type: getCategoryName(updatedSupplier.supplier_type_id),
        specialty: getSpecialtyName(updatedSupplier.specialty_id),
        contacts_count: contacts.filter(c => c.full_name.trim()).length,
        is_individual: isIndividualSupplier
      });
      setSupplierUpdated(true);

      toast({
        title: "Başarılı",
        description: "Tedarikçi başarıyla güncellendi",
        variant: "default"
      });

      // Call onSave callback to refresh parent data
      if (onSave) {
        onSave();
      }

    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "Hata",
        description: error.message || "Tedarikçi güncellenirken hata oluştu", 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!supplier) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {supplierUpdated ? 'Tedarikçi Güncellendi!' : 'Tedarikçi Düzenle'}
              </h1>
              <p className="text-gray-600">
                {supplierUpdated 
                  ? 'Tedarikçi bilgileri başarıyla güncellendi'
                  : `${supplier.company_short_name} bilgilerini düzenleyin`
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {supplierUpdated ? (
            /* Success State */
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Tebrikler, {updatedSupplierInfo?.is_individual ? 'Bireysel ' : ''}Tedarikçi Başarı ile Güncellendi!
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    <strong>{updatedSupplierInfo?.company_name}</strong> {updatedSupplierInfo?.is_individual ? 'bireysel tedarikçi' : 'tedarikçi şirketi'} bilgileri başarıyla güncellendi.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="text-left space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {updatedSupplierInfo?.is_individual ? 'Kişi Adı:' : 'Firma Adı:'}
                        </span>
                        <span className="text-sm text-gray-900">{updatedSupplierInfo?.company_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Tür:</span>
                        <span className="text-sm text-gray-900">
                          {updatedSupplierInfo?.is_individual ? 'Bireysel' : 'Şirket'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Kategori:</span>
                        <span className="text-sm text-gray-900">{updatedSupplierInfo?.supplier_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Uzmanlık:</span>
                        <span className="text-sm text-gray-900">{updatedSupplierInfo?.specialty}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      🎉 Tedarikçi bilgileri başarıyla güncellendi ve değişiklikler kaydedildi.
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
                      <ArrowLeft className="h-4 w-4" />
                      <span>Tekrar Düzenle</span>
                    </Button>
                    
                    <Button onClick={handleGoToDashboard} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                      <Home className="h-4 w-4" />
                      <span>Listeye Dön</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Individual Supplier Checkbox */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Tag className="h-5 w-5" />
                      <span>Tedarikçi Türü</span>
                    </CardTitle>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-individual-supplier"
                        checked={isIndividualSupplier}
                        onChange={(e) => setIsIndividualSupplier(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label 
                        htmlFor="edit-individual-supplier" 
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Bireysel Tedarikçi
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tedarikçi Türü *
                      </label>
                      <SearchableSelect
                        options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                        value={formData.supplier_type_id}
                        onValueChange={(value) => handleInputChange('supplier_type_id', value)}
                        placeholder="Tedarikçi türü seçin..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Uzmanlık Alanı *
                      </label>
                      <SearchableSelect
                        options={specialties.map(spec => ({ value: spec.id, label: spec.name }))}
                        value={formData.specialty_id}
                        onValueChange={(value) => handleInputChange('specialty_id', value)}
                        placeholder="Uzmanlık alanı seçin..."
                        disabled={!formData.supplier_type_id}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information - Only show if not individual */}
              {!isIndividualSupplier && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5" />
                      <span>Şirket Bilgileri</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Firma Kısa Adı *
                        </label>
                        <Input
                          value={formData.company_short_name}
                          onChange={(e) => handleInputChange('company_short_name', e.target.value)}
                          placeholder="Örn: ABC Ltd"
                          required={!isIndividualSupplier}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Firma Ünvanı *
                        </label>
                        <Input
                          value={formData.company_title}
                          onChange={(e) => handleInputChange('company_title', e.target.value)}
                          placeholder="Örn: ABC Lojistik Limited Şirketi"
                          required={!isIndividualSupplier}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                        <VitingoPhoneInput
                          value={formData.phone}
                          onChange={(value) => handleInputChange('phone', value)}
                          placeholder="Telefon numarası giriniz"
                          label=""
                          className="my-0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cep Telefonu</label>
                        <Input
                          value={formData.mobile}
                          onChange={(e) => handleInputChange('mobile', e.target.value)}
                          placeholder="0535 555 0000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="ornek@sirket.com"
                        />
                      </div>
                    </div>

                    {/* Services */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hizmetler</label>
                      <div className="flex space-x-2 mb-2">
                        <Input
                          value={currentService}
                          onChange={(e) => setCurrentService(e.target.value)}
                          placeholder="Hizmet adı girin..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
                        />
                        <Button type="button" onClick={handleAddService} size="sm" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.services.map((service, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {service}
                            <button
                              type="button"
                              onClick={() => handleRemoveService(index)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contacts Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Yetkili Kişiler</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contacts.map((contact, index) => (
                    <div key={contact.id || index} className="border rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyadı</label>
                          <Input
                            value={contact.full_name}
                            onChange={(e) => handleContactChange(index, 'full_name', e.target.value)}
                            placeholder="Ad Soyadı"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cep Telefonu</label>
                          <Input
                            value={contact.mobile}
                            onChange={(e) => handleContactChange(index, 'mobile', e.target.value)}
                            placeholder="0535 555 0000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                            placeholder="ornek@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Görevi</label>
                          <Input
                            value={contact.position}
                            onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                            placeholder="Örn: İş Geliştirme Müdürü"
                          />
                        </div>
                      </div>

                      {/* Contact Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Etiketler</label>
                        <div className="flex space-x-2 mb-2">
                          <Input
                            value={currentContactTag}
                            onChange={(e) => setCurrentContactTag(e.target.value)}
                            placeholder="Etiket girin..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddContactTag(index))}
                          />
                          <Button 
                            type="button" 
                            onClick={() => handleAddContactTag(index)} 
                            size="sm" 
                            variant="outline"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {contact.tags?.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveContactTag(index, tagIndex)}
                                className="ml-2 text-green-600 hover:text-green-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditSupplierModal;