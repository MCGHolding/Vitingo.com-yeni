import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import VitingoPhoneInput from '../ui/SupplierPhone';
import { allCustomers } from '../../mock/customersData';
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
    // Stand Elements - Recursive Selection State
    currentPath: [], // Array of selected keys for current path
    selectedItems: [], // Array of complete selections
    standElements: {}, // For backward compatibility
    
    // Other step data
    employeeCount: '',
    employeeDetails: '',
    priceImportance: 3,
    designImportance: 3,
    designFiles: []
  });

  // Stand elements configuration - loaded dynamically from API
  const [standElementsConfig, setStandElementsConfig] = useState({});
  const [isAddElementModalOpen, setIsAddElementModalOpen] = useState(false);
  const [isManageElementsModalOpen, setIsManageElementsModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
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

  // Removed old handlers - replaced with cascade dropdown system

  // Recursive dropdown handler
  const handleRecursiveSelection = (level, value) => {
    setStepData(prev => {
      const newPath = [...prev.currentPath];
      
      // Truncate path to current level and add new selection
      newPath.length = level;
      newPath[level] = value;
      
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
      timestamp: Date.now()
    };
    
    setStepData(prev => ({
      ...prev,
      selectedItems: [...(prev.selectedItems || []), newItem],
      currentPath: []
    }));
  };

  const removeSelectionFromList = (index) => {
    setStepData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter((_, i) => i !== index)
    }));
  };

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

  // New Category or Edit Category Handler
  const handleAddNewCategory = async () => {
    try {
      if (!newCategoryData.label.trim()) {
        showToast('error', 'Hata!', 'Kategori adı gereklidir.');
        return;
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

  const canProceedFromStep2 = () => {
    // At least one item must be selected, and if Zemin is selected, it must have proper sub-options
    const hasSelections = stepData.selectedItems && stepData.selectedItems.length > 0;
    
    if (!hasSelections) return false;
    
    // Check if required elements (like Zemin/flooring) are properly configured
    const requiredElements = ['flooring']; // Elements that require selection
    const selectedElements = stepData.selectedItems.map(item => item.element);
    
    return requiredElements.every(reqElement => {
      if (!selectedElements.includes(reqElement)) return false; // Required element not selected
      
      // Check if the required element has proper sub-selections
      const elementItems = stepData.selectedItems.filter(item => item.element === reqElement);
      return elementItems.some(item => item.subOption); // At least one has sub-option
    }) || !requiredElements.some(reqElement => selectedElements.includes(reqElement)); // Or no required elements selected
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
                    {(() => {
                      const renderDropdownLevel = (level) => {
                        // Get available options for current level
                        let availableOptions = {};
                        
                        if (level === 0) {
                          // First level - main elements
                          availableOptions = standElementsConfig || {};
                        } else {
                          // Nested levels
                          const pathToCurrentLevel = stepData.currentPath.slice(0, level);
                          availableOptions = getCurrentNode(pathToCurrentLevel);
                        }

                        // If no options available, don't render this level
                        if (!availableOptions || Object.keys(availableOptions).length === 0) {
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
                          <div key={level}>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                {level + 1}. {levelLabel}
                              </label>
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
                            <Select 
                              value={stepData.currentPath[level] || ''} 
                              onValueChange={(value) => handleRecursiveSelection(level, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  level === 0 
                                    ? "Ana element seçin" 
                                    : "Alt kategori seçin"
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(availableOptions).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    {config.label}
                                    {level === 0 && config.required && <span className="text-orange-600 ml-2">*</span>}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      };

                      // Generate dropdowns dynamically based on current path and available options
                      const dropdowns = [];
                      
                      // Always show first level
                      dropdowns.push(renderDropdownLevel(0));
                      
                      // Show subsequent levels if previous level is selected and has children
                      for (let level = 1; level <= stepData.currentPath.length; level++) {
                        const dropdown = renderDropdownLevel(level);
                        if (dropdown) {
                          dropdowns.push(dropdown);
                        } else {
                          break;
                        }
                      }
                      
                      return dropdowns;
                    })()}

                    {/* Action Buttons - Yeni Kategori Ekle + Seçimi Ekle */}
                    {stepData.currentPath.length > 0 && (
                      <div className="pt-4" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px'}}>
                        <Button
                          type="button"
                          onClick={() => {
                            // Set context for current path level (last selected level)
                            const parentPath = stepData.currentPath.join('.');
                            setNewCategoryData({
                              label: '',
                              parentPath: parentPath,
                              editMode: false,
                              editKey: null,
                              editPathString: null
                            });
                            setIsNewCategoryModalOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Yeni Kategori Ekle
                        </Button>
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
                              <span className="font-medium">{item.pathString}</span>
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
                    {stepData.standElements && Object.entries(stepData.standElements).map(([elementKey, selections]) => {
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
                    Üst kategori: {newCategoryData.parentPath.replace(/\./g, ' → ')}
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
function DraggableElement({ elementKey, elementData, path, depth, index, moveElement, onEdit, onDelete }) {
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

function ManageElementsPanel({ elementsConfig, onEdit, onDelete }) {
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

    const flatElements = flattenElements(elementsConfig);
    console.log('Flattened elements for drag&drop:', flatElements.map(e => `${e.depth}: ${e.key} - ${e.data.label}`));
    setElements(flatElements);
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