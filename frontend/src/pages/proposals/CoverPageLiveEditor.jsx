import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CoverPageLiveEditor = ({ 
  isOpen, 
  onClose, 
  onSave,
  canvasData,  // { selectedTemplate, customBackgroundImage, elements }
  realData     // { company_name, fair_name, start_date, end_date, venue, country, city, prepared_by, ... }
}) => {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const canvasRef = useRef(null);

  // Initialize elements with real data when modal opens
  useEffect(() => {
    if (isOpen && canvasData?.elements) {
      // Map canvas elements and replace variables with real values
      const mappedElements = canvasData.elements.map(el => ({
        ...el,
        displayValue: replaceVariable(el.variable)
      }));
      setElements(mappedElements);
      setSelectedElement(null);
    }
  }, [isOpen, canvasData, realData]);

  // Replace variable with real data
  const replaceVariable = (variable) => {
    if (!variable) return variable;
    
    const replacements = {
      '{{company_name}}': realData?.company_name || '[Firma Adı]',
      '{{company_logo}}': realData?.company_logo || '[Logo]',
      '{{fair_name}}': realData?.fair_name || realData?.project_name || '[Fuar Adı]',
      '{{project_name}}': realData?.project_name || '[Proje Adı]',
      '{{country}}': realData?.country || '[Ülke]',
      '{{city}}': realData?.city || '[Şehir]',
      '{{venue}}': realData?.venue || realData?.fair_center || '[Fuar Merkezi]',
      '{{start_date}}': realData?.start_date ? formatDate(realData.start_date) : '[Başlangıç Tarihi]',
      '{{end_date}}': realData?.end_date ? formatDate(realData.end_date) : '[Bitiş Tarihi]',
      '{{prepared_by}}': realData?.prepared_by || 'Murat Bucak',
      '{{prepared_title}}': realData?.prepared_title || 'Süper Admin',
      '{{prepared_date}}': new Date().toLocaleDateString('tr-TR'),
      '{{proposal_number}}': realData?.proposal_number || `TKL-${Date.now()}`
    };

    let result = variable;
    Object.keys(replacements).forEach(key => {
      if (variable === key) {
        result = replacements[key];
      }
    });
    
    return result;
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR');
    } catch {
      return dateStr;
    }
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
    setSelectedElement(null);
    toast.success('Element silindi');
  };

  // Get selected element data
  const selectedElementData = elements.find(el => el.id === selectedElement);

  // Handle save
  const handleSave = () => {
    // Convert back to canvas format (keep original variables)
    const savedElements = elements.map(el => ({
      ...el,
      // Remove displayValue, keep everything else
      displayValue: undefined
    }));

    onSave({
      selectedTemplate: canvasData.selectedTemplate,
      customBackgroundImage: canvasData.customBackgroundImage,
      elements: savedElements
    });
    
    toast.success('Kapak sayfası kaydedildi!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div>
            <h2 className="text-xl font-bold text-white">Kapak Sayfası - Son Düzenleme</h2>
            <p className="text-blue-100 text-sm">Gerçek verilerle son halini düzenleyin</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 bg-gray-200 p-8 overflow-auto flex items-center justify-center">
            <div
              ref={canvasRef}
              className="relative shadow-2xl"
              style={{
                width: '794px',
                height: '1123px',
                transform: 'scale(0.7)',
                transformOrigin: 'center',
                backgroundImage: canvasData?.customBackgroundImage ? `url(${canvasData.customBackgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#ffffff'
              }}
              onClick={() => setSelectedElement(null)}
            >
              {/* Render Elements with Real Values */}
              {elements.map(element => (
                <Rnd
                  key={element.id}
                  position={{ x: element.x, y: element.y }}
                  size={{ width: element.width || 'auto', height: element.height || 'auto' }}
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
                  bounds="parent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(element.id);
                  }}
                  className={`${selectedElement === element.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                  enableResizing={selectedElement === element.id}
                >
                  <div
                    className="w-full h-full flex items-center justify-center cursor-move"
                    style={{
                      fontSize: `${element.fontSize || 24}px`,
                      fontFamily: element.fontFamily || 'Inter',
                      fontWeight: element.fontWeight || 'normal',
                      fontStyle: element.fontStyle || 'normal',
                      textDecoration: element.textDecoration || 'none',
                      color: element.color || '#000000',
                      textAlign: element.textAlign || 'left',
                      padding: '4px',
                      minWidth: '50px'
                    }}
                  >
                    {element.displayValue || element.variable}
                  </div>
                </Rnd>
              ))}
            </div>
          </div>

          {/* Right Panel - Properties */}
          <div className="w-80 bg-white border-l p-4 overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-4">Özellikler</h3>
            
            {selectedElementData ? (
              <div className="space-y-4">
                {/* Current Value Display */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <label className="block text-xs font-medium text-blue-700 mb-1">Gösterilen Değer</label>
                  <p className="text-sm font-semibold text-blue-900">{selectedElementData.displayValue}</p>
                  <p className="text-xs text-blue-500 mt-1">Değişken: {selectedElementData.variable}</p>
                </div>

                {/* Font Family */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font</label>
                  <select
                    value={selectedElementData.fontFamily || 'Inter'}
                    onChange={(e) => updateElement(selectedElement, { fontFamily: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Helvetica">Helvetica</option>
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Boyut: {selectedElementData.fontSize || 24}px
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="8"
                      max="120"
                      value={selectedElementData.fontSize || 24}
                      onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="8"
                      max="200"
                      value={selectedElementData.fontSize || 24}
                      onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) || 24 })}
                      className="w-16 px-2 py-1 text-sm border rounded text-center"
                    />
                  </div>
                </div>

                {/* Style Buttons */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stil</label>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => updateElement(selectedElement, { 
                        fontWeight: selectedElementData.fontWeight === 'bold' ? 'normal' : 'bold' 
                      })}
                      className={`p-2 rounded-lg border ${selectedElementData.fontWeight === 'bold' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateElement(selectedElement, { 
                        fontStyle: selectedElementData.fontStyle === 'italic' ? 'normal' : 'italic' 
                      })}
                      className={`p-2 rounded-lg border ${selectedElementData.fontStyle === 'italic' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateElement(selectedElement, { 
                        textDecoration: selectedElementData.textDecoration === 'underline' ? 'none' : 'underline' 
                      })}
                      className={`p-2 rounded-lg border ${selectedElementData.textDecoration === 'underline' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hizalama</label>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => updateElement(selectedElement, { textAlign: 'left' })}
                      className={`p-2 rounded-lg border ${selectedElementData.textAlign === 'left' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateElement(selectedElement, { textAlign: 'center' })}
                      className={`p-2 rounded-lg border ${selectedElementData.textAlign === 'center' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateElement(selectedElement, { textAlign: 'right' })}
                      className={`p-2 rounded-lg border ${selectedElementData.textAlign === 'right' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Renk</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={selectedElementData.color || '#000000'}
                      onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedElementData.color || '#000000'}
                      onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border rounded-lg"
                    />
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => deleteElement(selectedElement)}
                  className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Elementi Sil</span>
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">Düzenlemek için bir element seçin</p>
              </div>
            )}

            {/* Elements List */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Tüm Elementler ({elements.length})</h4>
              <div className="space-y-1">
                {elements.map(el => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElement(el.id)}
                    className={`p-2 rounded text-sm cursor-pointer ${selectedElement === el.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    {el.displayValue || el.variable}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <p className="text-sm text-gray-500">
            {elements.length} element • Değişiklikleri kaydetmeyi unutmayın
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverPageLiveEditor;
