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
  const [forceUpdate, setForceUpdate] = useState(0);
  const canvasRef = useRef(null);
  const selectedRef = useRef(null);
  
  // Use ref to prevent state loss
  const setSelection = (id) => {
    console.log('🔵 setSelection called with:', id);
    selectedRef.current = id;
    setSelectedElement(id);
    setForceUpdate(prev => prev + 1);
  };
  
  const clearSelection = () => {
    console.log('🔴 clearSelection called');
    console.trace('clearSelection stack trace');
    selectedRef.current = null;
    setSelectedElement(null);
    setForceUpdate(prev => prev + 1);
  };

  useEffect(() => {
    if (isOpen && canvasData?.elements) {
      const mappedElements = canvasData.elements.map(el => ({
        ...el,
        displayValue: replaceVariable(el.variable)
      }));
      setElements(mappedElements);
      clearSelection();
    }
  }, [isOpen, canvasData, realData]);

  // ESC key to deselect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        clearSelection();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

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
    setElements(prevElements => 
      prevElements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    );
  };

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    clearSelection();
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
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        // Close modal only if clicking on the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title */}
        <div 
          className="flex items-center justify-between px-4 py-3 border-b bg-gray-50"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <h2 className="text-lg font-bold text-gray-800">Kapak Sayfası - Son Düzenleme</h2>
            <p className="text-xs text-gray-500">Elementleri sürükleyin, boyutlandırın ve stillerini değiştirin</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canva-style Top Toolbar */}
        <div 
          data-toolbar="true"
          className="flex items-center px-4 py-2.5 border-b bg-gradient-to-b from-white to-gray-50 shadow-sm"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {selectedElementData ? (
            <div 
              data-toolbar="true"
              className="flex items-center space-x-2 w-full"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              {/* Font Family */}
              <select
                value={selectedElementData.fontFamily || 'Inter'}
                onChange={(e) => {
                  e.stopPropagation();
                  updateElement(selectedElement, { fontFamily: e.target.value });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition min-w-[140px] font-medium"
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Roboto">Roboto</option>
              </select>

              <div className="w-px h-8 bg-gray-300" />

              {/* Font Size */}
              <div 
                className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden hover:border-blue-400 transition"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    changeFontSize(-2);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-2 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition"
                  title="Küçült"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={selectedElementData.fontSize || 24}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateElement(selectedElement, { fontSize: parseInt(e.target.value) || 24 });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-14 text-center text-sm font-medium border-0 focus:outline-none focus:bg-blue-50"
                  min="8"
                  max="200"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    changeFontSize(2);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-2 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition"
                  title="Büyüt"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-8 bg-gray-300" />

              {/* Style Buttons */}
              <div 
                className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateElement(selectedElement, { fontWeight: selectedElementData.fontWeight === 'bold' ? 'normal' : 'bold' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition ${selectedElementData.fontWeight === 'bold' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                  title="Kalın"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateElement(selectedElement, { fontStyle: selectedElementData.fontStyle === 'italic' ? 'normal' : 'italic' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition border-l border-gray-300 ${selectedElementData.fontStyle === 'italic' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                  title="İtalik"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateElement(selectedElement, { textDecoration: selectedElementData.textDecoration === 'underline' ? 'none' : 'underline' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition border-l border-gray-300 ${selectedElementData.textDecoration === 'underline' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                  title="Altı Çizili"
                >
                  <Underline className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-8 bg-gray-300" />

              {/* Alignment */}
              <div 
                className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateElement(selectedElement, { textAlign: 'left' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition ${selectedElementData.textAlign === 'left' || !selectedElementData.textAlign ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                  title="Sola Hizala"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateElement(selectedElement, { textAlign: 'center' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition border-l border-gray-300 ${selectedElementData.textAlign === 'center' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                  title="Ortala"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateElement(selectedElement, { textAlign: 'right' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition border-l border-gray-300 ${selectedElementData.textAlign === 'right' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                  title="Sağa Hizala"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-8 bg-gray-300" />

              {/* Color Picker */}
              <div 
                className="relative group"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <label 
                  className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    className="w-6 h-6 rounded border-2 border-white shadow-sm"
                    style={{ backgroundColor: selectedElementData.color || '#000000' }}
                  />
                  <span className="text-sm font-medium text-gray-700">Renk</span>
                  <input
                    type="color"
                    value={selectedElementData.color || '#000000'}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateElement(selectedElement, { color: e.target.value });
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute opacity-0 w-0 h-0"
                  />
                </label>
              </div>

              <div className="w-px h-8 bg-gray-300" />

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteElement(selectedElement);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                title="Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Selected Element Info */}
              <div className="ml-auto flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                <Type className="w-4 h-4" />
                <span className="text-sm font-medium max-w-[200px] truncate">{selectedElementData.displayValue}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 flex items-center py-1">
              <Type className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-medium">Düzenlemek için bir element seçin</span>
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
            onMouseDown={(e) => {
              // Check if click is on toolbar or element
              const isToolbar = e.target.closest('[data-toolbar="true"]');
              const isElement = e.target.closest('[data-element-id]');
              
              // Only deselect if clicking on canvas background (not toolbar, not element)
              if (!isToolbar && !isElement && e.target === e.currentTarget) {
                clearSelection();
              }
            }}
          >
            {/* Render Elements */}
            {elements.map(element => {
              const isSelected = selectedElement === element.id;
              return (
                <Rnd
                  key={element.id}
                  data-element-id={element.id}
                  default={{
                    x: element.x || 50,
                    y: element.y || 50,
                    width: element.width || 300,
                    height: element.height || 50
                  }}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setSelection(element.id);
                  }}
                  onDragStop={(e, d) => {
                    e.stopPropagation();
                    // Keep selection after drag
                    setSelection(element.id);
                    // Update position only when drag stops
                    updateElement(element.id, { 
                      x: Math.round(d.x), 
                      y: Math.round(d.y) 
                    });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    e.stopPropagation();
                    // Keep selection after resize
                    setSelection(element.id);
                    updateElement(element.id, {
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                      x: Math.round(position.x),
                      y: Math.round(position.y)
                    });
                  }}
                  bounds="parent"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelection(element.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelection(element.id);
                  }}
                  className={`${
                    isSelected 
                      ? 'ring-2 ring-blue-500 shadow-lg' 
                      : 'hover:ring-2 hover:ring-blue-300'
                  }`}
                  style={{ cursor: 'move' }}
                  enableResizing={isSelected}
                  disableDragging={false}
                  resizeHandleStyles={{
                    bottom: { 
                      display: isSelected ? 'block' : 'none',
                      background: '#3B82F6',
                      width: '100%',
                      height: '6px'
                    },
                    bottomRight: { 
                      cursor: 'se-resize', 
                      display: isSelected ? 'block' : 'none',
                      width: '12px',
                      height: '12px',
                      background: '#3B82F6',
                      border: '2px solid white',
                      borderRadius: '50%'
                    },
                    bottomLeft: { 
                      cursor: 'sw-resize', 
                      display: isSelected ? 'block' : 'none',
                      width: '12px',
                      height: '12px',
                      background: '#3B82F6',
                      border: '2px solid white',
                      borderRadius: '50%'
                    },
                    top: { 
                      display: isSelected ? 'block' : 'none',
                      background: '#3B82F6',
                      width: '100%',
                      height: '6px'
                    },
                    topRight: { 
                      cursor: 'ne-resize', 
                      display: isSelected ? 'block' : 'none',
                      width: '12px',
                      height: '12px',
                      background: '#3B82F6',
                      border: '2px solid white',
                      borderRadius: '50%'
                    },
                    topLeft: { 
                      cursor: 'nw-resize', 
                      display: isSelected ? 'block' : 'none',
                      width: '12px',
                      height: '12px',
                      background: '#3B82F6',
                      border: '2px solid white',
                      borderRadius: '50%'
                    },
                    left: { 
                      display: isSelected ? 'block' : 'none',
                      background: '#3B82F6',
                      width: '6px',
                      height: '100%'
                    },
                    right: { 
                      display: isSelected ? 'block' : 'none',
                      background: '#3B82F6',
                      width: '6px',
                      height: '100%'
                    }
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
                      justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      userSelect: 'none',
                      overflow: 'hidden',
                      wordWrap: 'break-word',
                      pointerEvents: 'none'
                    }}
                  >
                    {element.displayValue || element.variable}
                  </div>
                </Rnd>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-between px-4 py-3 border-t bg-gray-50"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{elements.length} element</span>
            {/* Element Pills */}
            <div className="flex items-center space-x-2">
              {elements.map(el => (
                <button
                  key={el.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelection(el.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
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
