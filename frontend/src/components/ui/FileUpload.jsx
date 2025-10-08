import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { useToast } from '../../hooks/use-toast';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  FileText,
  Download,
  Eye,
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

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Yüklenen Dosyalar ({files.length})</p>
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.original_filename}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {file.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.file_size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-green-600 hover:text-green-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewFile(file);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file.id, file.original_filename);
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(file.id);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}