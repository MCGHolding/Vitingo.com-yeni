import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { X, Plus, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Palette, Type, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Arka Plan Şablonları
const TEMPLATES = [
  { id: 'minimal', name: 'Minimal', bg: 'bg-white' },
  { id: 'gradient_blue', name: 'Mavi Gradient', bg: 'bg-gradient-to-br from-blue-50 to-blue-100' },
  { id: 'gradient_purple', name: 'Mor Gradient', bg: 'bg-gradient-to-br from-purple-50 to-pink-50' },
  { id: 'sidebar', name: 'Yan Panel', bg: 'bg-white', sidebar: true },
  { id: 'split', name: 'Bölünmüş', bg: 'bg-white', split: true },
  { id: 'diagonal', name: 'Çapraz', bg: 'bg-white', diagonal: true },
  { id: 'geometric', name: 'Geometrik', bg: 'bg-white', geometric: true },
  { id: 'wave', name: 'Dalga', bg: 'bg-white', wave: true },
  { id: 'gradient_warm', name: 'Sıcak Gradient', bg: 'bg-gradient-to-br from-orange-50 to-red-50' },
  { id: 'gradient_green', name: 'Yeşil Gradient', bg: 'bg-gradient-to-br from-green-50 to-teal-50' },
  { id: 'custom_image', name: '📤 Kendi Resminiz', bg: 'bg-gray-100', custom: true }
];

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
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [nextId, setNextId] = useState(1);
  const canvasRef = useRef(null);

  // Apply template
  const applyTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    // Reset elements when changing template
    setElements([]);
    setSelectedElement(null);
    toast.success('Şablon uygulandı');
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
      fontSize: 16,
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
                Şablon
              </h3>
              <div className="grid grid-cols-2 gap-1">
                {TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template.id)}
                    className={`px-2 py-1.5 text-xs rounded border transition ${
                      selectedTemplate === template.id
                        ? 'bg-purple-500 text-white border-purple-600'
                        : 'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {template.name}
                  </button>
                ))}
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
              className={`shadow-2xl relative ${TEMPLATES.find(t => t.id === selectedTemplate)?.bg || 'bg-white'}`}
              style={{
                width: '794px',
                height: '1123px',
                transform: 'scale(0.65)',
                transformOrigin: 'center',
                border: '2px solid #e5e7eb'
              }}
            >
              {/* Template-specific backgrounds */}
              {TEMPLATES.find(t => t.id === selectedTemplate)?.sidebar && (
                <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-b from-purple-500 to-pink-500 opacity-90" />
              )}
              {TEMPLATES.find(t => t.id === selectedTemplate)?.split && (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-purple-500 opacity-90" />
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white" />
                </>
              )}
              {TEMPLATES.find(t => t.id === selectedTemplate)?.diagonal && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-transparent to-white opacity-80" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 60%)' }} />
              )}
              {TEMPLATES.find(t => t.id === selectedTemplate)?.geometric && (
                <>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 opacity-20 rounded-full" style={{ transform: 'translate(30%, -30%)' }} />
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 opacity-10" style={{ transform: 'translate(-40%, 40%) rotate(45deg)' }} />
                </>
              )}
              {TEMPLATES.find(t => t.id === selectedTemplate)?.wave && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,30 Q25,20 50,30 T100,30 L100,100 L0,100 Z" fill="url(#waveGradient)" opacity="0.15"/>
                  <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
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
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Boyut: {selectedElementData.fontSize}px</label>
                      <input
                        type="range"
                        min="8"
                        max="72"
                        value={selectedElementData.fontSize}
                        onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) })}
                        className="w-full h-1"
                      />
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
                <p className="text-xs">Canvas'ta bir</p>
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
