import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  FileText,
  Image as ImageIcon,
  Film,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import PDFViewer from './PDFViewer';

export default function FilePreviewModal({ 
  isOpen, 
  onClose, 
  files = [], 
  initialIndex = 0,
  title = "Dosya Önizleme" 
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    // Reset zoom and rotation when switching files
    setZoom(100);
    setRotation(0);
  }, [currentIndex]);

  if (!isOpen || !files || files.length === 0) {
    return null;
  }

  const currentFile = files[currentIndex];
  const hasMultipleFiles = files.length > 1;

  const getFileType = (fileName) => {
    if (!fileName) return 'unknown';
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return 'image';
    }
    if (['pdf'].includes(extension)) {
      return 'pdf';
    }
    if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension)) {
      return 'video';
    }
    return 'unknown';
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'video':
        return <Film className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : files.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < files.length - 1 ? prev + 1 : 0));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    // Simulate download - in real implementation, this would download the actual file
    const link = document.createElement('a');
    link.href = currentFile.url || '#';
    link.download = currentFile.name || `file_${currentIndex + 1}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFilePreview = () => {
    const fileType = getFileType(currentFile.name);
    
    switch (fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={currentFile.url || `https://picsum.photos/800/600?random=${currentIndex}`}
              alt={currentFile.name || `Dosya ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200 ease-in-out"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTJMMTEgMTRMMTYgOUgyMVY5VjE5QzIxIDIwLjEgMjAuMSAyMSAxOSAyMUg1QzMuOSAyMSAzIDIwLjEgMyAxOVY1QzMgMy45IDMuOSAzIDUgM0gxOUMyMC4xIDMgMjEgMy45IDIxIDVWOUgxNkwxMSAxNEw5IDEyWk0xMyAzSDVDMy45IDMgMyAzLjkgMyA1VjEzTDYgMTBMMTMgM1oiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+Cg==';
              }}
            />
          </div>
        );
      
      case 'pdf':
        return (
          <div className="h-full bg-gray-100 rounded-lg overflow-hidden">
            <PDFViewer 
              file={currentFile.url || '/sample.pdf'} 
              zoom={zoom}
              className="w-full h-full"
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg overflow-hidden">
            <video
              src={currentFile.url}
              controls
              className="max-w-full max-h-full"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
            >
              Tarayıcınız video oynatmayı desteklemiyor.
            </video>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Bu dosya türü önizlenemiyor</p>
              <p className="text-sm text-gray-500 mt-2">{currentFile.name}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 ${
      isFullscreen ? 'p-0' : 'p-4'
    }`}>
      <Card className={`bg-white ${
        isFullscreen 
          ? 'w-full h-full rounded-none' 
          : 'w-full max-w-6xl h-[90vh]'
      } flex flex-col`}>
        
        {/* Header */}
        <CardHeader className="bg-gray-50 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              {getFileIcon(getFileType(currentFile.name))}
              <span>{title}</span>
              {hasMultipleFiles && (
                <span className="text-sm font-normal text-gray-600">
                  ({currentIndex + 1} / {files.length})
                </span>
              )}
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {/* File Navigation */}
              {hasMultipleFiles && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevious}
                    className="h-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 px-2">
                    {currentIndex + 1} / {files.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    className="h-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* Divider */}
              {hasMultipleFiles && <div className="w-px h-6 bg-gray-300" />}
              
              {/* Zoom Controls */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 25}
                className="h-8"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-sm text-gray-600 px-1 min-w-[3rem] text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 300}
                className="h-8"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              
              {/* Rotate (only for images and videos) */}
              {['image', 'video'].includes(getFileType(currentFile.name)) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="h-8"
                >
                  <RotateCw className="h-3 w-3" />
                </Button>
              )}
              
              {/* Fullscreen Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8"
              >
                {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
              
              {/* Download */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8"
              >
                <Download className="h-3 w-3" />
              </Button>
              
              {/* Close */}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 p-4 overflow-hidden">
          <div className="h-full relative">
            {renderFilePreview()}
          </div>
        </CardContent>

        {/* Footer with file info */}
        <div className="bg-gray-50 border-t px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="font-medium">{currentFile.name || `Dosya ${currentIndex + 1}`}</span>
              {currentFile.size && (
                <span>{(currentFile.size / 1024 / 1024).toFixed(2)} MB</span>
              )}
              {currentFile.type && (
                <span className="uppercase">{getFileType(currentFile.name)}</span>
              )}
            </div>
            
            {hasMultipleFiles && (
              <div className="flex items-center space-x-2">
                <span>Dosyalar:</span>
                <div className="flex space-x-1">
                  {files.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentIndex 
                          ? 'bg-blue-600' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}