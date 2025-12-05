import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import VitingoPhoneInput from '../ui/SupplierPhone';
// import { allCustomers } from '../../mock/customersData'; // Removed - using real API
import { allPeople } from '../../mock/peopleData';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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
  User,
  GripVertical
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

  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
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

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

// Color options for dropdown
const getColorOptions = () => [
  'Kırmızı',
  'Bordo', 
  'Turuncu',
  'Sarı',
  'Altın Sarısı',
  'Yeşil',
  'Koyu Yeşil',
  'Nane Yeşili',
  'Zeytin Yeşili',
  'Mavi',
  'Açık Mavi',
  'Lacivert',
  'Teal',
  'Mor',
  'İndigo',
  'Lila',
  'Pembe',
  'Siyah',
  'Koyu Gri',
  'Gri',
  'Açık Gri',
  'Beyaz',
  'Krem',
  'Kahverengi',
  'Koyu Kahve',
  'Açık Kahve'
];

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
    // Brief ID for tracking
    briefId: `brief_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    
    // Stand Elements - Recursive Selection State
    currentPath: [], // Array of selected keys for current path
    selectedItems: [], // Array of complete selections
    standElements: {}, // For backward compatibility
    features: {}, // Features added to specific paths { "flooring.raised36mm": [{ name: "Renk", value: "Kırmızı", type: "text" }] }
    
    // Stand Dimensions (Step 2)
    standWidth: '',  // Stand Eni (cm)
    standLength: '', // Stand Boyu (cm)
    calculatedArea: 0, // Otomatik hesaplanan alan (m²)
    
    // Other step data
    employeeCount: '',
    employeeDetails: '',
    priceImportance: 3,
    designImportance: 3,
    designFiles: [],
    
    // Budget and Requirements (Step 7)
    budgetRange: '',
    deadline: '',
    customRequirements: '',
    
    // Brief File (Step 6)
    briefFile: null
  });

  // Stand elements configuration - loaded dynamically from API
  const [standElementsConfig, setStandElementsConfig] = useState({});
  
  // Dimension validation errors
  const [dimensionErrors, setDimensionErrors] = useState({
    width: '',
    length: ''
  });

  // Global Turkish Number Formatting Functions
  const formatTurkishNumber = (value, decimalPlaces = 2) => {
    if (!value || value === '') return '';
    
    // Convert to number and handle decimals
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    if (isNaN(numValue)) return '';
    
    // Format with Turkish locale
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(numValue);
  };

  const parseTurkishNumber = (formattedValue) => {
    if (!formattedValue) return '';
    
    // Remove thousand separators (dots) and replace comma with dot for decimal
    return formattedValue
      .replace(/\./g, '')  // Remove thousand separators
      .replace(/,/g, '.');  // Replace decimal comma with dot
  };

  const validateTurkishNumber = (value, fieldName, options = {}) => {
    const { required = false, min = 0, max = Infinity, maxDecimals = 2 } = options;
    
    // console.log('🔍 Validating Turkish number:', value, 'for field:', fieldName);
    
    if (!value || value.trim() === '') {
      return required ? "Bu alan zorunludur" : "";
    }
    
    // Simple validation - just check if it contains only numbers, comma, and dot
    const simplePattern = /^[0-9,\.]+$/;
    
    if (!simplePattern.test(value)) {
      return `Lütfen sadece rakam giriniz.`;
    }
    
    return ""; // No error
  };
  const [isAddElementModalOpen, setIsAddElementModalOpen] = useState(false);
  const [isManageElementsModalOpen, setIsManageElementsModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [featureModalData, setFeatureModalData] = useState({
    level: 0,
    currentPath: [],
    featureName: '',
    featureValue: '',
    featureType: 'text' // 'text', 'select', 'number'
  });
  
  // Form input states
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  
  // Service selection states
  const [selectedServices, setSelectedServices] = useState({});
  const [serviceDetails, setServiceDetails] = useState({});
  
  // Mail modal states
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [mailData, setMailData] = useState({
    toEmail: '',
    subject: `Stand Brief - ${stepData.briefId}`,
    message: ''
  });

  // Final success modal state
  const [isFinalSuccessModalOpen, setIsFinalSuccessModalOpen] = useState(false);
  
  // AI Design Generation states removed
  const [newCategoryData, setNewCategoryData] = useState({
    label: '',
    parentPath: null, // Will be set when button is clicked
    editMode: false,  // Whether we're editing an existing element
    editKey: null,    // The key of the element being edited
    editPathString: null // The full path string for edit
  });
  const [elementModalData, setElementModalData] = useState({
    parentKey: null,
    parentSubKey: null,
    level: 'main', // main, sub, subSub
    editMode: false,
    editData: null
  });
  
  // Professional Modal & Toast System
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [toastMessage, setToastMessage] = useState({
    isVisible: false,
    type: 'success', // success, error, warning, info
    title: '',
    message: ''
  });

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
  const [userRole, setUserRole] = useState('admin'); // TODO: Get from auth context

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
          console.log('✅ Customers loaded from API:', customersData.length);
        } else {
          console.error('❌ Failed to fetch customers, status:', response.status);
          setCustomers([]);
        }
      } catch (error) {
        console.error('❌ Error fetching customers:', error);
        setCustomers([]);
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

    // Load stand elements configuration from backend API
    const fetchStandElements = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/stand-elements`);
        if (response.ok) {
          const elementsData = await response.json();
          setStandElementsConfig(elementsData);
          console.log('Stand elements loaded from database:', Object.keys(elementsData).length);
        } else {
          console.error('Failed to fetch stand elements');
        }
      } catch (error) {
        console.error('Error fetching stand elements:', error);
      }
    };

    fetchCustomers();
    fetchProjects();
    fetchCountryProfiles();
    fetchFormSchema(selectedCountryProfile);
    fetchStandElements();
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

  // AI generation useEffect removed

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
    if (currentStep < 8) {
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

  // Removed old handlers - replaced with cascade dropdown system

  // Recursive dropdown handler
  const handleRecursiveSelection = (level, value) => {
    console.log(`DEBUG handleRecursiveSelection - Level: ${level}, Value: ${value}`);
    setStepData(prev => {
      const newPath = [...prev.currentPath];
      
      // Truncate path to current level and add new selection
      newPath.length = level;
      newPath[level] = value;
      
      console.log(`DEBUG handleRecursiveSelection - New currentPath:`, newPath);
      
      return {
        ...prev,
        currentPath: newPath
      };
    });
  };

  // Get current node based on path
  const getCurrentNode = (path = stepData.currentPath) => {
    let currentNode = standElementsConfig;
    
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      if (i === 0) {
        // First level - main element
        currentNode = currentNode[key]?.structure || {};
      } else {
        // Nested levels - follow children
        currentNode = currentNode[key]?.children || {};
      }
    }
    
    return currentNode;
  };

  // Get readable path for display
  const getPathLabels = (path) => {
    const labels = [];
    let currentNode = standElementsConfig;
    
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      let label = '';
      
      if (i === 0) {
        // First level - main element
        label = currentNode[key]?.label || key;
        currentNode = currentNode[key]?.structure || {};
      } else {
        // Nested levels - follow children
        label = currentNode[key]?.label || key;
        currentNode = currentNode[key]?.children || {};
      }
      
      labels.push(label);
    }
    
    return labels;
  };

  const addSelectionToList = () => {
    if (stepData.currentPath.length === 0) return;
    
    const pathLabels = getPathLabels(stepData.currentPath);
    const pathString = pathLabels.join(' → ');
    
    const newItem = {
      path: [...stepData.currentPath],
      pathLabels,
      pathString,
      timestamp: Date.now(),
      // Miktar ve renk bilgilerini ekle
      quantity: selectedQuantity || '',
      unit: selectedUnit || '',
      color: selectedColor || ''
    };
    
    setStepData(prev => ({
      ...prev,
      selectedItems: [...(prev.selectedItems || []), newItem],
      currentPath: []
    }));
    
    // Input'ları temizle
    setSelectedQuantity('');
    setSelectedUnit('');
    setSelectedColor('');
  };

  const removeSelectionFromList = (index) => {
    setStepData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter((_, i) => i !== index)
    }));
  };

  // AI Design Generation Function removed

  // Refresh Stand Elements
  const refreshStandElements = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stand-elements`);
      if (response.ok) {
        const elementsData = await response.json();
        setStandElementsConfig(elementsData);
        console.log('Stand elements refreshed:', Object.keys(elementsData).length, 'elements');
      }
    } catch (error) {
      console.error('Error refreshing stand elements:', error);
    }
  };

  // Check for duplicate category names in the same parent
  const checkForDuplicate = (newLabel, parentPath) => {
    try {
      if (!standElementsConfig || Object.keys(standElementsConfig).length === 0) {
        return false;
      }

      const normalizeLabel = (label) => label.toLowerCase().trim();
      const newLabelNormalized = normalizeLabel(newLabel);

      if (!parentPath) {
        // Checking in main elements
        const mainLabels = Object.values(standElementsConfig).map(element => normalizeLabel(element.label));
        return mainLabels.includes(newLabelNormalized);
      }

      // Navigate to the parent category
      const pathParts = parentPath.split('.');
      let currentNode = standElementsConfig;
      
      // Navigate through the path
      for (let i = 0; i < pathParts.length; i++) {
        const key = pathParts[i];
        if (i === 0) {
          // First level - main element
          currentNode = currentNode[key];
          if (!currentNode) return false;
          currentNode = currentNode.structure || {};
        } else {
          // Nested levels - follow children
          currentNode = currentNode[key];
          if (!currentNode) return false;
          currentNode = currentNode.children || {};
        }
      }

      // Check if the new label already exists in current level
      const existingLabels = Object.values(currentNode).map(element => 
        element.label ? normalizeLabel(element.label) : null
      ).filter(Boolean);
      
      return existingLabels.includes(newLabelNormalized);
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false; // In case of error, allow addition but log the error
    }
  };

  // New Category or Edit Category Handler
  const handleAddNewCategory = async () => {
    try {
      if (!newCategoryData.label.trim()) {
        showToast('error', 'Hata!', 'Kategori adı gereklidir.');
        return;
      }

      // Check for duplicate names in the same parent category (only for new additions)
      if (!newCategoryData.editMode) {
        const isDuplicate = checkForDuplicate(newCategoryData.label, newCategoryData.parentPath);
        if (isDuplicate) {
          showToast('error', 'Hata!', `"${newCategoryData.label}" kategorisi zaten mevcut. Farklı bir isim kullanın.`);
          return;
        }
      }

      if (newCategoryData.editMode) {
        // Edit existing category
        const categoryData = {
          key: newCategoryData.editKey,
          label: newCategoryData.label,
          element_type: 'option',
          input_type: 'text',
          parent_path: newCategoryData.parentPath
        };

        console.log('Editing category:', categoryData);

        const response = await fetch(`${BACKEND_URL}/api/stand-elements/${newCategoryData.editKey}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });

        if (response.ok) {
          const result = await response.json();
          showToast('success', 'Başarılı!', `${newCategoryData.label} kategorisi güncellendi.`);
          
          // Refresh stand elements
          await refreshStandElements();
          
          // Close modal and reset data
          setIsNewCategoryModalOpen(false);
          setNewCategoryData({
            label: '',
            parentPath: null,
            editMode: false,
            editKey: null,
            editPathString: null
          });
        } else {
          const error = await response.json();
          showToast('error', 'Hata!', error.detail || 'Kategori güncellenemedi.');
        }
      } else {
        // Add new category
        const parentPath = newCategoryData.parentPath;
        
        // Generate unique key from label
        const key = newCategoryData.label.toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 20) + '_' + Date.now().toString().substring(-4);

        const categoryData = {
          key: key,
          label: newCategoryData.label,
          element_type: 'option',
          input_type: 'text',
          parent_path: parentPath
        };

        console.log('Adding new category:', categoryData);

        const response = await fetch(`${BACKEND_URL}/api/stand-elements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });

        if (response.ok) {
          const result = await response.json();
          showToast('success', 'Başarılı!', `${newCategoryData.label} kategorisi eklendi.`);
          
          // Refresh stand elements
          await refreshStandElements();
          
          // Close modal and reset data (but keep current path for continuation)
          setIsNewCategoryModalOpen(false);
          setNewCategoryData({
            label: '',
            parentPath: null,
            editMode: false,
            editKey: null,
            editPathString: null
          });
          
          // Note: We don't reset currentPath here to keep the dropdown context
        } else {
          const error = await response.json();
          showToast('error', 'Hata!', error.detail || 'Kategori eklenemedi.');
        }
      }
    } catch (error) {
      console.error('Error with category operation:', error);
      showToast('error', 'Hata!', 'Bir hata oluştu, lütfen tekrar deneyin.');
    }
  };

  // Modal handlers
  const openAddElementModal = (level, parentKey = null, parentSubKey = null) => {
    setElementModalData({
      level,
      parentKey,
      parentSubKey
    });
    setIsAddElementModalOpen(true);
  };

  const handleAddElement = async (elementData) => {
    try {
      const url = elementModalData.editMode 
        ? `${BACKEND_URL}/api/stand-elements/${elementModalData.editData.key}` 
        : `${BACKEND_URL}/api/stand-elements`;
      
      const method = elementModalData.editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: elementData.key,
          label: elementData.label,
          icon: elementData.icon,
          required: elementData.required || false,
          parent_key: elementModalData.parentKey,
          parent_sub_key: elementModalData.parentSubKey
        }),
      });
      
      if (response.ok) {
        // Refresh stand elements
        await refreshStandElements();
        setIsAddElementModalOpen(false);
        showToast('success', 'Başarılı!', 
          elementModalData.editMode ? 'Element başarıyla güncellendi!' : 'Element başarıyla eklendi!'
        );
      } else {
        const error = await response.json();
        showToast('error', 'Hata!', error.detail || 'Element işlemi başarısız.');
      }
    } catch (error) {
      console.error('Error with element:', error);
      showToast('error', 'Hata!', 'Bir hata oluştu, lütfen tekrar deneyin.');
    }
  };

  // Professional Toast System
  const showToast = (type, title, message) => {
    setToastMessage({
      isVisible: true,
      type,
      title,
      message
    });
    
    // Auto hide after 4 seconds
    setTimeout(() => {
      setToastMessage(prev => ({ ...prev, isVisible: false }));
    }, 4000);
  };

  // Professional Confirmation Dialog
  const showConfirmation = (title, message, onConfirm) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddChildElement = (pathString) => {
    console.log('Adding child to:', pathString);
    
    // Ensure modal is properly reset for new category addition
    setNewCategoryData({
      label: '',
      parentPath: pathString, // Use the full path as parent
      editMode: false,      // Explicitly set to false for new addition
      editKey: null,
      editPathString: null
    });
    
    setIsNewCategoryModalOpen(true);
  };

  const handleDeleteElement = async (pathString) => {
    const pathParts = pathString.split('.');
    const elementKey = pathParts[pathParts.length - 1];
    const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('.') : null;
    
    const isMainElement = pathParts.length === 1;
    const elementName = isMainElement 
      ? `"${elementKey}" ana elementi`
      : `"${elementKey}" kategorisi`;
    
    const warningMessage = isMainElement 
      ? `Bu ana element ve tüm alt kategorileri kalıcı olarak silinecektir.`
      : `Bu kategori ve tüm alt kategorileri kalıcı olarak silinecektir.`;
    
    showConfirmation(
      `${elementName} Sil`,
      `${elementName} silmek istediğinizden emin misiniz?\n\n${warningMessage}\n\nBu işlem geri alınamaz.`,
      async () => {
        try {
          let url = `${BACKEND_URL}/api/stand-elements/${elementKey}`;
          if (parentPath) {
            url += `?parent_path=${encodeURIComponent(parentPath)}`;
          }
          
          const response = await fetch(url, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            await refreshStandElements();
            showToast('success', 'Başarılı!', `${elementName} başarıyla silindi.`);
          } else {
            const error = await response.json();
            showToast('error', 'Hata!', error.detail || 'Element silinemedi.');
          }
        } catch (error) {
          console.error('Error deleting element:', error);
          showToast('error', 'Hata!', 'Bir hata oluştu, lütfen tekrar deneyin.');
        }
      }
    );
  };

  const handleEditElement = (pathString, elementData) => {
    console.log('Editing element:', pathString, elementData);
    
    const pathParts = pathString.split('.');
    const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('.') : null;
    
    // Set modal data for editing
    setNewCategoryData({
      label: elementData.label,
      parentPath: parentPath,
      editMode: true,
      editKey: pathParts[pathParts.length - 1],
      editPathString: pathString
    });
    
    setIsNewCategoryModalOpen(true);
  };

  // Step 1 validation function
  const canProceedFromStep1 = () => {
    // Check required fields for Step 1
    const hasProject = formData.projectId && formData.projectId.trim() !== '';
    const hasCustomer = formData.customerId && formData.customerId.trim() !== '';
    const hasAuthorizedPerson = selectedPersonId && selectedPersonId.trim() !== '';
    
    // console.log('🔍 Step 1 validation:', { 
    //   hasProject, 
    //   hasCustomer, 
    //   hasAuthorizedPerson,
    //   projectId: formData.projectId,
    //   customerId: formData.customerId,
    //   selectedPersonId
    // });
    
    return hasProject && hasCustomer && hasAuthorizedPerson;
  };

  const canProceedFromStep2 = () => {
    // Check if stand elements are selected
    const hasSelectedItems = stepData.selectedItems.length > 0;
    
    // Check if dimensions are valid (Turkish number format)
    const widthValue = parseTurkishNumber(stepData.standWidth);
    const lengthValue = parseTurkishNumber(stepData.standLength);
    const hasValidDimensions = widthValue && 
                              lengthValue && 
                              !dimensionErrors.width && 
                              !dimensionErrors.length &&
                              parseFloat(widthValue) > 0 &&
                              parseFloat(lengthValue) > 0;
    
    console.log('🔍 Step 2 validation:', { 
      hasSelectedItems, 
      hasValidDimensions,
      widthValue,
      lengthValue,
      calculatedArea: stepData.calculatedArea
    });
    
    return hasSelectedItems && hasValidDimensions;
  };

  const canProceedFromStep6 = () => {
    // Detaylı brief zorunlu
    const hasDetailedBrief = stepData.detailedBrief && stepData.detailedBrief.trim().length > 10;
    
    // Eğer "Hazır Dosya" checkbox'ı işaretliyse, dosya yüklemesi zorunlu
    if (stepData.hasReadyFile && (!stepData.briefFile || !stepData.briefFile.name)) {
      console.log('❌ Hazır dosya seçili ama dosya yüklenmemiş');
      return false;
    }
    
    return hasDetailedBrief;
  };

  const canProceedFromStep7 = () => {
    return stepData.budgetRange && stepData.deadline;
  };

  const canProceedFromStep8 = () => {
    // Logo upload is now optional, so always allow proceeding
    return true;
  };

  // Dimension validation function
  const validateDimension = (value, fieldName) => {
    console.log('🔍 Validating dimension:', value, 'for field:', fieldName);
    
    if (!value || value.trim() === '') {
      return "Bu alan zorunludur";
    }
    
    // Replace comma with dot
    const normalizedValue = value.replace(',', '.');
    
    // Check for valid decimal number pattern
    // Allow only digits and one decimal point
    const validPattern = /^[0-9]+(\.[0-9]{1,2})?$/;
    
    if (!validPattern.test(normalizedValue)) {
      return "Lütfen sadece rakam ve en fazla iki ondalık basamak giriniz.";
    }
    
    const numValue = parseFloat(normalizedValue);
    
    // Check for negative values
    if (numValue < 0) {
      return "Negatif değer girilemez.";
    }
    
    // Check for reasonable range (1cm to 50000cm / 500m)
    if (numValue < 1 || numValue > 50000) {
      return "Değer 1 cm ile 50000 cm arasında olmalıdır.";
    }
    
    return ""; // No error
  };

  // Handle Turkish formatted number input change
  const handleTurkishNumberChange = (fieldName, value, options = {}) => {
    // console.log('🔢 Turkish number change:', fieldName, '=', value);
    
    // Clean input - allow only digits, dots, and commas
    let cleanValue = value.replace(/[^0-9.,]/g, '');
    
    // Handle decimal comma input (convert for internal processing)
    if (cleanValue.includes(',')) {
      // Split by comma and ensure only one decimal separator
      const parts = cleanValue.split(',');
      if (parts.length > 2) {
        cleanValue = parts[0] + ',' + parts.slice(1).join('');
      }
      // Limit decimal places
      if (parts[1] && parts[1].length > 2) {
        cleanValue = parts[0] + ',' + parts[1].substring(0, 2);
      }
    }
    
    // Remove extra thousand separators (dots) except when they're clearly thousand separators
    const dotCount = (cleanValue.match(/\./g) || []).length;
    if (dotCount > 0) {
      // If there's a comma, all dots should be thousand separators
      if (cleanValue.includes(',')) {
        // Keep dots as thousand separators
      } else {
        // If no comma but multiple dots, keep only the last one as decimal
        if (dotCount > 1) {
          const lastDotIndex = cleanValue.lastIndexOf('.');
          cleanValue = cleanValue.substring(0, lastDotIndex).replace(/\./g, '') + '.' + cleanValue.substring(lastDotIndex + 1);
        }
      }
    }
    
    // console.log('🧹 Cleaned Turkish value:', cleanValue);
    
    // For dimension fields, update stepData and calculate area
    if (fieldName === 'width' || fieldName === 'length') {
      const fieldMap = {
        width: 'standWidth',
        length: 'standLength'
      };
      
      setStepData(prev => {
        const newData = { ...prev, [fieldMap[fieldName]]: cleanValue };
        
        // Calculate area if both dimensions are valid
        const width = fieldName === 'width' ? cleanValue : prev.standWidth;
        const length = fieldName === 'length' ? cleanValue : prev.standLength;
        
        if (width && length) {
          const widthNum = parseFloat(parseTurkishNumber(width));
          const lengthNum = parseFloat(parseTurkishNumber(length));
          
          if (!isNaN(widthNum) && !isNaN(lengthNum) && widthNum > 0 && lengthNum > 0) {
            // Convert cm to m² and format in Turkish style
            const areaValue = (widthNum * lengthNum) / 10000;
            newData.calculatedArea = formatTurkishNumber(areaValue, 2);
            console.log('📐 Calculated area:', newData.calculatedArea, 'm²');
          } else {
            newData.calculatedArea = '0,00';
          }
        } else {
          newData.calculatedArea = '0,00';
        }
        
        return newData;
      });
      
      // Validate the field using Turkish number validation
      const error = validateTurkishNumber(cleanValue, fieldName, { 
        required: true, 
        min: 1, 
        max: 50000, 
        maxDecimals: 2 
      });
      setDimensionErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
    
    return cleanValue;
  };

  // Simplified Turkish Number Input Component
  const TurkishNumberInput = ({ 
    value, 
    onChange, 
    placeholder = "0,00", 
    className = "",
    required = false,
    min = 0,
    max = Infinity,
    maxDecimals = 2,
    onError = null,
    ...props 
  }) => {
    
    const handleChange = (e) => {
      const inputValue = e.target.value;
      // Just pass the value directly without complex processing
      onChange(inputValue);
    };

    return (
      <input
        {...props}
        type="text"
        inputMode="decimal"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${className}`}
      />
    );
  };

  const handleStepFileUpload = (field, files) => {
    console.log('📁 handleStepFileUpload called:', { field, filesLength: files?.length });
    if (!files || files.length === 0) {
      console.log('❌ No files provided to handleStepFileUpload');
      return;
    }
    
    const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.cad', '.zip'];
    const validFiles = [];
    const errors = [];
    
    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name}: Dosya boyutu 100 MB'dan büyük olamaz (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
        return;
      }
      
      // Check file type
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        errors.push(`${file.name}: Desteklenmeyen dosya türü. Sadece PDF, JPG, CAD, ZIP dosyaları kabul edilir`);
        return;
      }
      
      validFiles.push({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      });
    });
    
    // Show errors if any
    if (errors.length > 0) {
      showToast('error', 'Dosya Upload Hatası', errors.join('\n'));
      return;
    }
    
    // Show success message
    if (validFiles.length > 0) {
      console.log('✅ Valid files to be added:', validFiles);
      showToast('success', 'Dosyalar Eklendi', `${validFiles.length} dosya başarıyla eklendi`);
      
      setStepData(prev => {
        const newStepData = {
          ...prev,
          [field]: [...(prev[field] || []), ...validFiles]
        };
        console.log('📊 Updated stepData:', newStepData);
        return newStepData;
      });
    }
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
      showToast('warning', 'Eksik Bilgi!', 'Lütfen zorunlu alanları doldurun: Proje, Müşteri, Yetkili Kişi');
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
    showToast('success', 'Başarılı!', 'Brief başarıyla oluşturuldu!');
    
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
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.eventDuration || ''}
                  onChange={(e) => handleInputChange('eventDuration', e.target.value)}
                  placeholder="3,00"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
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
              {/* Stand Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stand Eni (cm) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={stepData.standWidth}
                  onChange={(e) => handleTurkishNumberChange('width', e.target.value)}
                  onBlur={(e) => {
                    // Format display value on blur
                    const cleanValue = parseTurkishNumber(e.target.value);
                    if (cleanValue && !isNaN(parseFloat(cleanValue))) {
                      const formatted = formatTurkishNumber(parseFloat(cleanValue), 2);
                      setStepData(prev => ({ ...prev, standWidth: formatted }));
                    }
                  }}
                  placeholder="600,00"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    dimensionErrors.width ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {dimensionErrors.width && (
                  <p className="text-red-600 text-xs mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {dimensionErrors.width}
                  </p>
                )}
              </div>

              {/* Stand Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stand Boyu (cm) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={stepData.standLength}
                  onChange={(e) => handleTurkishNumberChange('length', e.target.value)}
                  onBlur={(e) => {
                    // Format display value on blur
                    const cleanValue = parseTurkishNumber(e.target.value);
                    if (cleanValue && !isNaN(parseFloat(cleanValue))) {
                      const formatted = formatTurkishNumber(parseFloat(cleanValue), 2);
                      setStepData(prev => ({ ...prev, standLength: formatted }));
                    }
                  }}
                  placeholder="600,00"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    dimensionErrors.length ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {dimensionErrors.length && (
                  <p className="text-red-600 text-xs mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {dimensionErrors.length}
                  </p>
                )}
              </div>

              {/* Calculated Area Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hesaplanan Alan (m²)
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-800 font-medium">
                  {stepData.calculatedArea || '0,00'} m²
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  En × Boy ÷ 10.000
                </p>
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
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.closedSides || ''}
                  onChange={(e) => handleInputChange('closedSides', e.target.value)}
                  placeholder="2,00"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yükseklik (m)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.standHeight || ''}
                  onChange={(e) => handleInputChange('standHeight', e.target.value)}
                  placeholder="2,50"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                />
              </div>
            </div>
            
            {/* Continue Button */}
            <div className="mt-8 pt-6 border-t">
              <div className="text-center">
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProceedFromStep1()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Detaylı Stand İhtiyaçları →
                </Button>
                {canProceedFromStep1() ? (
                  <p className="text-sm text-gray-500 mt-2">
                    Standınızın tüm detaylarını belirlemek için devam edin
                  </p>
                ) : (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                    <p className="text-sm text-orange-800 font-medium">
                      ⚠️ Stand Gereksinimleri bölümüne geçmek için üstteki zorunlu alanları doldurun
                    </p>
                    <div className="text-xs text-orange-700 mt-1">
                      Proje Seçimi • Müşteri • Yetkili Kişi
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Multi-Step Stand Requirements */}
        {currentStep > 1 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Stand Detayları - {currentStep}/8</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
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
                  
                  {/* Recursive Dynamic Dropdowns */}
                  <div className="space-y-4">
                    {/* Admin Controls - Development: Always show for testing */}
                    <div className="flex justify-end space-x-2 mb-4">
                      <Button
                        type="button"
                        onClick={() => {
                          // Set modal context for main element addition
                          setNewCategoryData({
                            label: '',
                            parentPath: null,
                            editMode: false,
                            editKey: null,
                            editPathString: null
                          });
                          setIsNewCategoryModalOpen(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Alt Kategori Ekle
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setIsManageElementsModalOpen(true)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Elementleri Yönet
                      </Button>
                    </div>

                    {/* Recursive Dropdown Levels */}
                    {Array.from({ length: stepData.currentPath.length + 1 }, (_, level) => {
                      console.log(`🔄 RENDER - Level ${level} for currentPath:`, stepData.currentPath);
                      
                      // Get available options for current level
                      let availableOptions = {};
                      if (level === 0) {
                        // First level - main elements
                        availableOptions = standElementsConfig || {};
                        console.log('🔄 RENDER Level 0 - availableOptions keys:', Object.keys(availableOptions));
                      } else {
                        // Nested levels
                        const pathToCurrentLevel = stepData.currentPath.slice(0, level);
                        availableOptions = getCurrentNode(pathToCurrentLevel);
                        console.log(`🔄 RENDER Level ${level} - pathToCurrentLevel:`, pathToCurrentLevel);
                        console.log(`🔄 RENDER Level ${level} - availableOptions keys:`, Object.keys(availableOptions || {}));
                      }

                      // If no options available, don't render this level
                      if (!availableOptions || Object.keys(availableOptions).length === 0) {
                        console.log(`🔄 RENDER Level ${level} - No options, skipping`);
                        return null;
                      }

                      // Generate level label
                      let levelLabel = '';
                      if (level === 0) {
                        levelLabel = 'Ana Element Seçin *';
                      } else {
                        const parentPath = stepData.currentPath.slice(0, level);
                        const parentLabels = getPathLabels(parentPath);
                        levelLabel = `${parentLabels[parentLabels.length - 1]} - Alt Kategori Seçin`;
                      }

                      return (
                        <div key={`dropdown-level-${level}-${stepData.currentPath.length}`}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {level + 1}. {levelLabel}
                            </label>
                            <div className="flex items-center gap-2">
                              {level > 0 && ( // X butonu - sadece alt kategoriler için
                                <Button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    console.log(`🔴 X Button clicked - Level ${level}`);
                                    console.log(`🔴 Before - currentPath:`, stepData.currentPath);
                                    
                                    // Bu seviyeyi ve sonrasını kaldır - FORCED UPDATE
                                    const newPath = stepData.currentPath.slice(0, level);
                                    console.log(`🔴 New path will be:`, newPath);
                                    
                                    // Force component re-render with key change
                                    setStepData(prev => {
                                      const newState = {
                                        ...prev,
                                        currentPath: newPath,
                                        _forceUpdateKey: Date.now() // Force re-render
                                      };
                                      console.log(`🔴 State updated:`, newState);
                                      return newState;
                                    });
                                    
                                    showToast(`${level}. seviye kaldırıldı`, 'success');
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 px-2 transition-colors"
                                  title="Bu kategoriyi kaldır"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              {level > 0 && ( // Only show on alt kategori levels (level > 0)
                                <Button
                                  type="button"
                                  onClick={() => {
                                    console.log('Özellik Ekle clicked for level:', level);
                                    const currentPath = stepData.currentPath.slice(0, level + 1);
                                    setFeatureModalData({
                                      level,
                                      currentPath,
                                      featureName: '',
                                      featureValue: '',
                                      featureType: 'text'
                                    });
                                    setIsFeatureModalOpen(true);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-300 hover:bg-green-50"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Özellik Ekle
                                </Button>
                              )}
                              {true && ( // Development: Always show for testing
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const parentPath = stepData.currentPath.slice(0, level);
                                    // Set modal context for current level
                                    setNewCategoryData({
                                      label: '',
                                      parentPath: parentPath.length > 0 ? parentPath.join('.') : null,
                                      editMode: false,
                                      editKey: null,
                                      editPathString: null
                                    });
                                    setIsNewCategoryModalOpen(true);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Alt Kategori Ekle
                                </Button>
                              )}
                            </div>
                          </div>
                          <select 
                            value={stepData.currentPath[level] || ''} 
                            onChange={(e) => handleRecursiveSelection(level, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">
                              {level === 0 
                                ? "Ana element seçin" 
                                : "Alt kategori seçin"
                              }
                            </option>
                            {Object.entries(availableOptions).map(([key, config]) => {
                              return (
                                <option key={key} value={key}>
                                  {config.label}
                                  {level === 0 && config.required ? ' *' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      );
                    })}

                    {/* Miktar Input Section */}
                    {stepData.currentPath.length > 0 && (
                      <div className="pt-6 space-y-4">
                        {/* Miktar ve Renk Paleti Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Miktar Column */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Miktar
                            </label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Miktar girin"
                                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                                value={selectedQuantity || ''}
                                onChange={(e) => setSelectedQuantity(e.target.value)}
                                style={{ pointerEvents: 'auto', zIndex: 10 }}
                              />
                              <select 
                                value={selectedUnit}
                                onChange={(e) => setSelectedUnit(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px]"
                              >
                                <option value="">Birim</option>
                                <option value="adet">Adet</option>
                                <option value="m2">m²</option>
                                <option value="m3">m³</option>
                                <option value="m">Metre</option>
                                <option value="kg">Kilogram</option>
                                <option value="ton">Ton</option>
                                <option value="lt">Litre</option>
                                <option value="paket">Paket</option>
                                <option value="kutu">Kutu</option>
                                <option value="rulo">Rulo</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* Renkler Column */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Renkler
                            </label>
                            <select 
                              value={selectedColor}
                              onChange={(e) => setSelectedColor(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Renk seçin</option>
                              {getColorOptions().map((color) => (
                                <option key={color} value={color}>
                                  {color}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        {/* Seçimi Ekle Button */}
                        <div className="pt-2">
                          <Button
                            type="button"
                            onClick={addSelectionToList}
                            className="bg-green-600 hover:bg-green-700 text-white w-full"
                          >
                            Seçimi Ekle
                          </Button>
                        </div>
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
                            <div className="flex-1">
                              <div className="font-medium">{item.pathString}</div>
                              <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                                {item.quantity && item.unit && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    📊 {item.quantity} {item.unit}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    🎨 {item.color}
                                  </span>
                                )}
                                {/* Display Features for this item */}
                                {stepData.features[item.path] && stepData.features[item.path].map((feature, featureIdx) => (
                                  <span key={featureIdx} className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                    ✨ {feature.name}: {feature.value}
                                  </span>
                                ))}
                              </div>
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
                    <h3 className="text-xl font-semibold mb-2">Standınızda hangi elementlere ihtiyacınız var?</h3>
                    <p className="text-gray-600">Gerekli elementleri seçin</p>
                  </div>

                  {/* Icon-based Element Selection */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Truss */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.standElements.truss ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('standElements', {
                        ...stepData.standElements,
                        truss: !stepData.standElements.truss
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">🏗️</div>
                        <h4 className="font-semibold">Truss</h4>
                        <p className="text-sm text-gray-600 mt-1">Alüminyum konstrüksiyon</p>
                      </div>
                    </div>

                    {/* Özel Aydınlatma */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.standElements.specialLighting ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('standElements', {
                        ...stepData.standElements,
                        specialLighting: !stepData.standElements.specialLighting
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">💡</div>
                        <h4 className="font-semibold">Özel Aydınlatma</h4>
                        <p className="text-sm text-gray-600 mt-1">Robot, Avize, 1000 Watt</p>
                      </div>
                    </div>

                    {/* Ses Sistemi */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.standElements.soundSystem ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('standElements', {
                        ...stepData.standElements,
                        soundSystem: !stepData.standElements.soundSystem
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">🔊</div>
                        <h4 className="font-semibold">Ses Sistemi</h4>
                        <p className="text-sm text-gray-600 mt-1">Hoparlör, mikrofon, amfi</p>
                      </div>
                    </div>

                    {/* Led Ekran */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.standElements.ledScreen ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('standElements', {
                        ...stepData.standElements,
                        ledScreen: !stepData.standElements.ledScreen
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">📱</div>
                        <h4 className="font-semibold">Led Ekran</h4>
                        <p className="text-sm text-gray-600 mt-1">LED panel, video duvarı</p>
                      </div>
                    </div>

                    {/* Broşürlük */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.standElements.brochureRack ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('standElements', {
                        ...stepData.standElements,
                        brochureRack: !stepData.standElements.brochureRack
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">📄</div>
                        <h4 className="font-semibold">Broşürlük</h4>
                        <p className="text-sm text-gray-600 mt-1">Katalog, broşür standı</p>
                      </div>
                    </div>

                    {/* Rampa */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.standElements.ramp ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('standElements', {
                        ...stepData.standElements,
                        ramp: !stepData.standElements.ramp
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">🛤️</div>
                        <h4 className="font-semibold">Rampa</h4>
                        <p className="text-sm text-gray-600 mt-1">Engelli erişim, yükleme</p>
                      </div>
                    </div>

                    {/* Su Bağlantısı */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.standElements.waterConnection ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('standElements', {
                        ...stepData.standElements,
                        waterConnection: !stepData.standElements.waterConnection
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">🚰</div>
                        <h4 className="font-semibold">Su Bağlantısı</h4>
                        <p className="text-sm text-gray-600 mt-1">Musluk, lavabo, su tesisatı</p>
                      </div>
                    </div>

                    {/* Videowall */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.standElements.videowall ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('standElements', {
                        ...stepData.standElements,
                        videowall: !stepData.standElements.videowall
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">📺</div>
                        <h4 className="font-semibold">Videowall</h4>
                        <p className="text-sm text-gray-600 mt-1">Video duvarı, büyük ekran</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-2">Hizmet ve Teknoloji İhtiyaçlarınız</h3>
                    <p className="text-gray-600">Standınızda bulunmasını istediğiniz hizmet ve teknolojileri seçin</p>
                  </div>

                  {/* Service & Technology Icon Selection */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Hava (makineler için) */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.serviceElements?.airForMachines ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('serviceElements', {
                        ...(stepData.serviceElements || {}),
                        airForMachines: !(stepData.serviceElements?.airForMachines)
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">🌬️</div>
                        <h4 className="font-semibold">Hava</h4>
                        <p className="text-sm text-gray-600 mt-1">Makineler için hava basıncı</p>
                      </div>
                    </div>

                    {/* Wifi */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.serviceElements?.wifi ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('serviceElements', {
                        ...(stepData.serviceElements || {}),
                        wifi: !(stepData.serviceElements?.wifi)
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">📶</div>
                        <h4 className="font-semibold">Wifi</h4>
                        <p className="text-sm text-gray-600 mt-1">Kablosuz internet bağlantısı</p>
                      </div>
                    </div>

                    {/* Tablet Kiosk */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.serviceElements?.tabletKiosk ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('serviceElements', {
                        ...(stepData.serviceElements || {}),
                        tabletKiosk: !(stepData.serviceElements?.tabletKiosk)
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">📱</div>
                        <h4 className="font-semibold">Tablet Kiosk</h4>
                        <p className="text-sm text-gray-600 mt-1">Bilgi ve sunum tableti</p>
                      </div>
                    </div>

                    {/* Dokunmatik Kiosk */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.serviceElements?.touchKiosk ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('serviceElements', {
                        ...(stepData.serviceElements || {}),
                        touchKiosk: !(stepData.serviceElements?.touchKiosk)
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">🖥️</div>
                        <h4 className="font-semibold">Dokunmatik Kiosk</h4>
                        <p className="text-sm text-gray-600 mt-1">Etkileşimli bilgi ekranı</p>
                      </div>
                    </div>

                    {/* Özel Vitrin (Kuyumcu) */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.serviceElements?.jewelryShowcase ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('serviceElements', {
                        ...(stepData.serviceElements || {}),
                        jewelryShowcase: !(stepData.serviceElements?.jewelryShowcase)
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">💎</div>
                        <h4 className="font-semibold">Özel Vitrin</h4>
                        <p className="text-sm text-gray-600 mt-1">Kuyumcu vitrin, güvenli sergi</p>
                      </div>
                    </div>

                    {/* Host/Hostess */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.serviceElements?.hostess ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('serviceElements', {
                        ...(stepData.serviceElements || {}),
                        hostess: !(stepData.serviceElements?.hostess)
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">👩‍💼</div>
                        <h4 className="font-semibold">Host/Hostess</h4>
                        <p className="text-sm text-gray-600 mt-1">Karşılama ve yönlendirme</p>
                      </div>
                    </div>

                    {/* Garson */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.serviceElements?.waiter ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('serviceElements', {
                        ...(stepData.serviceElements || {}),
                        waiter: !(stepData.serviceElements?.waiter)
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">🍽️</div>
                        <h4 className="font-semibold">Garson</h4>
                        <p className="text-sm text-gray-600 mt-1">İkram ve servis hizmeti</p>
                      </div>
                    </div>

                    {/* Barista */}
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        stepData.serviceElements?.barista ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStepDataChange('serviceElements', {
                        ...(stepData.serviceElements || {}),
                        barista: !(stepData.serviceElements?.barista)
                      })}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">☕</div>
                        <h4 className="font-semibold">Barista</h4>
                        <p className="text-sm text-gray-600 mt-1">Profesyonel kahve hizmeti</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-2">Aşağıdakilerden hangisi size uygun?</h3>
                    <p className="text-gray-600">Birden fazla seçenek işaretleyebilirsiniz</p>
                  </div>
                  
                  <div className="max-w-4xl mx-auto space-y-4">
                    {/* Service Options */}
                    {[
                      { id: 'cleaning_during_fair', label: 'Fuar süresince Fuar saatlerinde temizlik görevlisi', hasDetails: false },
                      { id: 'cleaning_after_fair', label: 'Fuar süresince Fuar kapandıktan sonra temizlik', hasDetails: false },
                      { id: 'sweep_after_fair', label: 'Fuar süresince Fuar kapandıktan sonra sadece süpürge', hasDetails: false },
                      { id: 'special_product_cleaning', label: 'Müşteri ait ürünlere özel temizlik', hasDetails: false },
                      { id: 'steel_polishing', label: 'Paslanmaz çelikler için parlatma hizmeti', hasDetails: true },
                      { id: 'security_setup', label: 'Kurulum süresince güvenlik görevlisi', hasDetails: false },
                      { id: 'security_during_fair', label: 'Fuar süresince fuar saatlerinde güvenlik görevlisi', hasDetails: false },
                      { id: 'security_after_fair', label: 'Fuar süresince fuar kapandıktan sonra güvenlik görevlisi', hasDetails: false },
                      { id: 'security_dismantling', label: 'Söküm süresince güvenlik görevlisi', hasDetails: false },
                      { id: 'translator', label: 'Fuar süresince fuar saatlerinde tercüman', hasDetails: true },
                      { id: 'technical_staff', label: 'Fuar süresince fuar saatlerinde teknik görevli', hasDetails: false },
                      { id: 'chef', label: 'Fuar süresince Fuar saatlerinde aşçı', hasDetails: false },
                      { id: 'presenter', label: 'Fuar süresince Fuar saatlerinde sunucu', hasDetails: false }
                    ].map((service) => (
                      <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id={service.id}
                            checked={selectedServices[service.id] || false}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setSelectedServices(prev => ({
                                ...prev,
                                [service.id]: isChecked
                              }));
                              // Clear details if unchecked
                              if (!isChecked && service.hasDetails) {
                                setServiceDetails(prev => ({
                                  ...prev,
                                  [service.id]: ''
                                }));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                          />
                          <label htmlFor={service.id} className="text-gray-700 cursor-pointer flex-1">
                            {service.label}
                          </label>
                        </div>
                        
                        {/* Detail text box for services with hasDetails: true */}
                        {service.hasDetails && selectedServices[service.id] && (
                          <div className="mt-3 ml-7">
                            <textarea
                              value={serviceDetails[service.id] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 500) {
                                  setServiceDetails(prev => ({
                                    ...prev,
                                    [service.id]: value
                                  }));
                                }
                              }}
                              placeholder="Lütfen bu alana detaylı açıklama yazınız"
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px] placeholder-gray-400"
                              rows={3}
                            />
                            <div className="text-right text-xs text-gray-500 mt-1">
                              {(serviceDetails[service.id] || '').length}/500 karakter
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 6 (Fiyat önem derecesi) silindi */}

              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-2">Brief Detayları ve Görüşleriniz</h3>
                    <p className="text-gray-600 max-w-4xl mx-auto leading-relaxed">
                      Tasarımınızı isteklerinize ve kurumsal kimliğinize en uygun şekilde yapabilmemiz, 
                      fuar standınızın hedef kitlenize güçlü bir mesaj verebilmesi ve markanızın değerlerini 
                      en iyi şekilde yansıtabilmesi için, lütfen briefinize ilişkin tüm detayları, 
                      beklentilerinizi, özel isteklerinizi, kaçınmak istediğiniz yaklaşımları, 
                      hedef kitlenizin demografik özelliklerini, standınızda yaratmak istediğiniz 
                      atmosferi ve genel tasarım felsefenizi yazılı olarak detaylı şekilde 
                      burada belirtiniz. Bu bilgiler, tasarım ekibimizin size en uygun çözümü 
                      sunabilmesi için kritik öneme sahiptir.
                    </p>
                  </div>
                  
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Detailed Brief Text Area */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Detaylı Brief Açıklaması *
                      </label>
                      <textarea
                        value={stepData.detailedBrief || ''}
                        onChange={(e) => handleStepDataChange('detailedBrief', e.target.value)}
                        placeholder="Lütfen standınız hakkındaki tüm detayları, beklentilerinizi, hedef kitlenizi, yaratmak istediğiniz atmosferi, kaçınmak istediğiniz yaklaşımları ve özel isteklerinizi detaylıca yazınız..."
                        rows={12}
                        className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[300px] text-sm leading-relaxed"
                      />
                      <div className="text-right text-xs text-gray-500">
                        {(stepData.detailedBrief || '').length} karakter
                      </div>
                    </div>

                    {/* Ready File Upload Option */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="hasReadyFile"
                          checked={stepData.hasReadyFile || false}
                          onChange={(e) => handleStepDataChange('hasReadyFile', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor="hasReadyFile" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Hazır Dosya
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            Hazır bir yazılı briefiniz varsa buraya yükleyebilirsiniz
                          </p>
                        </div>
                      </div>

                      {/* File Upload Area - only show when checkbox is checked */}
                      {stepData.hasReadyFile && (
                        <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-6">
                          <div className="text-center">
                            <div className="text-3xl mb-3">📄</div>
                            <p className="text-sm text-gray-600 mb-4">
                              Brief dosyanızı buraya yükleyebilirsiniz
                            </p>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                console.log('Brief file selected:', file);
                                if (file) {
                                  // Validate file type
                                  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
                                  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                                  
                                  if (allowedTypes.includes(fileExtension)) {
                                    setStepData(prev => ({ ...prev, briefFile: file }));
                                    showToast('success', 'Dosya Yüklendi', `${file.name} başarıyla seçildi`);
                                  } else {
                                    showToast('error', 'Geçersiz Dosya', 'Sadece PDF, DOC, DOCX, TXT dosyaları kabul edilir');
                                    e.target.value = ''; // Reset input
                                  }
                                }
                              }}
                              className="hidden"
                              id="brief-file-upload"
                            />
                            <label
                              htmlFor="brief-file-upload"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                            >
                              Dosya Seç
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                              PDF, DOC, DOCX, TXT dosyaları kabul edilir
                            </p>
                            
                            {/* Show uploaded file info */}
                            {stepData.briefFile && (
                              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <span className="text-green-600">📄</span>
                                  <div>
                                    <p className="text-sm font-medium text-green-800">{stepData.briefFile.name}</p>
                                    <p className="text-xs text-green-600">
                                      {(stepData.briefFile.size / 1024 / 1024).toFixed(1)} MB
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStepData(prev => ({ ...prev, briefFile: null }));
                                      document.getElementById('brief-file-upload').value = '';
                                      showToast('info', 'Dosya Kaldırıldı', 'Brief dosyası kaldırıldı');
                                    }}
                                    className="ml-auto text-red-600 hover:text-red-800"
                                    title="Dosyayı kaldır"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                      📋 Bütçe ve Gereksinimler
                    </h3>
                    <p className="text-gray-600">
                      Projeniz için bütçe aralığınızı, teslim tarihini ve özel gereksinimlerinizi belirtiniz
                    </p>
                  </div>
                  
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Budget Range */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Bütçe Aralığı *
                          </label>
                          <select
                            value={stepData.budgetRange}
                            onChange={(e) => handleStepDataChange('budgetRange', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Bütçe seçin</option>
                            <option value="5000-10000">5.000 - 10.000 ₺</option>
                            <option value="10000-25000">10.000 - 25.000 ₺</option>
                            <option value="25000-50000">25.000 - 50.000 ₺</option>
                            <option value="50000-100000">50.000 - 100.000 ₺</option>
                            <option value="100000-250000">100.000 - 250.000 ₺</option>
                            <option value="250000-500000">250.000 - 500.000 ₺</option>
                            <option value="500000+">500.000 ₺ ve üzeri</option>
                            <option value="custom">Özel bütçe (lütfen açıklayın)</option>
                          </select>
                        </div>

                        {/* Deadline */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Son Teslim Tarihi *
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              value={stepData.deadline}
                              onChange={(e) => handleStepDataChange('deadline', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                              min={new Date().toISOString().split('T')[0]} // Minimum today
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Custom Requirements */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Özel Gereksinimler
                        </label>
                        <textarea
                          value={stepData.customRequirements}
                          onChange={(e) => handleStepDataChange('customRequirements', e.target.value)}
                          placeholder="Özel talep, kısıtlama veya gereksinimler..."
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                        />
                        <p className="text-xs text-gray-500">
                          Proje için özel istekleriniz, kısıtlamalarınız veya dikkat edilmesi gereken hususları belirtebilirsiniz
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 8 && (
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
                        onChange={(e) => {
                          console.log('📂 File input onChange triggered:', e.target.files);
                          handleStepFileUpload('designFiles', e.target.files);
                        }}
                        onClick={(e) => {
                          console.log('🖱️ File input clicked');
                        }}
                        className="hidden"
                        id="design-upload"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mb-4 cursor-pointer"
                        onClick={(e) => {
                          console.log('🔘 Dosya Seç button clicked');
                          // Manually trigger file input click
                          const fileInput = document.getElementById('design-upload');
                          if (fileInput) {
                            console.log('📁 File input found, triggering click');
                            fileInput.click();
                          } else {
                            console.log('❌ File input not found');
                          }
                        }}
                      >
                        Dosya Seç
                      </Button>
                      
                      {stepData.designFiles && stepData.designFiles.length > 0 && (
                        <div className="mt-6">
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Yüklenen Dosyalar:</h5>
                          <div className="space-y-2">
                            {stepData.designFiles.map(file => (
                              <div key={file.id} className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="text-green-600">
                                    {file.name.toLowerCase().endsWith('.pdf') ? '📄' : 
                                     file.name.toLowerCase().match(/\.(jpg|jpeg)$/) ? '🖼️' : 
                                     file.name.toLowerCase().endsWith('.zip') ? '🗂️' : '📁'}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Bilinmeyen boyut'}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeStepFile('designFiles', file.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  title="Dosyayı kaldır"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
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
                  onClick={currentStep === 8 ? () => setCurrentStep(9) : handleNextStep}
                  disabled={(currentStep === 1 && !canProceedFromStep1()) || (currentStep === 2 && !canProceedFromStep2()) || (currentStep === 6 && !canProceedFromStep6()) || (currentStep === 7 && !canProceedFromStep7()) || (currentStep === 8 && !canProceedFromStep8())}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <span>{currentStep === 8 ? 'Tamamla' : 'Sonraki →'}</span>
                </Button>
              </div>
              
              {/* Validation Message for Step 1 */}
              {currentStep === 1 && !canProceedFromStep1() && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Dikkat:</strong> Stand Gereksinimleri bölümüne geçmek için aşağıdaki zorunlu alanları doldurmalısınız:
                    {!formData.projectId && (
                      <span className="block mt-1">• Proje seçimi yapmalısınız</span>
                    )}
                    {!formData.customerId && (
                      <span className="block mt-1">• Müşteri seçmelisiniz</span>
                    )}
                    {!selectedPersonId && (
                      <span className="block mt-1">• Yetkili kişi seçmelisiniz</span>
                    )}
                  </p>
                </div>
              )}

              {/* Validation Message for Step 2 */}
              {currentStep === 2 && !canProceedFromStep2() && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Dikkat:</strong> Devam etmek için aşağıdaki alanları tamamlamalısınız:
                    {stepData.selectedItems.length === 0 && (
                      <span className="block mt-1">• En az bir stand elementi seçmelisiniz</span>
                    )}
                    {(!stepData.standWidth || dimensionErrors.width) && (
                      <span className="block mt-1">• Stand eni (cm) geçerli bir değer giriniz</span>
                    )}
                    {(!stepData.standLength || dimensionErrors.length) && (
                      <span className="block mt-1">• Stand boyu (cm) geçerli bir değer giriniz</span>
                    )}
                  </p>
                </div>
              )}

              {/* Validation Message for Step 6 */}
              {currentStep === 6 && !canProceedFromStep6() && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Dikkat:</strong> Aşağıdaki alanları tamamlamalısınız:
                    {(!stepData.detailedBrief || stepData.detailedBrief.trim().length <= 10) && (
                      <span className="block mt-1">• Detaylı brief açıklaması (en az 10 karakter)</span>
                    )}
                    {stepData.hasReadyFile && (!stepData.briefFile || !stepData.briefFile.name) && (
                      <span className="block mt-1">• "Hazır Dosya" seçili olduğu için dosya yüklemelisiniz</span>
                    )}
                  </p>
                </div>
              )}

              {/* Validation Message for Step 7 */}
              {currentStep === 7 && !canProceedFromStep7() && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Dikkat:</strong> Devam etmek için aşağıdaki alanları doldurmalısınız:
                    {!stepData.budgetRange && (
                      <span className="block mt-1">• Bütçe aralığı seçimi</span>
                    )}
                    {!stepData.deadline && (
                      <span className="block mt-1">• Son teslim tarihi</span>
                    )}
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        )}

        {/* Success Page - Step 9 */}
        {currentStep === 9 && (
          <div className="w-full max-w-6xl mx-auto space-y-8">
            {/* Success Header - Fixed at Top */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-8 shadow-lg">
              <div className="text-center space-y-6">
                {/* Success Icon and Message */}
                <div className="flex justify-center">
                  <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    🎉 Tebrikler! Brief formunuzu başarı ile oluşturdunuz
                  </h1>
                  <div className="max-w-3xl mx-auto space-y-3">
                    <p className="text-xl text-gray-700 font-medium">
                      Briefinizin özetini aşağıdan inceleyebilirsiniz
                    </p>
                    <p className="text-gray-600">
                      İstediğiniz zaman briefinizde güncelleme yapabilirsiniz
                    </p>
                    <p className="text-gray-600">
                      Tasarımcılarımız iş planına göre size bir takvim iletecek ve tasarım çalışmalarınızı yürütecektir
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Card */}
            <Card className="w-full">
              <CardContent className="p-8">
                <div className="text-center space-y-8">

                {/* Brief Link */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Brief Linki:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      readOnly
                      value={`https://vitingo-dashboard.preview.emergentagent.com/dashboard#brief-${stepData.briefId}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const link = `https://vitingo-dashboard.preview.emergentagent.com/dashboard#brief-${stepData.briefId}`;
                        navigator.clipboard.writeText(link);
                        showToast('Brief link kopyalandı!', 'success');
                      }}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-300"
                    >
                      Kopyala
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                  {/* Mail Button */}
                  <Button
                    type="button"
                    onClick={() => {
                      setMailData({
                        ...mailData,
                        subject: `Stand Brief - ${stepData.briefId}`
                      });
                      setIsMailModalOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white py-3"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Mail Gönder
                  </Button>

                  {/* WhatsApp Button */}
                  <Button
                    type="button"
                    onClick={() => {
                      const briefLink = `https://vitingo-dashboard.preview.emergentagent.com/dashboard#brief-${stepData.briefId}`;
                      const message = `Stand Brief hazırladım! 🏢\n\nBrief ID: ${stepData.briefId}\nLink: ${briefLink}\n\nDetayları inceleyebilirsiniz.`;
                      const whatsappURL = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                      window.open(whatsappURL, '_blank');
                      showToast('WhatsApp ile paylaşıldı', 'success');
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white py-3"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    WhatsApp
                  </Button>

                  {/* Message Button */}
                  <Button
                    type="button"
                    onClick={() => {
                      console.log('Tasarımcıya mesaj gönder clicked');
                      // TODO: Implement in-app messaging to designer
                      showToast('Tasarımcıya mesaj gönderilecek', 'info');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Mesaj Gönder
                  </Button>

                  {/* Close Button - Now opens Final Success Modal */}
                  <Button
                    type="button"
                    onClick={() => {
                      setIsFinalSuccessModalOpen(true);
                    }}
                    variant="outline"
                    className="py-3"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tamam
                  </Button>
                </div>

                {/* Comprehensive Brief Report */}
                <div className="bg-gray-50 rounded-lg p-6 mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Stand Brief Raporu</h3>
                    <div className="text-sm text-gray-500">
                      Brief ID: {stepData.briefId}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Stand Boyutları - Proje Bilgileri bölümü kaldırıldı */}
                    <div className="bg-white rounded-lg p-5 shadow-sm">
                      <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                        📐 Stand Boyutları
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-700">
                            {stepData.standWidth || 'Belirtilmemiş'} cm
                          </div>
                          <div className="text-sm text-blue-600 font-medium">Stand Eni</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-700">
                            {stepData.standLength || 'Belirtilmemiş'} cm
                          </div>
                          <div className="text-sm text-green-600 font-medium">Stand Boyu</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-700">
                            {stepData.calculatedArea || '0,00'} m²
                          </div>
                          <div className="text-sm text-purple-600 font-medium">Toplam Alan</div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500 text-center">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          Hesaplama: {stepData.standWidth || '0,00'} × {stepData.standLength || '0,00'} ÷ 10.000 = {stepData.calculatedArea || '0,00'} m²
                        </span>
                      </div>
                    </div>

                    {/* 2. Seçilen Stand Elementleri */}
                    <div className="bg-white rounded-lg p-5 shadow-sm">
                      <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                        🏗️ Stand Elementleri ({stepData.selectedItems ? stepData.selectedItems.length : 0} adet)
                      </h4>
                      {stepData.selectedItems && stepData.selectedItems.length > 0 ? (
                        <div className="space-y-2">
                          {stepData.selectedItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                              <div>
                                <span className="font-medium text-sm">{item.pathString}</span>
                                {(item.quantity || item.color) && (
                                  <div className="flex gap-2 mt-1">
                                    {item.quantity && item.unit && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {item.quantity} {item.unit}
                                      </span>
                                    )}
                                    {item.color && (
                                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                        {item.color}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Henüz stand elementi seçilmemiş.</p>
                      )}
                    </div>

                    {/* 3. Icon'lu Element Seçimleri */}
                    <div className="bg-white rounded-lg p-5 shadow-sm">
                      <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                        ⚙️ Teknik Elementler
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(stepData.standElements || {}).map(([key, selected]) => 
                          selected && (
                            <div key={key} className="bg-purple-50 text-purple-800 p-2 rounded text-sm font-medium text-center">
                              {key === 'truss' && '🏗️ Truss'}
                              {key === 'specialLighting' && '💡 Özel Aydınlatma'}
                              {key === 'soundSystem' && '🔊 Ses Sistemi'}
                              {key === 'ledScreen' && '📱 Led Ekran'}
                              {key === 'brochureRack' && '📄 Broşürlük'}
                              {key === 'ramp' && '🛤️ Rampa'}
                              {key === 'waterConnection' && '🚰 Su Bağlantısı'}
                              {key === 'videowall' && '📺 Videowall'}
                            </div>
                          )
                        )}
                      </div>
                      {!Object.values(stepData.standElements || {}).some(Boolean) && (
                        <p className="text-gray-500 text-sm">Henüz teknik element seçilmemiş.</p>
                      )}
                    </div>

                    {/* 4. Hizmet ve Teknoloji */}
                    <div className="bg-white rounded-lg p-5 shadow-sm">
                      <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                        🛠️ Hizmet ve Teknoloji
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(stepData.serviceElements || {}).map(([key, selected]) => 
                          selected && (
                            <div key={key} className="bg-orange-50 text-orange-800 p-2 rounded text-sm font-medium text-center">
                              {key === 'airForMachines' && '🌬️ Hava'}
                              {key === 'wifi' && '📶 Wifi'}
                              {key === 'tabletKiosk' && '📱 Tablet Kiosk'}
                              {key === 'touchKiosk' && '🖥️ Dokunmatik Kiosk'}
                              {key === 'jewelryShowcase' && '💎 Özel Vitrin'}
                              {key === 'hostess' && '👩‍💼 Host/Hostess'}
                              {key === 'waiter' && '🍽️ Garson'}
                              {key === 'barista' && '☕ Barista'}
                            </div>
                          )
                        )}
                      </div>
                      {!Object.values(stepData.serviceElements || {}).some(Boolean) && (
                        <p className="text-gray-500 text-sm">Henüz hizmet seçilmemiş.</p>
                      )}
                    </div>

                    {/* 5. Seçilen Hizmetler (Checkbox) */}
                    <div className="bg-white rounded-lg p-5 shadow-sm">
                      <h4 className="text-lg font-semibold text-teal-900 mb-3 flex items-center">
                        ✅ Seçilen Hizmetler
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(selectedServices || {}).map(([key, selected]) => 
                          selected && (
                            <div key={key} className="bg-teal-50 border-l-4 border-teal-400 p-3">
                              <div className="text-sm font-medium text-teal-900">
                                {key === 'cleaning_during_fair' && 'Fuar süresince Fuar saatlerinde temizlik görevlisi'}
                                {key === 'cleaning_after_fair' && 'Fuar süresince Fuar kapandıktan sonra temizlik'}
                                {key === 'sweep_after_fair' && 'Fuar süresince Fuar kapandıktan sonra sadece süpürge'}
                                {key === 'special_product_cleaning' && 'Müşteri ait ürünlere özel temizlik'}
                                {key === 'steel_polishing' && 'Paslanmaz çelikler için parlatma hizmeti'}
                                {key === 'security_setup' && 'Kurulum süresince güvenlik görevlisi'}
                                {key === 'security_during_fair' && 'Fuar süresince fuar saatlerinde güvenlik görevlisi'}
                                {key === 'security_after_fair' && 'Fuar süresince fuar kapandıktan sonra güvenlik görevlisi'}
                                {key === 'security_dismantling' && 'Söküm süresince güvenlik görevlisi'}
                                {key === 'translator' && 'Fuar süresince fuar saatlerinde tercüman'}
                                {key === 'technical_staff' && 'Fuar süresince fuar saatlerinde teknik görevli'}
                                {key === 'chef' && 'Fuar süresince Fuar saatlerinde aşçı'}
                                {key === 'presenter' && 'Fuar süresince Fuar saatlerinde sunucu'}
                              </div>
                              {serviceDetails[key] && (
                                <div className="mt-2 text-sm text-teal-700 bg-white p-2 rounded">
                                  <strong>Detay:</strong> {serviceDetails[key]}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                      {!Object.values(selectedServices || {}).some(Boolean) && (
                        <p className="text-gray-500 text-sm">Henüz hizmet seçilmemiş.</p>
                      )}
                    </div>

                    {/* 6. Detaylı Brief */}
                    {stepData.detailedBrief && (
                      <div className="bg-white rounded-lg p-5 shadow-sm">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          📝 Detaylı Brief
                        </h4>
                        <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">
                          {stepData.detailedBrief}
                        </div>
                      </div>
                    )}

                    {/* 7. Tasarım Dosyaları */}
                    <div className="bg-white rounded-lg p-5 shadow-sm">
                      <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                        🎨 Tasarım Dosyaları
                      </h4>
                      <div className="space-y-3">
                        {stepData.designFiles && stepData.designFiles.length > 0 ? (
                          <div className="space-y-2">
                            {stepData.designFiles.map((file, index) => (
                              <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded">
                                <span className="text-2xl">
                                  {file.name.toLowerCase().endsWith('.pdf') ? '📄' : 
                                   file.name.toLowerCase().match(/\.(jpg|jpeg|png)$/) ? '🖼️' : 
                                   file.name.toLowerCase().endsWith('.zip') ? '🗂️' : 
                                   file.name.toLowerCase().endsWith('.cad') ? '📐' : '📁'}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                  {file.size && (
                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Henüz tasarım dosyası yüklenmemiş.</p>
                        )}
                      </div>
                    </div>

                    {/* 8. Rapor Bilgileri */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border-2 border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                        📊 Rapor Bilgileri
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Brief ID:</strong> {stepData.briefId}</p>
                          <p><strong>Oluşturulma:</strong> {new Date().toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div>
                          <p><strong>Durum:</strong> <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Tamamlandı</span></p>
                          <p><strong>Link:</strong> <a href={`https://vitingo-dashboard.preview.emergentagent.com/dashboard#brief-${stepData.briefId}`} className="text-blue-600 underline text-xs">Brief'i Görüntüle</a></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Mail Sending Modal */}
        {isMailModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Brief Mail Gönder</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMailModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                console.log('Mail gönderiliyor:', mailData);
                showToast('Mail başarıyla gönderildi!', 'success');
                setIsMailModalOpen(false);
                // TODO: Implement actual email sending
              }} className="space-y-4">
                {/* To Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alıcı Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={mailData.toEmail}
                    onChange={(e) => setMailData({...mailData, toEmail: e.target.value})}
                    placeholder="ornek@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konu
                  </label>
                  <input
                    type="text"
                    value={mailData.subject}
                    onChange={(e) => setMailData({...mailData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mesaj
                  </label>
                  <textarea
                    value={mailData.message}
                    onChange={(e) => setMailData({...mailData, message: e.target.value})}
                    placeholder={`Merhaba,\n\nStand brief dosyamı sizinle paylaşıyorum.\n\nBrief ID: ${stepData.briefId}\nLink: https://vitingo-dashboard.preview.emergentagent.com/dashboard#brief-${stepData.briefId}\n\nİyi çalışmalar.`}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMailModalOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Gönder
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Final Success Modal */}
        {isFinalSuccessModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto shadow-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-8 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">🎉 Brief Başarıyla Tamamlandı!</h2>
                      <p className="text-green-100 mt-1">Stand tasarım brief'iniz hazır ve paylaşıma uygun</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFinalSuccessModalOpen(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-8">
                {/* Brief Summary Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    📋 Brief Özeti
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Brief ID:</span>
                        <span className="text-blue-600 font-bold">{stepData.briefId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Oluşturulma Tarihi:</span>
                        <span className="text-gray-900">{new Date().toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Proje:</span>
                        <span className="text-gray-900">{stepData.selectedProject || formData.projectName || 'Belirtilmemiş'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Müşteri:</span>
                        <span className="text-gray-900">{customers.find(c => c.id.toString() === formData.customerId)?.companyName || 'Belirtilmemiş'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Etkinlik:</span>
                        <span className="text-gray-900">{stepData.eventName || formData.eventName || 'Belirtilmemiş'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Tarih:</span>
                        <span className="text-gray-900">{stepData.eventDate || formData.eventDate || 'Belirtilmemiş'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Konum:</span>
                        <span className="text-gray-900">{stepData.eventLocation || formData.eventLocation || 'Belirtilmemiş'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Stand Alanı:</span>
                        <span className="text-gray-900 font-bold text-purple-600">{stepData.calculatedArea || '0,00'} m²</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files Section */}
                {((stepData.designFiles && stepData.designFiles.length > 0) || (stepData.briefFile)) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      📁 Yüklenen Dosyalar
                    </h3>
                    <div className="space-y-3">
                      {stepData.briefFile && (
                        <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">📄</span>
                            <div>
                              <p className="font-medium text-gray-900">Brief Dosyası</p>
                              <p className="text-sm text-gray-500">{stepData.briefFile.name}</p>
                            </div>
                          </div>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            Hazır
                          </span>
                        </div>
                      )}
                      {stepData.designFiles && stepData.designFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {file.name.toLowerCase().endsWith('.pdf') ? '📄' : 
                               file.name.toLowerCase().match(/\.(jpg|jpeg|png)$/) ? '🖼️' : 
                               file.name.toLowerCase().endsWith('.zip') ? '🗂️' : 
                               file.name.toLowerCase().endsWith('.cad') ? '📐' : '📁'}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              {file.size && (
                                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                              )}
                            </div>
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            Tasarım
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <div className="text-sm text-gray-500">
                    Brief Link: <a href={`https://vitingo-dashboard.preview.emergentagent.com/dashboard#brief-${stepData.briefId}`} 
                               className="text-blue-600 underline">Brief'i Görüntüle</a>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      onClick={() => {
                        setIsFinalSuccessModalOpen(false);
                        onBackToDashboard();
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                      </svg>
                      Dashboard'a Dön
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                
                showToast('info', 'Taslak Kaydedildi!', 'Brief taslak olarak kaydedildi!');
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
              showToast={showToast}
            />
          </div>
        </div>
      )}

      {/* Add Element Modal */}
      {isAddElementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {elementModalData.editMode ? (
                  <>
                    {elementModalData.level === 'main' && 'Ana Element Düzenle'}
                    {elementModalData.level === 'sub' && 'Alt Kategori Düzenle'}
                    {elementModalData.level === 'subSub' && 'Alt Detay Düzenle'}
                  </>
                ) : (
                  <>
                    {elementModalData.level === 'main' && 'Yeni Ana Element Ekle'}
                    {elementModalData.level === 'sub' && 'Yeni Alt Kategori Ekle'}
                    {elementModalData.level === 'subSub' && 'Yeni Alt Detay Ekle'}
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsAddElementModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <AddElementForm 
              level={elementModalData.level}
              parentKey={elementModalData.parentKey}
              parentSubKey={elementModalData.parentSubKey}
              editMode={elementModalData.editMode}
              editData={elementModalData.editData}
              onSuccess={handleAddElement}
              onCancel={() => setIsAddElementModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Manage Elements Modal */}
      {isManageElementsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Stand Elementlerini Yönet</h3>
              <button
                onClick={() => setIsManageElementsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <ManageElementsPanel 
              elementsConfig={standElementsConfig}
              onEdit={handleEditElement}
              onDelete={handleDeleteElement}
              onAddChild={handleAddChildElement}
            />
          </div>
        </div>
      )}

      {/* Professional Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{confirmationModal.title}</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 whitespace-pre-line">{confirmationModal.message}</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={confirmationModal.onCancel}
                className="px-6 py-2"
              >
                İptal
              </Button>
              <Button
                type="button"
                onClick={confirmationModal.onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
              >
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold">
                  {newCategoryData.editMode ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
                </h3>
                {newCategoryData.editMode && (
                  <p className="text-sm text-gray-600 mt-1">
                    Düzenlenen: {newCategoryData.editPathString?.replace(/\./g, ' → ')}
                  </p>
                )}
                {!newCategoryData.editMode && newCategoryData.parentPath && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Alt kategori ekleniyor:</span><br />
                    {newCategoryData.parentPath.replace(/\./g, ' → ')}
                  </p>
                )}
                {!newCategoryData.editMode && !newCategoryData.parentPath && (
                  <p className="text-sm text-gray-600 mt-1">
                    Ana element dropdown'una kategori ekleniyor
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setIsNewCategoryModalOpen(false);
                  setNewCategoryData({
                    label: '',
                    parentPath: null,
                    editMode: false,
                    editKey: null,
                    editPathString: null
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Simple Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newCategoryData.editMode ? 'Kategori Adı' : 'Alt Kategori Adı'}
                </label>
                <Input
                  type="text"
                  value={newCategoryData.label}
                  onChange={(e) => setNewCategoryData(prev => ({...prev, label: e.target.value}))}
                  placeholder={newCategoryData.editMode ? "Kategori adını girin" : "Alt kategori adını girin"}
                  className="w-full"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewCategoryModalOpen(false);
                  setNewCategoryData({
                    label: '',
                    parentPath: null,
                    editMode: false,
                    editKey: null,
                    editPathString: null
                  });
                }}
              >
                İptal
              </Button>
              <Button
                type="button"
                onClick={handleAddNewCategory}
                disabled={!newCategoryData.label}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {newCategoryData.editMode ? 'Güncelle' : 'Kategori Ekle'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modal */}
      {isFeatureModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold">Özellik Ekle</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Ekleniyor:</span><br />
                  {featureModalData.currentPath.map((key, idx) => {
                    let config = standElementsConfig;
                    for (let i = 0; i <= idx; i++) {
                      if (i === 0) {
                        config = config[featureModalData.currentPath[i]];
                      } else {
                        config = config.structure?.[featureModalData.currentPath[i]] || config.children?.[featureModalData.currentPath[i]];
                      }
                    }
                    return config?.label || key;
                  }).join(' → ')}
                </p>
              </div>
              <button
                onClick={() => setIsFeatureModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Özellik Adı
                </label>
                <Input
                  type="text"
                  value={featureModalData.featureName}
                  onChange={(e) => setFeatureModalData(prev => ({...prev, featureName: e.target.value}))}
                  placeholder="Örn: Renk, Boyut, Materyal"
                  className="w-full"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Özellik Türü
                </label>
                <select
                  value={featureModalData.featureType}
                  onChange={(e) => setFeatureModalData(prev => ({...prev, featureType: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Metin</option>
                  <option value="select">Seçenek Listesi</option>
                  <option value="number">Sayı</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Özellik Değeri
                </label>
                {featureModalData.featureType === 'select' ? (
                  <Textarea
                    value={featureModalData.featureValue}
                    onChange={(e) => setFeatureModalData(prev => ({...prev, featureValue: e.target.value}))}
                    placeholder="Her satıra bir seçenek yazın&#10;Örn:&#10;Kırmızı&#10;Mavi&#10;Yeşil"
                    className="w-full"
                    rows={4}
                  />
                ) : featureModalData.featureType === 'number' ? (
                  <input
                    type="text"
                    inputMode="decimal"
                    value={featureModalData.featureValue || ''}
                    onChange={(e) => setFeatureModalData(prev => ({...prev, featureValue: e.target.value}))}
                    placeholder="Örn: 100,00"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                    style={{ pointerEvents: 'auto', zIndex: 10 }}
                  />
                ) : (
                  <Input
                    type="text"
                    value={featureModalData.featureValue}
                    onChange={(e) => setFeatureModalData(prev => ({...prev, featureValue: e.target.value}))}
                    placeholder="Örn: Ahşap, 2x1 metre"
                    className="w-full"
                  />
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFeatureModalOpen(false)}
              >
                İptal
              </Button>
              <Button
                type="button"
                onClick={() => {
                  console.log('Özellik eklendi:', featureModalData);
                  
                  // Create path key for current selection
                  const pathKey = featureModalData.currentPath.join('.');
                  
                  // Create feature object
                  const newFeature = {
                    name: featureModalData.featureName,
                    value: featureModalData.featureValue,
                    type: featureModalData.featureType,
                    createdAt: new Date().toISOString()
                  };
                  
                  // Add feature to stepData
                  setStepData(prev => ({
                    ...prev,
                    features: {
                      ...prev.features,
                      [pathKey]: [
                        ...(prev.features[pathKey] || []),
                        newFeature
                      ]
                    }
                  }));
                  
                  showToast('success', 'Özellik Eklendi!', `${featureModalData.featureName} özelliği başarıyla eklendi.`);
                  
                  setIsFeatureModalOpen(false);
                  setFeatureModalData({
                    level: 0,
                    currentPath: [],
                    featureName: '',
                    featureValue: '',
                    featureType: 'text'
                  });
                }}
                disabled={!featureModalData.featureName || !featureModalData.featureValue}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Özellik Ekle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Toast Notification */}
      {toastMessage.isVisible && (
        <div className="fixed top-4 right-4 z-[70] animate-slideIn">
          <div className={`rounded-lg shadow-lg p-4 max-w-sm w-full ${
            toastMessage.type === 'success' ? 'bg-green-50 border-l-4 border-green-400' :
            toastMessage.type === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
            toastMessage.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
            'bg-blue-50 border-l-4 border-blue-400'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {toastMessage.type === 'success' && (
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {toastMessage.type === 'error' && (
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {toastMessage.type === 'warning' && (
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  toastMessage.type === 'success' ? 'text-green-800' :
                  toastMessage.type === 'error' ? 'text-red-800' :
                  toastMessage.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {toastMessage.title}
                </p>
                <p className={`text-sm mt-1 ${
                  toastMessage.type === 'success' ? 'text-green-700' :
                  toastMessage.type === 'error' ? 'text-red-700' :
                  toastMessage.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {toastMessage.message}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setToastMessage(prev => ({ ...prev, isVisible: false }))}
                    className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      toastMessage.type === 'success' ? 'text-green-400 hover:bg-green-100 focus:ring-green-600' :
                      toastMessage.type === 'error' ? 'text-red-400 hover:bg-red-100 focus:ring-red-600' :
                      toastMessage.type === 'warning' ? 'text-yellow-400 hover:bg-yellow-100 focus:ring-yellow-600' :
                      'text-blue-400 hover:bg-blue-100 focus:ring-blue-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Manage Elements Panel Component
// Draggable Item Component
function DraggableElement({ elementKey, elementData, path, depth, index, moveElement, onEdit, onDelete, onAddChild }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'element',
    item: { elementKey, path, depth, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'element',
    hover: (item) => {
      if (item.index !== index) {
        moveElement(item.index, index);
        item.index = index;
      }
    },
  });

  const currentPath = [...path, elementKey];
  const pathString = currentPath.join('.');
  
  // Color scheme based on depth
  const bgColors = [
    'bg-gray-50',    // Main elements
    'bg-blue-50',    // Level 1
    'bg-green-50',   // Level 2  
    'bg-purple-50',  // Level 3
    'bg-orange-50',  // Level 4
    'bg-pink-50'     // Level 5+
  ];
  
  const bgColor = bgColors[depth] || bgColors[bgColors.length - 1];
  const marginLeft = depth * 24; // 24px per level
  
  return (
    <div 
      ref={(node) => drag(drop(node))}
      className={`flex items-center justify-between p-3 ${bgColor} rounded border-l-4 border-l-blue-400 cursor-move ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      style={{ marginLeft: `${marginLeft}px` }}
    >
      <div className="flex items-center space-x-3">
        <GripVertical className="h-5 w-5 text-gray-400" />
        {elementData.icon && <span className="text-lg">{elementData.icon}</span>}
        <div>
          <h4 className={`font-medium ${depth === 0 ? 'text-lg' : 'text-sm'}`}>
            {elementData.label}
          </h4>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {depth === 0 ? `Ana Element: ${elementKey}` : `Path: ${pathString}`}
            </span>
            {elementData.required && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-orange-100 text-orange-800">
                Zorunlu
              </span>
            )}
            {elementData.element_type && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                {elementData.element_type}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex space-x-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddChild(pathString)}
          className="text-green-600 border-green-300 hover:bg-green-50"
        >
          <Plus className="h-3 w-3 mr-1" />
          Alt Ekle
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(pathString, elementData)}
          className="text-blue-600 border-blue-300 hover:bg-blue-50"
        >
          <Eye className="h-3 w-3 mr-1" />
          Düzenle
        </Button>
        <Button
          size="sm" 
          variant="outline"
          onClick={() => onDelete(pathString)}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <X className="h-3 w-3 mr-1" />
          Sil
        </Button>
      </div>
    </div>
  );
}

function ManageElementsPanel({ elementsConfig, onEdit, onDelete, onAddChild }) {
  const [elements, setElements] = useState([]);

  // Convert elementsConfig to flat array for drag&drop
  useEffect(() => {
    const flattenElements = (config) => {
      const result = [];
      const processElement = (key, data, path = [], depth = 0) => {
        result.push({ key, data, path, depth });
        
        // Process children recursively - handle both structure (main level) and children (nested)
        const children = depth === 0 ? data.structure : data.children;
        
        // Check if children exists and has content (not null and not empty object)
        if (children && Object.keys(children).length > 0) {
          Object.entries(children).forEach(([childKey, childData]) => {
            processElement(childKey, childData, [...path, key], depth + 1);
          });
        }
      };

      // Only process if config is defined and not empty
      if (config && Object.keys(config).length > 0) {
        Object.entries(config).forEach(([key, data]) => {
          processElement(key, data, [], 0);
        });
      }

      return result;
    };

    setElements(flattenElements(elementsConfig));
  }, [elementsConfig]);

  // Handle drag & drop reordering
  const moveElement = (fromIndex, toIndex) => {
    const newElements = [...elements];
    const [movedElement] = newElements.splice(fromIndex, 1);
    newElements.splice(toIndex, 0, movedElement);
    setElements(newElements);
    
    // TODO: Send reorder request to backend
    console.log('Element reordered:', { from: fromIndex, to: toIndex, element: movedElement.key });
  };

  // Elements are now handled by DraggableElement components

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="mb-4 p-3 bg-blue-100 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Stand Elementleri Yönetimi</h3>
          <p className="text-sm text-blue-800">
            Bu panelde tüm stand elementlerini ve alt kategorilerini görüntüleyebilir, düzenleyebilir veya silebilirsiniz.
            Elementleri sürükleyerek yeniden sıralayabilirsiniz.
          </p>
        </div>
        
        <div className="space-y-2">
          {elements.map((element, index) => (
            <DraggableElement
              key={`${element.path.join('.')}.${element.key}-${index}`}
              elementKey={element.key}
              elementData={element.data}
              path={element.path}
              depth={element.depth}
              index={index}
              moveElement={moveElement}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
        
        {elements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Henüz hiç stand elementi tanımlanmamış.</p>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

// Add Element Form Component
function AddElementForm({ level, parentKey, parentSubKey, editMode = false, editData = null, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    key: editData?.key || '',
    label: editData?.label || '',
    icon: editData?.icon || '',
    required: editData?.required || false
  });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSuccess(formData);
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const generateKey = (label) => {
    return label.toLowerCase()
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ı/g, 'i')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };
  
  const handleLabelChange = (value) => {
    setFormData(prev => ({
      ...prev,
      label: value,
      key: generateKey(value)
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {level === 'main' && parentKey && (
        <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
          <p className="text-sm text-blue-800">
            <strong>Ana Element:</strong> {parentKey}
          </p>
        </div>
      )}
      
      {level === 'subSub' && parentKey && parentSubKey && (
        <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-400">
          <p className="text-sm text-purple-800">
            <strong>Üst Kategori:</strong> {parentKey} → {parentSubKey}
          </p>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Element Adı *
        </label>
        <Input
          type="text"
          value={formData.label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Örn: Yeni Zemin Türü, Özel Mobilya"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Anahtar (Otomatik)
        </label>
        <Input
          type="text"
          value={formData.key}
          onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
          placeholder="Otomatik oluşturulur"
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500 mt-1">
          Bu değer otomatik oluşturulur, gerekirse düzenleyebilirsiniz
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          İkon (Opsiyonel)
        </label>
        <Input
          type="text"
          value={formData.icon}
          onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
          placeholder="Örn: 🏗️, 🔧, 💡"
          maxLength={5}
        />
      </div>
      
      {level === 'main' && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="required"
            checked={formData.required}
            onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="required" className="text-sm text-gray-700">
            Zorunlu element (En az bir alt seçenek seçilmeli)
          </label>
        </div>
      )}
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={loading || !formData.label.trim() || !formData.key.trim()}>
          {loading ? (editMode ? 'Güncelleniyor...' : 'Ekleniyor...') : (editMode ? 'Güncelle' : 'Ekle')}
        </Button>
      </div>
    </form>
  );
}

// New Country Profile Form Component  
function NewCountryProfileForm({ onSuccess, onCancel, showToast }) {
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
        showToast('error', 'Hata!', error.detail || 'Ülke profili oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating country profile:', error);
      showToast('error', 'Hata!', 'Bir hata oluştu, lütfen tekrar deneyin.');
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