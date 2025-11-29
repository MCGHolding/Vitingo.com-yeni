import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { X, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Save, Trash2, Minus, Plus, Type } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Portal from '../../components/Portal';

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
  const [toolbarLocked, setToolbarLocked] = useState(false);
  
  const canvasRef = useRef(null);
  
  // Debug logging - HER EVENT'İ LOGLA
  useEffect(() => {
    const logEvent = (eventName) => (e) => {
      console.log(`🔵 ${eventName}:`, e.target.className || e.target.tagName, 'toolbarLocked:', toolbarLocked);
    };
    
    document.addEventListener('mouseup', logEvent('MOUSEUP'), true);
    document.addEventListener('mousedown', logEvent('MOUSEDOWN'), true);
    document.addEventListener('click', logEvent('CLICK'), true);
    
    return () => {
      document.removeEventListener('mouseup', logEvent('MOUSEUP'), true);
      document.removeEventListener('mousedown', logEvent('MOUSEDOWN'), true);
      document.removeEventListener('click', logEvent('CLICK'), true);
    };
  }, [toolbarLocked]);
  
  // selectedElement değişimini DETAYLI LOGLA
  useEffect(() => {
    console.log('🎯 selectedElement DEĞİŞTİ:', selectedElement?.id || 'NULL', 'toolbarLocked:', toolbarLocked);
    console.trace('📍 Stack trace - nereden çağrıldı:');
  }, [selectedElement, toolbarLocked]);

  useEffect(() => {
    if (isOpen && canvasData?.elements) {
      const mappedElements = canvasData.elements.map(el => ({
        ...el,
        displayValue: replaceVariable(el.variable)
      }));
      setElements(mappedElements);
      setSelectedElement(null);
      setToolbarLocked(false);
    }
  }, [isOpen, canvasData, realData]);

  // ESC key to deselect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        console.log('ESC pressed - clearing selection');
        setSelectedElement(null);
        setToolbarLocked(false);
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
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

  // Canvas click handler - SADECE CLICK
  const handleCanvasClick = useCallback((e) => {
    // Toolbar kilitliyse hiçbir şey yapma
    if (toolbarLocked) {
      console.log('Toolbar locked - keeping selection');
      return;
    }
    
    // Element üzerindeyse hiçbir şey yapma
    if (e.target.closest('[data-element-id]')) {
      console.log('Click on element');
      return;
    }
    
    // Toolbar üzerindeyse hiçbir şey yapma
    if (e.target.closest('.editor-toolbar-portal')) {
      console.log('Click on toolbar');
      return;
    }
    
    // Canvas background'a tıklandıysa seçimi kaldır
    console.log('Canvas background clicked - clearing selection');
    setSelectedElement(null);
  }, [toolbarLocked]);
  
  // Element güncelleme
  const handleUpdateElement = useCallback((updates) => {
    if (!selectedElement) return;
    
    console.log('Updating element:', selectedElement.id, updates);
    
    const updatedElement = { ...selectedElement, ...updates };
    
    setElements(prev => prev.map(el => 
      el.id === selectedElement.id ? updatedElement : el
    ));
    
    // selectedElement'i de güncelle
    setSelectedElement(updatedElement);
  }, [selectedElement]);
  
  // Element silme
  const handleDeleteElement = useCallback(() => {
    if (!selectedElement) return;
    
    console.log('Deleting element:', selectedElement.id);
    setElements(prev => prev.filter(el => el.id !== selectedElement.id));
    setSelectedElement(null);
    setToolbarLocked(false);
    toast.success('Element silindi');
  }, [selectedElement]);

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

        {/* Toolbar Placeholder */}
        <div className="h-14 border-b bg-gray-50">
          {!selectedElement && (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              <Type className="w-4 h-4 mr-2" />
              <span>Düzenlemek için bir element seçin</span>
            </div>
          )}
        </div>

        {/* Portal Toolbar - Fixed Position, Body'ye Render */}
        {selectedElement && (
          <Portal>
            <div
              className="editor-toolbar-portal"
              style={{
                position: 'fixed',
                top: '200px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 99999,
                pointerEvents: 'auto'
              }}
              onMouseEnter={() => {
                console.log('🔒 Toolbar mouse enter - LOCKING');
                setToolbarLocked(true);
              }}
              onMouseLeave={() => {
                console.log('🔓 Toolbar mouse leave - UNLOCKING');
                setToolbarLocked(false);
              }}
            >
              <div className="bg-white border-2 border-blue-200 rounded-lg shadow-2xl p-3 flex flex-wrap items-center gap-2">
              {/* Font Family */}
              <select
                value={selectedElement.fontFamily || 'Inter'}
                onChange={(e) => {
                  e.stopPropagation();
                  handleUpdateElement({ fontFamily: e.target.value });
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  console.log('Font dropdown mousedown');
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => {
                  e.stopPropagation();
                  console.log('Font dropdown focused');
                }}
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
                  value={selectedElement.fontSize || 24}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleUpdateElement({ fontSize: parseInt(e.target.value) || 24 });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateElement({ fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition ${selectedElement.fontWeight === 'bold' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                  title="Kalın"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateElement({ fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition border-l border-gray-300 ${selectedElement.fontStyle === 'italic' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                  title="İtalik"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateElement({ textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition border-l border-gray-300 ${selectedElement.textDecoration === 'underline' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateElement({ textAlign: 'left' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition ${selectedElement.textAlign === 'left' || !selectedElement.textAlign ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                  title="Sola Hizala"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateElement({ textAlign: 'center' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition border-l border-gray-300 ${selectedElement.textAlign === 'center' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                  title="Ortala"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateElement({ textAlign: 'right' });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-2 transition border-l border-gray-300 ${selectedElement.textAlign === 'right' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
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
                    style={{ backgroundColor: selectedElement.color || '#000000' }}
                  />
                  <span className="text-sm font-medium text-gray-700">Renk</span>
                  <input
                    type="color"
                    value={selectedElement.color || '#000000'}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleUpdateElement({ color: e.target.value });
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    className="absolute opacity-0 w-0 h-0"
                  />
                </label>
              </div>

              <div className="w-px h-8 bg-gray-300" />

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteElement();
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
                <span className="text-sm font-medium max-w-[200px] truncate">{selectedElement.displayValue}</span>
              </div>
              </div>
            </div>
          </Portal>
        )}

        {/* Main Content - Canvas Area */}
        <div 
          className="flex-1 bg-gray-200 overflow-auto flex items-center justify-center p-8"
          onClick={handleCanvasClick}
        >
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
                    console.log('🟢 DRAG START on element:', element.id);
                    const el = elements.find(el => el.id === element.id);
                    setSelectedElement(el);
                  }}
                  onDrag={(e, d) => {
                    // Real-time update during drag - SEÇİMİ KORU
                    console.log('🔄 DRAGGING:', d.x, d.y);
                  }}
                  onDragStop={(e, d) => {
                    console.log('🔴 DRAG STOP, position:', d.x, d.y);
                    const updates = { x: Math.round(d.x), y: Math.round(d.y) };
                    const el = elements.find(el => el.id === element.id);
                    const updated = { ...el, ...updates };
                    
                    setElements(prev => prev.map(el => 
                      el.id === element.id ? updated : el
                    ));
                    
                    // SEÇİMİ KORU - null yapma!
                    setSelectedElement(updated);
                    console.log('✅ Drag stop - element STILL SELECTED:', updated.id);
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    console.log('🔴 RESIZE STOP');
                    const updates = {
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                      x: Math.round(position.x),
                      y: Math.round(position.y)
                    };
                    const el = elements.find(el => el.id === element.id);
                    const updated = { ...el, ...updates };
                    
                    setElements(prev => prev.map(el => 
                      el.id === element.id ? updated : el
                    ));
                    
                    // SEÇİMİ KORU - null yapma!
                    setSelectedElement(updated);
                    console.log('✅ Resize stop - element STILL SELECTED:', updated.id);
                  }}
                  bounds="parent"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Element clicked:', element.id);
                    const el = elements.find(el => el.id === element.id);
                    setSelectedElement(el);
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(el);
                  }}
                  className={`px-2 py-1 text-xs rounded-full transition ${
                    selectedElement?.id === el.id
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
