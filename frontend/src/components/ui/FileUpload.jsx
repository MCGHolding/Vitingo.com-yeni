import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { useToast } from '../../hooks/use-toast';
import PDFViewer from './PDFViewer';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  FileText,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Loader2
} from 'lucide-react';

export default function FileUpload({ 
  label, 
  description, 
  files = [], 
  onFilesChange, 
  maxFiles = 5, 
  maxFileSize = 100 * 1024 * 1024, // 100MB
  acceptedTypes = "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  
  // Zoom and pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFiles) => {
    const filesArray = Array.from(selectedFiles);
    
    // Check file count limit
    if (files.length + filesArray.length > maxFiles) {
      toast({
        title: "Hata",
        description: `Maksimum ${maxFiles} dosya yükleyebilirsiniz`,
        variant: "destructive"
      });
      return;
    }

    filesArray.forEach(file => {
      // Check file size
      if (file.size > maxFileSize) {
        toast({
          title: "Hata",
          description: `${file.name} dosyası çok büyük (maksimum ${Math.round(maxFileSize / 1024 / 1024)}MB)`,
          variant: "destructive"
        });
        return;
      }

      uploadFile(file);
    });
  };

  const uploadFile = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const uploadedFile = await response.json();
        const newFile = {
          ...uploadedFile,
          type: getFileType(file.name)
        };
        
        onFilesChange([...files, newFile]);
        
        toast({
          title: "Başarılı",
          description: `${file.name} başarıyla yüklendi`,
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Hata",
        description: `${file.name} yüklenirken hata oluştu: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async (fileId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onFilesChange(files.filter(f => f.id !== fileId));
        toast({
          title: "Başarılı",
          description: "Dosya başarıyla silindi",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Hata",
        description: "Dosya silinirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleDownloadFile = (fileId, originalFilename) => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
    const link = document.createElement('a');
    link.href = `${backendUrl}/api/files/${fileId}`;
    link.download = originalFilename;
    link.click();
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setPreviewModalOpen(false);
    setPreviewFile(null);
    // Reset zoom and pan
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5)); // Max zoom 5x
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1)); // Min zoom 0.1x
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const renderPreviewContent = (file) => {
    if (!file) return null;

    const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
    const fileUrl = `${backendUrl}/api/files/${file.id}`;

    switch (file.type) {
      case 'image':
        return (
          <div className="space-y-4">
            {/* Zoom Controls for Images */}
            <div className="flex items-center justify-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.1}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-sm px-2 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 5}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
              >
                <RotateCw className="h-4 w-4" />
                Reset
              </Button>
              
              {zoom > 1 && (
                <div className="text-xs text-gray-600 flex items-center">
                  <Move className="h-3 w-3 mr-1" />
                  Sürükleyerek kaydırın
                </div>
              )}
            </div>

            {/* Image Preview */}
            <div 
              className="flex justify-center overflow-hidden rounded-lg border bg-gray-50"
              style={{ height: '500px' }}
              onWheel={handleWheel}
            >
              <img
                src={fileUrl}
                alt={file.original_filename}
                className={`rounded-lg shadow-lg transition-transform origin-center ${
                  zoom > 1 ? 'cursor-move' : 'cursor-default'
                }`}
                style={{ 
                  transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                  objectFit: 'contain',
                  maxHeight: '500px',
                  maxWidth: '100%'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                draggable={false}
              />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="flex justify-center">
            <video
              controls
              className="max-w-full max-h-96 rounded-lg shadow-lg"
              style={{ objectFit: 'contain' }}
            >
              <source src={fileUrl} type={file.content_type} />
              Tarayıcınız video oynatmayı desteklemiyor.
            </video>
          </div>
        );

      case 'pdf':
        return (
          <PDFViewer 
            fileUrl={fileUrl} 
            filename={file.original_filename}
          />
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="flex items-center justify-center mb-4">
              {getFileIcon(file.type)}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {file.original_filename}
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Dosya Boyutu: {formatFileSize(file.file_size)}</p>
              <p>Dosya Türü: {file.content_type}</p>
              <p>Yüklenme Tarihi: {new Date(file.uploaded_at).toLocaleDateString('tr-TR')}</p>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => handleDownloadFile(file.id, file.original_filename)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Dosyayı İndir
              </Button>
            </div>
          </div>
        );
    }
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'].includes(ext)) return 'video';
    if (['pdf'].includes(ext)) return 'pdf';
    return 'document';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Label and Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-600">Yükleniyor...</span>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-1">
              Dosyaları sürükleyip bırakın veya tıklayarak seçin
            </p>
            <p className="text-xs text-gray-500">
              Maksimum {maxFiles} dosya, dosya başına {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
          </>
        )}
      </div>

      {/* Uploaded Files List - Grid Layout (5 per row) */}
      {files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Yüklenen Dosyalar ({files.length})</p>
          <div className="grid grid-cols-5 gap-3">
            {files.map((file) => (
              <Card key={file.id} className="p-3 hover:shadow-lg transition-shadow">
                <div className="flex flex-col space-y-2">
                  {/* File Icon - Large and Centered */}
                  <div className="flex justify-center">
                    <div className="text-blue-500">
                      {getFileIcon(file.type)}
                    </div>
                  </div>
                  
                  {/* File Name - Truncated */}
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-900 truncate" title={file.original_filename}>
                      {file.original_filename}
                    </p>
                  </div>
                  
                  {/* File Info */}
                  <div className="flex flex-col items-center space-y-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      {file.type}
                    </Badge>
                    <span className="text-[10px] text-gray-500">
                      {formatFileSize(file.file_size)}
                    </span>
                  </div>
                  
                  {/* Action Buttons - Stacked Vertically */}
                  <div className="flex flex-col space-y-1 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-full text-xs text-green-600 hover:text-green-800 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewFile(file);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Önizle
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file.id, file.original_filename);
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      İndir
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-full text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(file.id);
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Sil
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent 
          className="max-w-6xl max-h-[95vh] overflow-y-auto"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {previewFile && getFileIcon(previewFile.type)}
              <span>
                {previewFile?.original_filename}
              </span>
              <Badge variant="secondary" className="text-xs">
                {previewFile?.type}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {renderPreviewContent(previewFile)}
          </div>
          
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => previewFile && handleDownloadFile(previewFile.id, previewFile.original_filename)}
            >
              <Download className="h-4 w-4 mr-2" />
              İndir
            </Button>
            <Button variant="outline" onClick={closePreviewModal}>
              Kapat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}