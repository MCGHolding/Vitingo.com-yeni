import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Plus, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Palette, Type, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Kullanılabilir Değişkenler
const AVAILABLE_VARIABLES = [
  { id: 'company_logo', label: '🏢 Logo', type: 'image', variable: '{{company_logo}}' },
  { id: 'company_name', label: '📝 Firma', type: 'text', variable: '{{company_name}}' },
  { id: 'fair_name', label: '🎯 Fuar', type: 'text', variable: '{{fair_name}}' },
  { id: 'country', label: '🌍 Ülke', type: 'text', variable: '{{country}}' },
  { id: 'city', label: '🏙️ Şehir', type: 'text', variable: '{{city}}' },
  { id: 'start_date', label: '📅 Başlangıç', type: 'text', variable: '{{start_date}}' },
  { id: 'end_date', label: '📅 Bitiş', type: 'text', variable: '{{end_date}}' },
  { id: 'venue', label: '🏢 Merkez', type: 'text', variable: '{{venue}}' },
  { id: 'prepared_by', label: '👤 Hazırlayan', type: 'text', variable: '{{prepared_by}}' },
  { id: 'prepared_title', label: '💼 Görev', type: 'text', variable: '{{prepared_title}}' },
  { id: 'prepared_date', label: '📆 Tarih', type: 'text', variable: '{{prepared_date}}' }
];

