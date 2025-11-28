import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { X, Plus, Trash2, Type, Image as ImageIcon, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Kullanılabilir Değişkenler
const AVAILABLE_VARIABLES = [
  { id: 'company_logo', label: '🏢 Şirket Logosu', type: 'image', variable: '{{company_logo}}' },
  { id: 'company_name', label: '📝 Firma Adı', type: 'text', variable: '{{company_name}}' },
  { id: 'fair_name', label: '🎯 Fuar Adı', type: 'text', variable: '{{fair_name}}' },
  { id: 'country', label: '🌍 Ülke', type: 'text', variable: '{{country}}' },
  { id: 'city', label: '🏙️ Şehir', type: 'text', variable: '{{city}}' },
  { id: 'start_date', label: '📅 Başlangıç Tarihi', type: 'text', variable: '{{start_date}}' },
  { id: 'end_date', label: '📅 Bitiş Tarihi', type: 'text', variable: '{{end_date}}' },
  { id: 'venue', label: '🏢 Fuar Merkezi', type: 'text', variable: '{{venue}}' },
  { id: 'prepared_by', label: '👤 Hazırlayan', type: 'text', variable: '{{prepared_by}}' },
  { id: 'prepared_title', label: '💼 Görevi', type: 'text', variable: '{{prepared_title}}' },
  { id: 'prepared_date', label: '📆 Hazırlanma Tarihi', type: 'text', variable: '{{prepared_date}}' }
];

const CoverPageCanvasDesigner = ({ isOpen, onClose, profileData, onSave }) => {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [nextId, setNextId] = useState(1);
  const canvasRef = useRef(null);

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
          {/* Left: Variables */}
          <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Değişkenler Ekle
            </h3>
            <div className="space-y-2">
              {AVAILABLE_VARIABLES.map(variable => (
                <button
                  key={variable.id}
                  onClick={() => handleAddVariable(variable)}
                  className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded hover:border-purple-500 hover:bg-purple-50 transition text-sm"
                >
                  {variable.label}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold text-gray-700 text-sm mb-2">💡 Nasıl Kullanılır?</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Değişkene tıkla → Canvas'a eklenir</li>
                <li>• Sürükle → Konumu değiştir</li>
                <li>• Köşelerden → Boyutlandır</li>
                <li>• Tıkla → Düzenle (sağ panel)</li>
                <li>• Çöp kutusu → Sil</li>
              </ul>
            </div>
          </div>

          {/* Center: Canvas */}
          <div className="flex-1 bg-gray-100 p-8 overflow-auto flex items-center justify-center">
            <div
              ref={canvasRef}
              className="bg-white shadow-2xl relative"
              style={{
                width: '794px',
                height: '1123px',
                transform: 'scale(0.7)',
                transformOrigin: 'center',
                border: '2px solid #e5e7eb'
              }}
            >
              {/* Grid background */}
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
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
          <div className="w-72 border-l bg-gray-50 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-700 mb-3">⚙️ Özellikler</h3>
            
            {selectedElementData ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Element</p>
                  <p className="text-sm font-medium">{selectedElementData.label}</p>
                </div>

                {selectedElementData.type === 'text' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Font Boyutu</label>
                      <input
                        type="range"
                        min="8"
                        max="72"
                        value={selectedElementData.fontSize}
                        onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{selectedElementData.fontSize}px</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Stil</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleStyle('fontWeight', 'normal', 'bold')}
                          className={`px-3 py-2 border rounded ${selectedElementData.fontWeight === 'bold' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStyle('fontStyle', 'normal', 'italic')}
                          className={`px-3 py-2 border rounded ${selectedElementData.fontStyle === 'italic' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStyle('textDecoration', 'none', 'underline')}
                          className={`px-3 py-2 border rounded ${selectedElementData.textDecoration === 'underline' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <Underline className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Hizalama</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateElement(selectedElement, { textAlign: 'left' })}
                          className={`px-3 py-2 border rounded ${selectedElementData.textAlign === 'left' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateElement(selectedElement, { textAlign: 'center' })}
                          className={`px-3 py-2 border rounded ${selectedElementData.textAlign === 'center' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateElement(selectedElement, { textAlign: 'right' })}
                          className={`px-3 py-2 border rounded ${selectedElementData.textAlign === 'right' ? 'bg-purple-500 text-white' : 'bg-white'}`}
                        >
                          <AlignRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Renk</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={selectedElementData.color}
                          onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                          className="w-12 h-8 rounded border"
                        />
                        <input
                          type="text"
                          value={selectedElementData.color}
                          onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                          className="flex-1 px-2 py-1 text-xs border rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Arka Plan</label>
                      <input
                        type="color"
                        value={selectedElementData.backgroundColor === 'transparent' ? '#ffffff' : selectedElementData.backgroundColor}
                        onChange={(e) => updateElement(selectedElement, { backgroundColor: e.target.value })}
                        className="w-full h-8 rounded border"
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t">
                  <button
                    onClick={() => deleteElement(selectedElement)}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Sil</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 mt-8">
                <p className="text-sm">Element seçmek için</p>
                <p className="text-sm">canvas'taki bir öğeye tıklayın</p>
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
