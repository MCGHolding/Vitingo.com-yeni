import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Save, Trash2, Minus, Plus, Type } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CANVAS_WIDTH = 794;
const CANVAS_HEIGHT = 1123;
const SCALE = 0.7;

const CoverPageLiveEditor = ({ 
  isOpen, 
  onClose, 
  onSave,
  canvasData,
  realData
}) => {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && canvasData?.elements) {
      const mappedElements = canvasData.elements.map(el => ({
        ...el,
        displayValue: replaceVariable(el.variable)
      }));
      setElements(mappedElements);
      setSelectedElement(null);
    }
  }, [isOpen, canvasData, realData]);

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
      '{{start_date}}': realData?.start_date ? formatDate(realData.start_date) : '[Başlangıç]',
      '{{end_date}}': realData?.end_date ? formatDate(realData.end_date) : '[Bitiş]',
      '{{prepared_by}}': realData?.prepared_by || 'Murat Bucak',
      '{{prepared_title}}': realData?.prepared_title || 'Süper Admin',
      '{{prepared_date}}': new Date().toLocaleDateString('tr-TR'),
      '{{proposal_number}}': realData?.proposal_number || `TKL-${Date.now()}`
    };

    let result = variable;
    Object.keys(replacements).forEach(key => {
      if (variable === key) result = replacements[key];
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

  const updateElement = (id, updates) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedElement(null);
    toast.success('Element silindi');
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  const handleSave = () => {
    const savedElements = elements.map(el => ({
      ...el,
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

  const changeFontSize = (delta) => {
    if (!selectedElement) return;
    const currentSize = selectedElementData?.fontSize || 24;
    const newSize = Math.max(8, Math.min(200, currentSize + delta));
    updateElement(selectedElement, { fontSize: newSize });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] flex flex-col">
        {/* Header with Title */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Kapak Sayfası - Son Düzenleme</h2>
            <p className="text-xs text-gray-500">Elementleri sürükleyin, boyutlandırın ve stillerini değiştirin</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canva-style Top Toolbar */}
        <div className="flex items-center px-4 py-2 border-b bg-white space-x-3">
          {selectedElementData ? (
            <>
              {/* Font Family */}
              <select
                value={selectedElementData.fontFamily || 'Inter'}
                onChange={(e) => updateElement(selectedElement, { fontFamily: e.target.value })}
                className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-50 min-w-[120px]"
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Roboto">Roboto</option>
              </select>

              <div className="w-px h-6 bg-gray-300" />

              {/* Font Size */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-1">
                <button
                  onClick={() => changeFontSize(-2)}
                  className="p-1.5 hover:bg-gray-200 rounded"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={selectedElementData.fontSize || 24}
                  onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) || 24 })}
                  className="w-12 text-center text-sm bg-transparent border-0 focus:outline-none"
                />
                <button
                  onClick={() => changeFontSize(2)}
                  className="p-1.5 hover:bg-gray-200 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-gray-300" />

              {/* Color */}
              <div className="flex items-center space-x-1">
                <input
                  type="color"
                  value={selectedElementData.color || '#000000'}
                  onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
              </div>

              <div className="w-px h-6 bg-gray-300" />

              {/* Style Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => updateElement(selectedElement, { fontWeight: selectedElementData.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`p-2 rounded-lg ${selectedElementData.fontWeight === 'bold' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}
                  title="Kalın"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateElement(selectedElement, { fontStyle: selectedElementData.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  className={`p-2 rounded-lg ${selectedElementData.fontStyle === 'italic' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}
                  title="İtalik"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateElement(selectedElement, { textDecoration: selectedElementData.textDecoration === 'underline' ? 'none' : 'underline' })}
                  className={`p-2 rounded-lg ${selectedElementData.textDecoration === 'underline' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}
                  title="Altı Çizili"
                >
                  <Underline className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-gray-300" />

              {/* Alignment */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => updateElement(selectedElement, { textAlign: 'left' })}
                  className={`p-2 rounded-lg ${selectedElementData.textAlign === 'left' || !selectedElementData.textAlign ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}
                  title="Sola Hizala"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateElement(selectedElement, { textAlign: 'center' })}
                  className={`p-2 rounded-lg ${selectedElementData.textAlign === 'center' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}
                  title="Ortala"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateElement(selectedElement, { textAlign: 'right' })}
                  className={`p-2 rounded-lg ${selectedElementData.textAlign === 'right' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}
                  title="Sağa Hizala"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-gray-300" />

              {/* Delete */}
              <button
                onClick={() => deleteElement(selectedElement)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                title="Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Selected Element Info */}
              <div className="ml-auto flex items-center space-x-2 text-sm text-gray-500">
                <Type className="w-4 h-4" />
                <span>{selectedElementData.displayValue}</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400 flex items-center">
              <Type className="w-4 h-4 mr-2" />
              Düzenlemek için bir element seçin
            </div>
          )}
        </div>

        {/* Main Content - Canvas Area */}
        <div className="flex-1 bg-gray-200 overflow-auto flex items-center justify-center p-8">
          <div
            ref={canvasRef}
            className="relative shadow-2xl bg-white"
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `scale(${SCALE})`,
              transformOrigin: 'center',
              backgroundImage: canvasData?.customBackgroundImage ? `url(${canvasData.customBackgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            onClick={() => setSelectedElement(null)}
          >
            {/* Render Elements */}
            {elements.map(element => (
              <Rnd
                key={element.id}
                default={{
                  x: element.x || 50,
                  y: element.y || 50,
                  width: element.width || 300,
                  height: element.height || 50
                }}
                position={{ x: element.x || 50, y: element.y || 50 }}
                size={{ width: element.width || 300, height: element.height || 50 }}
                onDragStop={(e, d) => {
                  updateElement(element.id, { x: d.x, y: d.y });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  updateElement(element.id, {
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                    x: position.x,
                    y: position.y
                  });
                }}
                scale={SCALE}
                bounds="parent"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElement(element.id);
                }}
                className={`cursor-move ${
                  selectedElement === element.id 
                    ? 'ring-2 ring-blue-500 ring-offset-2' 
                    : 'hover:ring-2 hover:ring-blue-300'
                }`}
                enableResizing={selectedElement === element.id}
                resizeHandleStyles={{
                  bottomRight: { cursor: 'se-resize' },
                  bottomLeft: { cursor: 'sw-resize' },
                  topRight: { cursor: 'ne-resize' },
                  topLeft: { cursor: 'nw-resize' }
                }}
              >
                <div
                  className="w-full h-full flex items-center px-2"
                  style={{
                    fontSize: `${element.fontSize || 24}px`,
                    fontFamily: element.fontFamily || 'Inter',
                    fontWeight: element.fontWeight || 'normal',
                    fontStyle: element.fontStyle || 'normal',
                    textDecoration: element.textDecoration || 'none',
                    color: element.color || '#000000',
                    textAlign: element.textAlign || 'left',
                    justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {element.displayValue || element.variable}
                </div>
              </Rnd>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{elements.length} element</span>
            {/* Element Pills */}
            <div className="flex items-center space-x-2">
              {elements.map(el => (
                <button
                  key={el.id}
                  onClick={() => setSelectedElement(el.id)}
                  className={`px-2 py-1 text-xs rounded-full transition ${
                    selectedElement === el.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {el.displayValue?.substring(0, 15)}{el.displayValue?.length > 15 ? '...' : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2"
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