const CoverPageCanvasDesigner = ({ isOpen, onClose, profileData, onSave }) => {
  const [libraryTemplates, setLibraryTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customBackgroundImage, setCustomBackgroundImage] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [nextId, setNextId] = useState(1);
  const canvasRef = useRef(null);

  // Load templates from library on mount
  useEffect(() => {
    const loadLibraryTemplates = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/library/design-templates?category=cover_page`);
        if (response.ok) {
          const data = await response.json();
          setLibraryTemplates(data);
          // Select first template by default if available
          if (data.length > 0) {
            setSelectedTemplate(data[0].id);
            setCustomBackgroundImage(data[0].image_url);
          }
        }
      } catch (error) {
        console.error('Error loading library templates:', error);
      }
    };
    if (isOpen) {
      loadLibraryTemplates();
    }
  }, [isOpen]);

  // Apply template
  const applyTemplate = (template) => {
    setSelectedTemplate(template.id);
    setCustomBackgroundImage(template.image_url);
    // Reset elements when changing template
    setElements([]);
    setSelectedElement(null);
    toast.success('Şablon uygulandı');
  };

  // Handle custom background image upload
  const handleCustomImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resim boyutu 5MB\'dan küçük olmalı');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomBackgroundImage(reader.result);
      setSelectedTemplate('custom_upload');
      toast.success('Arka plan resmi yüklendi!');
    };
    reader.onerror = () => {
      toast.error('Resim yüklenirken hata oluştu');
    };
    reader.readAsDataURL(file);
  };

  // Add element to canvas
  const handleAddVariable = (variable) => {
    const newElement = {
      id: `elem_${nextId}`,
      type: variable.type,
      variable: variable.variable,
      label: variable.label,
      x: 50,
      y: 50 + (elements.length * 40),
      width: variable.type === 'image' ? 150 : 300,
      height: variable.type === 'image' ? 60 : 40,
      fontSize: 24,
      fontFamily: 'Inter',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#000000',
      textAlign: 'left',
      backgroundColor: 'transparent'
    };
    
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setNextId(nextId + 1);
    toast.success(`${variable.label} eklendi`);
  };

  // Update element
  const updateElement = (id, updates) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  // Delete element
  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
    toast.success('Element silindi');
  };

  // Toggle style
  const toggleStyle = (property, value1, value2) => {
    if (!selectedElement) return;
    const element = elements.find(el => el.id === selectedElement);
    const newValue = element[property] === value1 ? value2 : value1;
    updateElement(selectedElement, { [property]: newValue });
  };

  const handleSave = () => {
    const template = {
      selectedTemplate: selectedTemplate,
      customBackgroundImage: customBackgroundImage, // Store custom image
      elements: elements,
      canvasWidth: 794, // A4 width in pixels at 96 DPI
      canvasHeight: 1123 // A4 height in pixels at 96 DPI
    };
    onSave(template);
    toast.success('Şablon kaydedildi!');
    onClose();
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full h-[90vh] max-w-[95vw] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <h2 className="text-xl font-bold">🎨 Kapak Sayfası Canvas Tasarımcısı</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Templates + Variables */}
          <div className="w-56 border-r bg-gray-50 overflow-y-auto">
            {/* Templates */}
            <div className="p-3 border-b bg-white">
              <h3 className="font-semibold text-gray-700 text-xs mb-2 flex items-center">
                <Palette className="w-3 h-3 mr-1" />
                Şablonlar
              </h3>
              
              {/* Library Templates */}
              <div className="space-y-2">
                {libraryTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className={`w-full rounded border overflow-hidden transition ${
                      selectedTemplate === template.id
                        ? 'ring-2 ring-purple-500 border-purple-500'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <img
                      src={template.image_url}
                      alt={template.name}
                      className="w-full h-20 object-cover"
                    />
                    <div className="p-1 bg-white text-xs text-gray-700 truncate">
                      {template.name}
                    </div>
                  </button>
                ))}
                
                {/* Custom upload option */}
                <label className="block w-full cursor-pointer">
                  <div className={`w-full rounded border p-3 text-center transition ${
                    selectedTemplate === 'custom_upload'
                      ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-50'
                      : 'border-dashed border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                  }`}>
                    <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <span className="text-xs text-gray-600">Kendi Resminiz</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomImageUpload}
                    className="hidden"
                  />
                </label>
                
                {libraryTemplates.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Şablon yüklenıyor...
                  </p>
                )}
              </div>
            </div>

            {/* Variables */}
            <div className="p-3">
              <h3 className="font-semibold text-gray-700 text-xs mb-2 flex items-center">
                <Plus className="w-3 h-3 mr-1" />
                Değişkenler
              </h3>
              <div className="space-y-1">
                {AVAILABLE_VARIABLES.map(variable => (
                  <button
                    key={variable.id}
                    onClick={() => handleAddVariable(variable)}
                    className="w-full text-left px-2 py-1.5 bg-white border border-gray-200 rounded hover:border-purple-400 hover:bg-purple-50 transition text-xs"
                  >
                    {variable.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Canvas */}
          <div className="flex-1 bg-gray-100 p-6 overflow-auto flex items-center justify-center">
            <div
              ref={canvasRef}
              className="shadow-2xl relative bg-white"
              style={{
                width: '794px',
                height: '1123px',
                transform: 'scale(0.65)',
                transformOrigin: 'center',
                border: '2px solid #e5e7eb',
                backgroundImage: customBackgroundImage ? `url(${customBackgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Upload prompt when no template selected */}
              {!customBackgroundImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-5xl">🎨</span>
                    </div>
                    <p className="text-lg font-medium text-gray-700">Şablon Seçin</p>
                    <p className="text-sm text-gray-500 mt-1">Sol taraftan bir şablon seçin veya kendi resminizi yükleyin</p>
                  </div>
                </div>
              )}
              
              {/* Grid background */}
              <div className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: 'linear-gradient(#999 1px, transparent 1px), linear-gradient(90deg, #999 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />

              {/* Elements */}
              {elements.map(element => (
                <Rnd
                  key={element.id}
                  position={{ x: element.x, y: element.y }}
                  size={{ width: element.width, height: element.height }}
                  onDragStop={(e, d) => {
                    updateElement(element.id, { x: d.x, y: d.y });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    updateElement(element.id, {
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                      ...position
                    });
                  }}
                  onClick={() => setSelectedElement(element.id)}
                  bounds="parent"
                  className={`${selectedElement === element.id ? 'ring-2 ring-purple-500' : ''}`}
                >
                  <div
                    className="w-full h-full flex items-center justify-center cursor-move relative group"
                    style={{
                      fontSize: `${element.fontSize}px`,
                      fontWeight: element.fontWeight,
                      fontStyle: element.fontStyle,
                      textDecoration: element.textDecoration,
                      color: element.color,
                      textAlign: element.textAlign,
                      backgroundColor: element.backgroundColor,
                      padding: '4px'
                    }}
                  >
                    {element.type === 'image' ? (
                      <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    ) : (
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                        {element.variable}
                      </span>
                    )}
                    
                    {/* Delete button */}
                    {selectedElement === element.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(element.id);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Rnd>
              ))}

              {/* Empty state */}
              {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Type className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Soldan değişken ekleyerek başlayın</p>
                    <p className="text-sm">Sürükle, boyutlandır, düzenle</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Properties */}
          <div className="w-60 border-l bg-gray-50 p-3 overflow-y-auto">
            <h3 className="font-semibold text-gray-700 text-xs mb-2">⚙️ Özellikler</h3>
            
            {selectedElementData ? (
              <div className="space-y-3">
                <div className="text-xs">
                  <p className="text-gray-500">Element</p>
                  <p className="font-medium">{selectedElementData.label}</p>
                </div>

                {selectedElementData.type === 'text' && (
                  <>
                    {/* Font Family */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Font</label>
                      <select
                        value={selectedElementData.fontFamily || 'Inter'}
                        onChange={(e) => updateElement(selectedElement, { fontFamily: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border rounded"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Courier New">Courier New</option>
                      </select>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Boyut: {selectedElementData.fontSize}px</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="8"
                          max="120"
                          value={selectedElementData.fontSize}
                          onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) })}
                          className="flex-1 h-1"
                        />
                        <input
                          type="number"
                          min="8"
                          max="200"
                          value={selectedElementData.fontSize}
                          onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) || 24 })}
                          className="w-14 px-1 py-0.5 text-xs border rounded text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Stil</label>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => toggleStyle('fontWeight', 'normal', 'bold')}
                          className={`flex-1 py-1.5 border rounded text-xs ${selectedElementData.fontWeight === 'bold' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <Bold className="w-3 h-3 mx-auto" />
                        </button>
                        <button
                          onClick={() => toggleStyle('fontStyle', 'normal', 'italic')}
                          className={`flex-1 py-1.5 border rounded text-xs ${selectedElementData.fontStyle === 'italic' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <Italic className="w-3 h-3 mx-auto" />
                        </button>
                        <button
                          onClick={() => toggleStyle('textDecoration', 'none', 'underline')}
                          className={`flex-1 py-1.5 border rounded text-xs ${selectedElementData.textDecoration === 'underline' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <Underline className="w-3 h-3 mx-auto" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hizalama</label>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => updateElement(selectedElement, { textAlign: 'left' })}
                          className={`flex-1 py-1.5 border rounded ${selectedElementData.textAlign === 'left' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <AlignLeft className="w-3 h-3 mx-auto" />
                        </button>
                        <button
                          onClick={() => updateElement(selectedElement, { textAlign: 'center' })}
                          className={`flex-1 py-1.5 border rounded ${selectedElementData.textAlign === 'center' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <AlignCenter className="w-3 h-3 mx-auto" />
                        </button>
                        <button
                          onClick={() => updateElement(selectedElement, { textAlign: 'right' })}
                          className={`flex-1 py-1.5 border rounded ${selectedElementData.textAlign === 'right' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <AlignRight className="w-3 h-3 mx-auto" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Renk</label>
                      <input
                        type="color"
                        value={selectedElementData.color}
                        onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                        className="w-full h-8 rounded border"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={() => deleteElement(selectedElement)}
                  className="w-full px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Sil</span>
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-400 mt-6">
                <p className="text-xs">Canvas&apos;ta bir</p>
                <p className="text-xs">element seçin</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{elements.length}</span> element
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={elements.length === 0}
              className="px-6 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Kaydet ve Kullan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverPageCanvasDesigner;
