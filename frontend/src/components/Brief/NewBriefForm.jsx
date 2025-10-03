import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import VitingoPhoneInput from '../ui/SupplierPhone';
import { allCustomers } from '../../mock/customersData';
import { allPeople } from '../../mock/peopleData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
import { 
  Upload,
  X,
  Plus,
  Save,
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Users,
  FileText,
  ImageIcon,
  Ruler,
  Eye,
  EyeOff,
  User
} from 'lucide-react';

// Add CSS for slider styling and animations
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: #2563eb;
    cursor: pointer;
  }
  
  .slider::-moz-range-thumb {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: #2563eb;
    cursor: pointer;
    border: none;
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default function NewBriefForm({ onBackToDashboard }) {
  const [formData, setFormData] = useState({
    // Basic Information
    customerId: '', // Changed from clientCompany to customerId
    contactPerson: '',
    email: '',
    phone: '',
    
    // Event/Fair Information
    projectId: '',
    eventName: '',
    eventLocation: '',
    eventDate: '',
    eventCity: '',
    eventCountry: '',
    conventionCenter: '',
    eventDuration: '',
    
    // Stand Requirements
    standArea: '', // m2
    standType: '', // dropdown
    closedSides: '', // number
    standHeight: '', // meters
    
    // Design Preferences
    designStyle: '', // dropdown
    colorPreferences: [],
    brandColors: '',
    
    // Services Required
    services: [],
    
    // Budget
    budgetRange: '',
    
    // Additional Information
    specialRequirements: '',
    targetAudience: '',
    objectives: '',
    
    // Files
    logoFiles: [],
    referenceImages: [],
    brandGuidelines: [],
    
    // Priorities
    priority: 'normal',
    deadline: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadingSections, setUploadingSections] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [relatedPeople, setRelatedPeople] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  
  // Multi-step form states
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState({
    standElements: {},  // Changed to object for nested selections
    employeeCount: '',
    employeeDetails: '',
    priceImportance: 3,
    designImportance: 3,
    designFiles: []
  });

  // Stand elements configuration with nested options
  const standElementsConfig = {
    flooring: {
      label: 'Zemin',
      icon: '🟫',
      required: true,
      subOptions: {
        raised36mm: {
          label: '36mm Yükseltilmiş Zemin',
          subOptions: {
            carpet: { label: 'Halı Kaplama', icon: '🟫' },
            parquet: { label: 'Parke Kaplama', icon: '🪵' },
            pvc: { label: 'PVC Kaplama', icon: '⬜' }
          }
        },
        standard: {
          label: 'Standart Zemin',
          subOptions: {
            carpet: { label: 'Halı', icon: '🟫' },
            concrete: { label: 'Beton', icon: '⬜' }
          }
        },
        platform: {
          label: 'Platform Zemin',
          subOptions: {
            wooden: { label: 'Ahşap Platform', icon: '🪵' },
            metal: { label: 'Metal Platform', icon: '⚙️' }
          }
        }
      }
    },
    counter: {
      label: 'Tezgah',
      icon: '🏪',
      subOptions: {
        reception: { label: 'Karşılama Tezgahı', icon: '🏪' },
        display: { label: 'Sergi Tezgahı', icon: '📊' },
        service: { label: 'Servis Tezgahı', icon: '☕' }
      }
    },
    furniture: {
      label: 'Mobilya',
      icon: '🪑',
      subOptions: {
        seating: {
          label: 'Oturma Grupları',
          subOptions: {
            armchairs: { label: 'Berjer/Koltuk', icon: '🛋️' },
            chairs: { label: 'Sandalyeler', icon: '🪑' },
            sofas: { label: 'Kanepe Takımı', icon: '🛋️' }
          }
        },
        tables: {
          label: 'Masa Grupları',
          subOptions: {
            meeting: { label: 'Toplantı Masası', icon: '📋' },
            cocktail: { label: 'Kokteyl Masası', icon: '🍸' },
            display: { label: 'Sergi Masası', icon: '📊' }
          }
        },
        storage: { label: 'Dolap/Raf Sistemleri', icon: '📚' }
      }
    },
    multimedia: {
      label: 'Multimedya',
      icon: '📺',
      subOptions: {
        displays: {
          label: 'Ekran Sistemleri',
          subOptions: {
            tv: { label: 'LED TV', icon: '📺' },
            projector: { label: 'Projeksiyon', icon: '📽️' },
            touchscreen: { label: 'Dokunmatik Ekran', icon: '👆' }
          }
        },
        audio: { label: 'Ses Sistemi', icon: '🔊' },
        lighting: { label: 'Özel Aydınlatma', icon: '💡' }
      }
    },
    closedMeeting: {
      label: 'Kapalı Toplantı Odası',
      icon: '🏢',
      subOptions: {
        small: { label: 'Küçük (2-4 Kişi)', icon: '👥' },
        medium: { label: 'Orta (5-8 Kişi)', icon: '👥' },
        large: { label: 'Büyük (9+ Kişi)', icon: '👥' }
      }
    },
    storage: {
      label: 'Depo Alanı',
      icon: '📦',
      subOptions: {
        lockable: { label: 'Kilitli Depo', icon: '🔒' },
        open: { label: 'Açık Raf', icon: '📚' },
        hidden: { label: 'Gizli Depo', icon: '📦' }
      }
    },
    catering: {
      label: 'İkram Alanı',
      icon: '☕',
      subOptions: {
        coffee: { label: 'Kahve Köşesi', icon: '☕' },
        mini_kitchen: { label: 'Mini Mutfak', icon: '🍳' },
        bar: { label: 'Bar Tezgahı', icon: '🍸' }
      }
    },
    seating: {
      label: 'Oturma Alanı',
      icon: '🛋️',
      subOptions: {
        lounge: { label: 'Lounge Alanı', icon: '🛋️' },
        waiting: { label: 'Bekleme Alanı', icon: '🪑' },
        vip: { label: 'VIP Oturma', icon: '👑' }
      }
    }
  };

  // Load customers data
  const [customers, setCustomers] = useState([]);
  
  // Load projects data
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Country profile states
  const [countryProfiles, setCountryProfiles] = useState([]);
  const [selectedCountryProfile, setSelectedCountryProfile] = useState('US'); // Default to US (Amerika)
  const [formSchema, setFormSchema] = useState({});
  const [isNewCountryModalOpen, setIsNewCountryModalOpen] = useState(false);
  const [userRole, setUserRole] = useState('viewer'); // TODO: Get from auth context

  // Load country profiles from backend API
  const fetchCountryProfiles = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/country-profiles`);
      if (response.ok) {
        const profilesData = await response.json();
        setCountryProfiles(profilesData);
        console.log('Country profiles loaded:', profilesData.length);
      } else {
        console.error('Failed to fetch country profiles');
        // Fallback to default profiles
        setCountryProfiles([
          { code: 'US', name: 'Amerika', currency: 'USD' },
          { code: 'TR', name: 'Türkiye', currency: 'TRY' },
          { code: 'OTHER', name: 'Diğer', currency: 'USD' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching country profiles:', error);
      // Fallback to default profiles
      setCountryProfiles([
        { code: 'US', name: 'Amerika', currency: 'USD' },
        { code: 'TR', name: 'Türkiye', currency: 'TRY' },
        { code: 'OTHER', name: 'Diğer', currency: 'USD' }
      ]);
    }
  };

  useEffect(() => {
    // Add slider styles to head
    const styleElement = document.createElement("style");
    styleElement.innerHTML = sliderStyles;
    document.head.appendChild(styleElement);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    // Load customers from backend API
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/customers`);
        if (response.ok) {
          const customersData = await response.json();
          setCustomers(customersData.filter(customer => customer.status === 'active'));
        } else {
          console.error('Failed to fetch customers');
          // Fallback to mock data
          setCustomers(allCustomers.filter(customer => customer.status === 'active'));
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        // Fallback to mock data
        setCustomers(allCustomers.filter(customer => customer.status === 'active'));
      }
    };

    // Load projects/fairs from backend API
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/fairs`);
        if (response.ok) {
          const projectsData = await response.json();
          setProjects(projectsData.filter(project => project.status === 'active'));
          console.log('Projects loaded from database:', projectsData.length);
        } else {
          console.error('Failed to fetch projects');
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    // Load form schema for selected country
    const fetchFormSchema = async (countryCode) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/forms/brief?country=${countryCode}`);
        if (response.ok) {
          const schemaData = await response.json();
          setFormSchema(schemaData);
          console.log('Form schema loaded for country:', countryCode, schemaData);
        } else {
          console.error('Failed to fetch form schema');
        }
      } catch (error) {
        console.error('Error fetching form schema:', error);
      }
    };

    fetchCustomers();
    fetchProjects();
    fetchCountryProfiles();
    fetchFormSchema(selectedCountryProfile);
  }, []);

  // Reload schema when country profile changes
  useEffect(() => {
    const fetchFormSchema = async (countryCode) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/forms/brief?country=${countryCode}`);
        if (response.ok) {
          const schemaData = await response.json();
          setFormSchema(schemaData);
          console.log('Form schema loaded for country:', countryCode, schemaData);
        } else {
          console.error('Failed to fetch form schema');
        }
      } catch (error) {
        console.error('Error fetching form schema:', error);
      }
    };

    if (selectedCountryProfile) {
      fetchFormSchema(selectedCountryProfile);
    }
  }, [selectedCountryProfile]);

  // Update contact person and email when customer is selected
  useEffect(() => {
    if (formData.customerId) {
      const customer = customers.find(c => c.id.toString() === formData.customerId);
      if (customer) {
        setSelectedCustomer(customer);
        
        // Fetch related people from backend API
        const fetchCustomerPeople = async () => {
          try {
            const response = await fetch(`${BACKEND_URL}/api/customers/${customer.id}/people`);
            if (response.ok) {
              const customerPeople = await response.json();
              setRelatedPeople(customerPeople);
              
              // Reset person selection when customer changes
              setSelectedPersonId('');
              
              // If there are related people, don't auto-fill, let user choose
              // If no related people, auto-select customer default and fill data
              if (customerPeople.length === 0) {
                setSelectedPersonId('customer-default');
              }
            } else {
              console.error('Failed to fetch customer people');
              // Fallback to mock data
              const customerPeople = allPeople.filter(person => 
                person.company === customer.companyName && 
                person.status === 'active'
              );
              setRelatedPeople(customerPeople);
              setSelectedPersonId('');
              if (customerPeople.length === 0) {
                setSelectedPersonId('customer-default');
              }
            }
          } catch (error) {
            console.error('Error fetching customer people:', error);
            // Fallback to mock data
            const customerPeople = allPeople.filter(person => 
              person.company === customer.companyName && 
              person.status === 'active'
            );
            setRelatedPeople(customerPeople);
            setSelectedPersonId('');
            if (customerPeople.length === 0) {
              setSelectedPersonId('customer-default');
            }
          }
        };

        fetchCustomerPeople();
      }
    } else {
      setSelectedCustomer(null);
      setRelatedPeople([]);
      setSelectedPersonId('');
    }
  }, [formData.customerId, customers]);

  // Update contact info when a person is selected - separate useEffect to prevent loops
  useEffect(() => {
    if (selectedPersonId && selectedCustomer) {
      if (selectedPersonId === 'customer-default') {
        // Use customer's default contact info
        setFormData(prev => ({
          ...prev,
          contactPerson: selectedCustomer.contactPerson,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone || ''
        }));
      } else {
        // Use selected person's info
        const person = relatedPeople.find(p => p.id.toString() === selectedPersonId);
        if (person) {
          setFormData(prev => ({
            ...prev,
            contactPerson: `${person.first_name} ${person.last_name}`,
            email: person.email,
            phone: person.phone || ''
          }));
        }
      }
    } else if (!selectedPersonId) {
      // Clear contact fields when no person is selected
      setFormData(prev => ({
        ...prev,
        contactPerson: '',
        email: '',
        phone: ''
      }));
    }
  }, [selectedPersonId, selectedCustomer, relatedPeople]);

  const standTypes = [
    { value: 'shell-scheme', label: 'Shell Scheme (Kabuk Stand)' },
    { value: 'space-only', label: 'Space Only (Boş Alan)' },
    { value: 'peninsula', label: 'Peninsula (Yarımada)' },
    { value: 'island', label: 'Island (Ada Stand)' },
    { value: 'corner', label: 'Corner (Köşe Stand)' },
    { value: 'linear', label: 'Linear (Doğrusal)' }
  ];

  const designStyles = [
    { value: 'modern', label: 'Modern' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'industrial', label: 'Endüstriyel' },
    { value: 'classic', label: 'Klasik' },
    { value: 'tech', label: 'Teknolojik' },
    { value: 'elegant', label: 'Şık/Zarif' },
    { value: 'creative', label: 'Yaratıcı' },
    { value: 'corporate', label: 'Kurumsal' }
  ];

  const serviceOptions = [
    { value: 'design', label: '3D Tasarım' },
    { value: 'construction', label: 'İnşaat/Montaj' },
    { value: 'graphics', label: 'Grafik Tasarım' },
    { value: 'lighting', label: 'Aydınlatma' },
    { value: 'av-equipment', label: 'AV Ekipmanları' },
    { value: 'furniture', label: 'Mobilya' },
    { value: 'flooring', label: 'Zemin Kaplama' },
    { value: 'storage', label: 'Depolama' },
    { value: 'catering', label: 'İkram/Catering' },
    { value: 'transport', label: 'Nakliye' },
    { value: 'installation', label: 'Kurulum Hizmeti' },
    { value: 'dismantling', label: 'Söküm Hizmeti' }
  ];

  const budgetRanges = [
    { value: '0-25k', label: '0 - 25.000 TL' },
    { value: '25k-50k', label: '25.000 - 50.000 TL' },
    { value: '50k-100k', label: '50.000 - 100.000 TL' },
    { value: '100k-250k', label: '100.000 - 250.000 TL' },
    { value: '250k-500k', label: '250.000 - 500.000 TL' },
    { value: '500k+', label: '500.000 TL+' },
    { value: 'custom', label: 'Özel Bütçe' }
  ];

  const priorities = [
    { value: 'low', label: 'Düşük', color: 'bg-gray-100 text-gray-700' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'Yüksek', color: 'bg-orange-100 text-orange-700' },
    { value: 'urgent', label: 'Acil', color: 'bg-red-100 text-red-700' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleProjectSelection = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
    
    if (project) {
      // Calculate duration in days
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      
      setFormData(prev => ({
        ...prev,
        projectId: projectId,
        eventName: project.name,
        eventDate: project.startDate,
        eventCity: project.city,
        eventCountry: project.country,
        eventDuration: diffDays.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        projectId: projectId,
        eventName: '',
        eventDate: '',
        eventCity: '',
        eventCountry: '',
        eventDuration: ''
      }));
    }
  };
  // Enhanced person selection handler with phone and email auto-fill
  const handlePersonSelectionChange = (personId) => {
    setSelectedPersonId(personId);
    
    if (personId === 'customer-default' && selectedCustomer) {
      // Fill with customer default info
      handleInputChange('contactPerson', selectedCustomer.contactPerson || '');
      handleInputChange('email', selectedCustomer.email || '');
      handleInputChange('phone', selectedCustomer.phone || '');
    } else if (personId) {
      // Fill with related person info
      const person = relatedPeople.find(p => p.id.toString() === personId);
      if (person) {
        handleInputChange('contactPerson', `${person.first_name} ${person.last_name}`);
        handleInputChange('email', person.email || '');
        handleInputChange('phone', person.phone || '');
      }
    }
  };

  // Step navigation handlers
  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepDataChange = (field, value) => {
    setStepData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Enhanced element handlers for nested selections
  const handleElementToggle = (elementKey) => {
    setStepData(prev => ({
      ...prev,
      standElements: {
        ...prev.standElements,
        [elementKey]: prev.standElements[elementKey] ? null : {}
      }
    }));
  };

  const handleSubOptionToggle = (elementKey, subOptionKey, subSubOptionKey = null) => {
    setStepData(prev => {
      const newElements = { ...prev.standElements };
      
      if (!newElements[elementKey]) {
        newElements[elementKey] = {};
      }

      if (subSubOptionKey) {
        // Third level selection
        if (!newElements[elementKey][subOptionKey]) {
          newElements[elementKey][subOptionKey] = {};
        }
        newElements[elementKey][subOptionKey][subSubOptionKey] = 
          !newElements[elementKey][subOptionKey][subSubOptionKey];
      } else {
        // Second level selection - if has sub-options, initialize as object, else boolean
        const hasSubOptions = standElementsConfig[elementKey]?.subOptions[subOptionKey]?.subOptions;
        if (hasSubOptions) {
          // If it has sub-options, toggle selection but keep it expanded
          const currentState = newElements[elementKey][subOptionKey];
          if (!currentState || typeof currentState === 'boolean') {
            newElements[elementKey][subOptionKey] = { _selected: true };
          } else {
            newElements[elementKey][subOptionKey] = currentState._selected ? null : { _selected: true };
          }
        } else {
          // Simple boolean toggle for options without sub-options
          newElements[elementKey][subOptionKey] = !newElements[elementKey][subOptionKey];
        }
      }

      return {
        ...prev,
        standElements: newElements
      };
    });
  };

  const isElementSelected = (elementKey) => {
    return !!stepData.standElements[elementKey];
  };

  const isSubOptionSelected = (elementKey, subOptionKey, subSubOptionKey = null) => {
    if (!stepData.standElements[elementKey]) return false;
    
    if (subSubOptionKey) {
      return !!stepData.standElements[elementKey][subOptionKey]?.[subSubOptionKey];
    }
    
    const selection = stepData.standElements[elementKey][subOptionKey];
    if (typeof selection === 'boolean') return selection;
    if (typeof selection === 'object' && selection !== null) return selection._selected || false;
    return false;
  };

  const hasRequiredSelections = (elementKey) => {
    const element = stepData.standElements[elementKey];
    if (!element) return false;
    
    const config = standElementsConfig[elementKey];
    if (!config?.required) return true;
    
    // Check if at least one sub-option is selected
    return Object.keys(element).some(key => element[key] === true || 
      (typeof element[key] === 'object' && Object.values(element[key]).some(val => val === true))
    );
  };

  const canProceedFromStep2 = () => {
    // Check if all selected required elements have valid selections
    return Object.keys(stepData.standElements).every(elementKey => {
      const element = stepData.standElements[elementKey];
      if (!element) return true; // Not selected, so OK
      
      const config = standElementsConfig[elementKey];
      if (!config?.required) return true; // Not required, so OK
      
      return hasRequiredSelections(elementKey);
    });
  };

  const handleStepFileUpload = (field, files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      file: file
    }));
    
    setStepData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), ...newFiles]
    }));
  };

  const removeStepFile = (field, fileId) => {
    setStepData(prev => ({
      ...prev,
      [field]: prev[field].filter(f => f.id !== fileId)
    }));
  };

  const handleFileUpload = async (field, files) => {
    setUploadingSections(prev => ({ ...prev, [field]: true }));
    
    // Simulate file upload process
    try {
      const uploadedFiles = Array.from(files).map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }));

      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], ...uploadedFiles]
      }));
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setTimeout(() => {
        setUploadingSections(prev => ({ ...prev, [field]: false }));
      }, 1000);
    }
  };

  const removeFile = (field, fileId) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(file => file.id !== fileId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.projectId || !formData.customerId || !formData.contactPerson.trim()) {
      alert('Lütfen zorunlu alanları doldurun: Proje, Müşteri, Yetkili Kişi');
      return;
    }

    // Create brief object with customer data
    const customer = customers.find(c => c.id.toString() === formData.customerId);
    const newBrief = {
      id: Date.now(),
      ...formData,
      clientCompany: customer ? customer.companyName : '', // Add company name for compatibility
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage for now
    const existingBriefs = JSON.parse(localStorage.getItem('briefs') || '[]');
    existingBriefs.unshift(newBrief);
    localStorage.setItem('briefs', JSON.stringify(existingBriefs));

    console.log('New brief saved:', newBrief);
    alert('Brief başarıyla oluşturuldu!');
    
    // Reset form
    setFormData({
      customerId: '',
      contactPerson: '',
      email: '',
      phone: '',
      projectId: '',
      eventName: '',
      eventLocation: '',
      eventDate: '',
      eventCity: '',
      eventCountry: '',
      conventionCenter: '',
      eventDuration: '',
      standArea: '',
      standType: '',
      closedSides: '',
      standHeight: '',
      designStyle: '',
      colorPreferences: [],
      brandColors: '',
      services: [],
      budgetRange: '',
      specialRequirements: '',
      targetAudience: '',
      objectives: '',
      logoFiles: [],
      referenceImages: [],
      brandGuidelines: [],
      priority: 'normal',
      deadline: ''
    });
    setSelectedCustomer(null);
    setRelatedPeople([]);
    setSelectedPersonId('');
    setSelectedProject(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onBackToDashboard}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Geri Dön</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Brief Oluştur</h1>
            <p className="text-gray-600 mt-1">Stand tasarımı için detaylı brief formu</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2"
          >
            {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showAdvanced ? 'Basit Görünüm' : 'Detaylı Görünüm'}</span>
          </Button>
        </div>
      </div>

      {/* Country Profile Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Ülke Profili</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brief formu hangi ülke için hazırlanacak?
              </label>
              <div className="flex space-x-2">
                {countryProfiles
                  .sort((a, b) => {
                    // Custom sorting: Amerika first, Türkiye second, Avrupa third, Diğer last
                    const order = { 'US': 1, 'TR': 2, 'DE': 3, 'OTHER': 4 };
                    return (order[a.code] || 999) - (order[b.code] || 999);
                  })
                  .map((profile) => (
                    <button
                      key={profile.code}
                      onClick={() => setSelectedCountryProfile(profile.code)}
                      className={`px-6 py-3 rounded-lg font-medium transition-all ${
                        selectedCountryProfile === profile.code
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {profile.name}
                    </button>
                  ))}
              </div>
            </div>
            
            {/* +Yeni Ülke Button (Only for admin/super_admin) */}
            {(userRole === 'admin' || userRole === 'super_admin') && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsNewCountryModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Yeni Ülke</span>
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Project Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Proje Bilgileri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Selection - Moved to Top */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proje Seçimi *
              </label>
              <Select value={formData.projectId} onValueChange={(value) => handleProjectSelection(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <span className="font-medium">{project.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProject && (
                <div className="mt-2 text-sm text-gray-600 bg-green-50 p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span><strong>{selectedProject.name}</strong> - {selectedProject.city}, {selectedProject.country}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedProject.startDate} • {selectedProject.endDate}
                  </div>
                </div>
              )}
            </div>

            {/* Basic Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri *
                </label>
                <Select value={formData.customerId} onValueChange={(value) => handleInputChange('customerId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        <span className="font-medium">{customer.companyName}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCustomer && (
                  <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span>{selectedCustomer.companyName}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedCustomer.sector} • {selectedCustomer.country}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yetkili Kişi *
                </label>
                
                {selectedCustomer && (relatedPeople.length > 0 || selectedCustomer.contactPerson) ? (
                  <div className="space-y-3">
                    {/* Person Selection Dropdown */}
                    <Select value={selectedPersonId} onValueChange={handlePersonSelectionChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Yetkili kişi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Default customer contact */}
                        {selectedCustomer.contactPerson && (
                          <SelectItem value="customer-default">
                            <div className="flex flex-col">
                              <span className="font-medium">{selectedCustomer.contactPerson}</span>
                              <span className="text-xs text-gray-500">Varsayılan İletişim (Müşteri Kaydı)</span>
                            </div>
                          </SelectItem>
                        )}
                        
                        {/* Related people */}
                        {relatedPeople.map(person => (
                          <SelectItem key={person.id} value={person.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{person.first_name} {person.last_name}</span>
                              <span className="text-xs text-gray-500">{person.job_title}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Hidden input for form compatibility */}
                    <Input
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      className="hidden"
                      required
                    />
                  </div>
                ) : (
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    placeholder="Ad Soyad"
                    required
                  />
                )}
                
                {relatedPeople.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                    ✨ Bu müşteriye bağlı {relatedPeople.length} kişi bulundu
                  </p>
                )}
                {selectedCustomer && relatedPeople.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Bu müşteri için kayıtlı ek kişi bulunamadı, varsayılan iletişim bilgileri kullanılacak
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+90 555 123 45 67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="ornek@email.com"
                  disabled={!!selectedPersonId}
                  className={selectedPersonId ? 'bg-gray-50' : ''}
                  required
                />
                {selectedPersonId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Seçilen kişiden otomatik dolduruldu
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+90 555 123 45 67"
                  disabled={!!selectedPersonId}
                  className={selectedPersonId ? 'bg-gray-50' : ''}
                />
                {selectedPersonId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Seçilen kişiden otomatik dolduruldu
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Öncelik Seviyesi
                </label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Öncelik seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <span className={`px-2 py-1 rounded-full text-xs ${priority.color}`}>
                          {priority.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact Person Details Section */}
            {selectedPersonId && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Yetkili Kişi Detayları</h4>
                <div className="bg-green-50 p-4 rounded-lg">
                  {selectedPersonId === 'customer-default' ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-lg">{selectedCustomer.contactPerson}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">E-posta:</span>
                          <p className="text-gray-600">{selectedCustomer.email || 'Bilgi yok'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Telefon:</span>
                          <p className="text-gray-600">{selectedCustomer.phone || 'Bilgi yok'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700">Adres:</span>
                          <p className="text-gray-600">{selectedCustomer.address || selectedCustomer.city || 'Adres bilgisi yok'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const person = relatedPeople.find(p => p.id.toString() === selectedPersonId);
                      return person ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-lg">{person.first_name} {person.last_name}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Pozisyon:</span>
                              <p className="text-gray-600">{person.job_title || 'Belirtilmemiş'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">İlişki Türü:</span>
                              <p className="text-gray-600">{person.relationship_type || 'Belirtilmemiş'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">E-posta:</span>
                              <p className="text-gray-600">{person.email || 'Bilgi yok'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Telefon:</span>
                              <p className="text-gray-600">{person.phone || 'Bilgi yok'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-700">Adres:</span>
                              <p className="text-gray-600">{person.address || person.city || 'Adres bilgisi yok'}</p>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()
                  )}
                </div>
              </div>
            )}

            {/* Event Information Section - Auto-filled from Project Selection */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Fuar/Etkinlik Bilgileri</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuar Adı
                </label>
                <Input
                  value={formData.eventName}
                  onChange={(e) => handleInputChange('eventName', e.target.value)}
                  placeholder="Örn: CeBIT Turkey, Mobile World Congress"
                  disabled={!!selectedProject}
                  className={selectedProject ? 'bg-gray-50' : ''}
                />
                {selectedProject && (
                  <p className="text-xs text-gray-500 mt-1">
                    Seçilen projeden otomatik dolduruldu
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarihi
                </label>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleInputChange('eventDate', e.target.value)}
                  disabled={!!selectedProject}
                  className={selectedProject ? 'bg-gray-50' : ''}
                />
                {selectedProject && (
                  <p className="text-xs text-gray-500 mt-1">
                    Seçilen projeden otomatik dolduruldu
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Convention Center
                </label>
                <Input
                  value={formData.conventionCenter}
                  onChange={(e) => handleInputChange('conventionCenter', e.target.value)}
                  placeholder="Örn: İstanbul Fuar Merkezi, CNR Expo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şehir
                </label>
                <Input
                  value={formData.eventCity}
                  onChange={(e) => handleInputChange('eventCity', e.target.value)}
                  placeholder="Örn: İstanbul"
                  disabled={!!selectedProject}
                  className={selectedProject ? 'bg-gray-50' : ''}
                />
                {selectedProject && (
                  <p className="text-xs text-gray-500 mt-1">
                    Seçilen projeden otomatik dolduruldu
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ülke
                </label>
                <Input
                  value={formData.eventCountry}
                  onChange={(e) => handleInputChange('eventCountry', e.target.value)}
                  placeholder="Örn: Türkiye"
                  disabled={!!selectedProject}
                  className={selectedProject ? 'bg-gray-50' : ''}
                />
                {selectedProject && (
                  <p className="text-xs text-gray-500 mt-1">
                    Seçilen projeden otomatik dolduruldu
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gün Sayısı
                </label>
                <Input
                  type="number"
                  value={formData.eventDuration}
                  onChange={(e) => handleInputChange('eventDuration', e.target.value)}
                  placeholder="3"
                  min="1"
                />
              </div>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Stand Requirements Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Ruler className="h-5 w-5" />
              <span>Stand Gereksinimleri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alan (m²)
                </label>
                <Input
                  type="number"
                  value={formData.standArea}
                  onChange={(e) => handleInputChange('standArea', e.target.value)}
                  placeholder="36"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stand Tipi
                </label>
                <Select value={formData.standType} onValueChange={(value) => handleInputChange('standType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stand tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {standTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kapalı Kenar Sayısı
                </label>
                <Input
                  type="number"
                  value={formData.closedSides}
                  onChange={(e) => handleInputChange('closedSides', e.target.value)}
                  placeholder="2"
                  min="0"
                  max="4"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yükseklik (m)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.standHeight}
                  onChange={(e) => handleInputChange('standHeight', e.target.value)}
                  placeholder="2.5"
                  min="1"
                />
              </div>
            </div>
            
            {/* Continue Button */}
            <div className="mt-8 pt-6 border-t">
              <div className="text-center">
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  Detaylı Stand İhtiyaçları →
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Standınızın tüm detaylarını belirlemek için devam edin
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Multi-Step Stand Requirements */}
        {currentStep > 1 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Stand Detayları - {currentStep}/5</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`w-3 h-3 rounded-full ${
                        step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-2">Standınızda hangi elementlere ihtiyacınız var?</h3>
                    <p className="text-gray-600">Dropdown'lardan seçimlerinizi yapın</p>
                  </div>
                  
                  {/* Cascading Dropdowns */}
                  <div className="space-y-4">
                    {/* Level 1: Main Elements */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        1. Ana Element Seçin *
                      </label>
                      <Select 
                        value={stepData.selectedElement || ''} 
                        onValueChange={(value) => handleCascadeSelection('element', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Element seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(standElementsConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                              {config.required && <span className="text-orange-600 ml-2">*</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Level 2: Sub Options */}
                    {stepData.selectedElement && standElementsConfig[stepData.selectedElement]?.subOptions && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          2. {standElementsConfig[stepData.selectedElement].label} Türü Seçin
                        </label>
                        <Select 
                          value={stepData.selectedSubOption || ''} 
                          onValueChange={(value) => handleCascadeSelection('subOption', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`${standElementsConfig[stepData.selectedElement].label} türü seçin`} />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(standElementsConfig[stepData.selectedElement].subOptions).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Level 3: Sub-Sub Options */}
                    {stepData.selectedElement && 
                     stepData.selectedSubOption && 
                     standElementsConfig[stepData.selectedElement]?.subOptions[stepData.selectedSubOption]?.subOptions && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          3. {standElementsConfig[stepData.selectedElement].subOptions[stepData.selectedSubOption].label} Detayı Seçin
                        </label>
                        <Select 
                          value={stepData.selectedSubSubOption || ''} 
                          onValueChange={(value) => handleCascadeSelection('subSubOption', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Detay seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(standElementsConfig[stepData.selectedElement].subOptions[stepData.selectedSubOption].subOptions).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Add Selection Button */}
                    {stepData.selectedElement && stepData.selectedSubOption && (
                      <div className="pt-4">
                        <Button
                          type="button"
                          onClick={addSelectionToList}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Seçimi Ekle
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Selected Items List */}
                  {stepData.selectedItems && stepData.selectedItems.length > 0 && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-4">Seçilen Elementler:</h4>
                      <div className="space-y-2">
                        {stepData.selectedItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                            <div>
                              <span className="font-medium">{item.elementLabel}</span>
                              {item.subOptionLabel && (
                                <span className="text-gray-600"> → {item.subOptionLabel}</span>
                              )}
                              {item.subSubOptionLabel && (
                                <span className="text-gray-600"> → {item.subSubOptionLabel}</span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSelectionFromList(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-2">Etkinlik sırasında stantta kaç çalışan bulunacak?</h3>
                    <p className="text-gray-600">
                      Stantta görev yapacak çalışanların sayısını ve pozisyonlarını belirtin. 
                      Bu bilgi standın tasarımı için önemlidir.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Örnek:</strong> manager + 3 sales person + hostesses
                      </p>
                    </div>
                  </div>
                  
                  <div className="max-w-2xl mx-auto">
                    <Textarea
                      value={stepData.employeeDetails}
                      onChange={(e) => handleStepDataChange('employeeDetails', e.target.value)}
                      placeholder="Çalışan sayısı ve pozisyonlarını yazın..."
                      rows={6}
                      className="w-full text-center"
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-2">Satın alma kararınızda fiyat ne kadar önemli?</h3>
                    <p className="text-gray-600">
                      Fiyat ve tasarım aynı paranın iki yüzüdür. Daha büyük bir bütçe, 
                      tasarıma ve standı inşa etmek için kullanılan malzemelere daha fazla yatırım anlamına gelir.
                      Her bir unsurun ne kadar önemli olduğunu belirtin.
                    </p>
                  </div>
                  
                  <div className="max-w-2xl mx-auto space-y-8">
                    <div>
                      <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>Minimum</span>
                        <span>Düşük</span>
                        <span>Orta</span>
                        <span>Yüksek</span>
                        <span>Maksimum</span>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-lg font-medium mb-4">Fiyat</label>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={stepData.priceImportance}
                            onChange={(e) => handleStepDataChange('priceImportance', parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-lg font-medium mb-4">Tasarım</label>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={stepData.designImportance}
                            onChange={(e) => handleStepDataChange('designImportance', parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-2">
                      Standınızın nasıl olması gerektiği konusunda bir tasarım, fikir veya konsept eklemek ister misiniz?
                    </h3>
                    <p className="text-gray-600">
                      Bu, aklınızda neyin olduğunu daha iyi anlamamıza yardımcı olacaktır.
                    </p>
                  </div>
                  
                  <div className="max-w-2xl mx-auto">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                      <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                      <h4 className="text-lg font-medium mb-2">Kendi tasarımınızı yükleyin</h4>
                      <p className="text-gray-600 mb-4">
                        PDF, JPG, CAD veya ZIP dosyalarını kabul ediyoruz (Dosya başına maksimum 100 MB)
                      </p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.cad,.zip"
                        onChange={(e) => handleStepFileUpload('designFiles', e.target.files)}
                        className="hidden"
                        id="design-upload"
                      />
                      <label htmlFor="design-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" className="mb-4">
                          Dosya Seç
                        </Button>
                      </label>
                      
                      {stepData.designFiles && stepData.designFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {stepData.designFiles.map(file => (
                            <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStepFile('designFiles', file.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={currentStep <= 1}
                  className="flex items-center space-x-2"
                >
                  <span>← Önceki</span>
                </Button>
                
                <Button
                  type="button"
                  onClick={currentStep === 5 ? () => setCurrentStep(1) : handleNextStep}
                  disabled={currentStep === 2 && !canProceedFromStep2()}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <span>{currentStep === 5 ? 'Tamamla' : 'Sonraki →'}</span>
                </Button>
              </div>
              
              {/* Validation Message for Step 2 */}
              {currentStep === 2 && !canProceedFromStep2() && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Dikkat:</strong> Seçtiğiniz zorunlu elementler için alt seçenekleri tamamlamalısınız.
                    {Object.entries(stepData.standElements).map(([elementKey, selections]) => {
                      const config = standElementsConfig[elementKey];
                      if (selections && config?.required && !hasRequiredSelections(elementKey)) {
                        return (
                          <span key={elementKey} className="block mt-1">
                            • <strong>{config.label}</strong> için en az bir seçenek belirtmelisiniz
                          </span>
                        );
                      }
                      return null;
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Design Preferences Card - Show only in advanced mode */}
        {showAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5" />
                <span>Tasarım Tercihleri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasarım Stili
                  </label>
                  <Select value={formData.designStyle} onValueChange={(value) => handleInputChange('designStyle', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Stil seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {designStyles.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marka Renkleri
                  </label>
                  <Input
                    value={formData.brandColors}
                    onChange={(e) => handleInputChange('brandColors', e.target.value)}
                    placeholder="Örn: #FF0000, Kırmızı, Mavi"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  İhtiyaç Duyulan Hizmetler
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {serviceOptions.map(service => (
                    <label key={service.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service.value)}
                        onChange={() => handleMultiSelect('services', service.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{service.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budget and Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Bütçe ve Gereksinimler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bütçe Aralığı
                </label>
                <Select value={formData.budgetRange} onValueChange={(value) => handleInputChange('budgetRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bütçe seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Son Teslim Tarihi
                </label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Özel Gereksinimler
                </label>
                <Textarea
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  placeholder="Özel talep, kısıtlama veya gereksinimler..."
                  rows={3}
                />
              </div>
              
              {showAdvanced && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hedef Kitle
                    </label>
                    <Textarea
                      value={formData.targetAudience}
                      onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                      placeholder="Stantta hedeflenen ziyaretçi profili..."
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Standın Hedefleri
                    </label>
                    <Textarea
                      value={formData.objectives}
                      onChange={(e) => handleInputChange('objectives', e.target.value)}
                      placeholder="Standla ulaşılmak istenen amaçlar..."
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Upload Section - Show only in advanced mode */}
        {showAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Dosyalar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Files */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Logo Dosyaları
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.ai,.eps"
                    onChange={(e) => handleFileUpload('logoFiles', e.target.files)}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Logo dosyalarını seçin veya sürükleyin
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF, AI, EPS</p>
                    </div>
                  </label>
                  
                  {formData.logoFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.logoFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile('logoFiles', file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reference Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Referans Görselleri
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload('referenceImages', e.target.files)}
                    className="hidden"
                    id="reference-upload"
                  />
                  <label htmlFor="reference-upload" className="cursor-pointer">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Referans görsellerini seçin
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                    </div>
                  </label>
                  
                  {formData.referenceImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {formData.referenceImages.map(file => (
                        <div key={file.id} className="relative">
                          <img 
                            src={file.url} 
                            alt={file.name}
                            className="w-full h-20 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 h-6 w-6"
                            onClick={() => removeFile('referenceImages', file.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onBackToDashboard}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>İptal</span>
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Save as draft
                const draftBrief = {
                  ...formData,
                  id: Date.now(),
                  status: 'draft',
                  createdAt: new Date().toISOString()
                };
                
                const customer = customers.find(c => c.id.toString() === formData.customerId);
                if (customer) {
                  draftBrief.clientCompany = customer.companyName;
                }
                
                const drafts = JSON.parse(localStorage.getItem('briefDrafts') || '[]');
                drafts.unshift(draftBrief);
                localStorage.setItem('briefDrafts', JSON.stringify(drafts));
                
                alert('Brief taslak olarak kaydedildi!');
              }}
            >
              Taslak Kaydet
            </Button>
            
            <Button
              type="submit"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              <span>Brief Oluştur</span>
            </Button>
          </div>
        </div>
      </form>

      {/* New Country Modal */}
      {isNewCountryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Yeni Ülke Profili Ekle</h3>
              <button
                onClick={() => setIsNewCountryModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <NewCountryProfileForm 
              onSuccess={() => {
                setIsNewCountryModalOpen(false);
                // Reload country profiles
                fetchCountryProfiles();
              }}
              onCancel={() => setIsNewCountryModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// New Country Profile Form Component  
function NewCountryProfileForm({ onSuccess, onCancel }) {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    currency: 'USD',
    phone_code: '+1',
    date_format: 'MM/DD/YYYY',
    tax_name: 'Tax',
    tax_rate: 0
  });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/country-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          name: formData.name,
          currency: formData.currency,
          phone_code: formData.phone_code,
          date_format: formData.date_format,
          tax_config: {
            tax_name: formData.tax_name,
            rate: formData.tax_rate / 100
          },
          locales: ['en_US'],
          address_format: { format: 'street,city,country' },
          form_config: {
            fields: {},
            sections: [],
            validation_rules: {},
            conditional_logic: [],
            field_order: []
          }
        }),
      });
      
      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert('Hata: ' + (error.detail || 'Ülke profili oluşturulamadı'));
      }
    } catch (error) {
      console.error('Error creating country profile:', error);
      alert('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ülke Kodu (ISO-2)
        </label>
        <Input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
          placeholder="Örn: DE, FR, IT"
          maxLength={2}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ülke Adı
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Örn: Almanya, Fransa, İtalya"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Para Birimi
          </label>
          <Input
            type="text"
            value={formData.currency}
            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
            placeholder="EUR, GBP, JPY"
            maxLength={3}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon Kodu
          </label>
          <Input
            type="text"
            value={formData.phone_code}
            onChange={(e) => setFormData(prev => ({ ...prev, phone_code: e.target.value }))}
            placeholder="+49, +33, +39"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tarih Formatı
        </label>
        <Select value={formData.date_format} onValueChange={(value) => setFormData(prev => ({ ...prev, date_format: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (Amerika)</SelectItem>
            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (Türkiye/Avrupa)</SelectItem>
            <SelectItem value="DD.MM.YYYY">DD.MM.YYYY (Almanya)</SelectItem>
            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vergi Adı
          </label>
          <Input
            type="text"
            value={formData.tax_name}
            onChange={(e) => setFormData(prev => ({ ...prev, tax_name: e.target.value }))}
            placeholder="KDV, VAT, Sales Tax"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vergi Oranı (%)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.tax_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
            placeholder="18.00"
            required
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Oluşturuluyor...' : 'Oluştur'}
        </Button>
      </div>
    </form>
  );
}