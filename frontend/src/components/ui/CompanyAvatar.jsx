import React, { useState } from 'react';
import { Button } from './button';
import { Upload, Building, X } from 'lucide-react';

/**
 * CompanyAvatar - Firma logosu veya avatar component
 * 
 * Props:
 * - companyName: Firma adı (avatar için)
 * - logoUrl: Mevcut logo URL'i
 * - onLogoChange: (logoFile) => void - Logo değiştiğinde çağrılır
 * - onLogoRemove: () => void - Logo silindiğinde çağrılır
 * - size: 'sm' | 'md' | 'lg' - Avatar boyutu
 * - editable: Boolean - Edit edilebilir mi
 * - className: Ek CSS sınıfları
 */
export default function CompanyAvatar({
  companyName = "",
  logoUrl = "",
  onLogoChange,
  onLogoRemove,
  size = 'md',
  editable = true,
  className = ""
}) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef(null);

  // Avatar boyutları
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-20 h-20 text-lg', 
    lg: 'w-32 h-32 text-2xl'
  };

  // Firma adından avatar metni oluştur
  const generateAvatarText = (name) => {
    if (!name) return 'NA';
    
    const words = name
      .replace(/\b(A\.Ş\.|Ltd\.|Şti\.|Inc\.|LLC|Corp\.?|Co\.?)\b/gi, '') // Şirket soneklerini kaldır
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    if (words.length === 1) {
      // Tek kelime varsa ilk 2 harfi al
      return words[0].substring(0, 2).toUpperCase();
    } else if (words.length >= 2) {
      // Birden fazla kelime varsa ilk harfleri al
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    
    return 'NA';
  };

  // Avatar rengi oluştur (firma adına göre)
  const generateAvatarColor = (name) => {
    if (!name) return 'bg-gray-500';
    
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-amber-500'
    ];
    
    // Firma adının hash'ini al
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer'a çevir
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleFileSelect = (file) => {
    if (!file || !editable) return;

    // Dosya türü kontrolü
    if (!file.type.startsWith('image/')) {
      alert('Lütfen sadece resim dosyası seçiniz.');
      return;
    }

    // Dosya boyutu kontrolü (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Dosya boyutu 2MB\'dan küçük olmalıdır.');
      return;
    }

    // FileReader ile preview oluştur
    const reader = new FileReader();
    reader.onload = (e) => {
      if (onLogoChange) {
        onLogoChange(file, e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (editable) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation();
    if (onLogoRemove) {
      onLogoRemove();
    }
  };

  const avatarText = generateAvatarText(companyName);
  const avatarColor = generateAvatarColor(companyName);

  return (
    <div className={`relative ${className}`}>
      {/* Avatar/Logo */}
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full border-2 border-gray-200 
          flex items-center justify-center
          cursor-pointer transition-all duration-200
          ${editable ? 'hover:border-blue-400 hover:shadow-md' : 'cursor-default'}
          ${dragOver ? 'border-blue-500 scale-105' : ''}
          ${logoUrl ? 'p-0' : `${avatarColor} text-white`}
          overflow-hidden
        `}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        title={editable ? "Logo yüklemek için tıklayın veya sürükleyip bırakın" : companyName}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${companyName} logosu`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            {editable && dragOver ? (
              <Upload className={`${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'}`} />
            ) : (
              <span className="font-bold select-none">{avatarText}</span>
            )}
          </div>
        )}
      </div>

      {/* Remove button (sadece logo varsa) */}
      {logoUrl && editable && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md"
          onClick={handleRemoveLogo}
          title="Logoyu kaldır"
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Upload button (logo yoksa ve editable ise) */}
      {!logoUrl && editable && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute -bottom-1 -right-1 h-6 w-6 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md"
          onClick={handleClick}
          title="Logo yükle"
        >
          <Upload className="h-3 w-3" />
        </Button>
      )}

      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          className="hidden"
        />
      )}
    </div>
  );
}