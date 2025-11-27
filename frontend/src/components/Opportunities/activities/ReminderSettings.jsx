import React, { useState, useEffect } from 'react';

const TIMING_OPTIONS = [
  { value: '10min', label: '10 dk önce' },
  { value: '30min', label: '30 dk önce' },
  { value: '1hour', label: '1 saat önce' },
  { value: '3hours', label: '3 saat önce' },
  { value: '1day', label: '1 gün önce' },
  { value: 'custom', label: 'Özel...' }
];

export default function ReminderSettings({ enabled, settings, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    setIsOpen(enabled);
  }, [enabled]);
  
  const handleTimingChange = (timing) => {
    onChange({
      ...settings,
      timing,
      customMinutes: timing === 'custom' ? (settings.customMinutes || 60) : null
    });
  };
  
  const handleChannelChange = (channel, checked) => {
    onChange({
      ...settings,
      channels: {
        ...settings.channels,
        [channel]: checked
      }
    });
  };
  
  const handleCustomMinutesChange = (minutes) => {
    onChange({
      ...settings,
      customMinutes: Math.max(1, Math.min(10080, minutes)) // 1 dakika - 1 hafta
    });
  };
  
  if (!enabled) return null;
  
  const hasAtLeastOneChannel = settings.channels?.inApp || settings.channels?.email || settings.channels?.sms;
  
  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl transition-all duration-300 animate-slideDown">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📢</span>
        <h4 className="font-medium text-blue-800">Hatırlatma Ayarları</h4>
      </div>
      
      {/* Ne zaman? */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ne zaman hatırlatılsın?
        </label>
        <div className="flex flex-wrap gap-2">
          {TIMING_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTimingChange(option.value)}
              className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                settings.timing === option.value
                  ? 'border-blue-500 bg-blue-100 text-blue-700 font-medium'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {option.label}
              {settings.timing === option.value && (
                <span className="ml-1">✓</span>
              )}
            </button>
          ))}
        </div>
        
        {/* Özel süre input */}
        {settings.timing === 'custom' && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-white rounded-lg border">
            <input
              type="number"
              min="1"
              max="10080"
              value={settings.customMinutes || 60}
              onChange={(e) => handleCustomMinutesChange(parseInt(e.target.value) || 60)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">dakika önce</span>
            <span className="text-xs text-gray-400 ml-auto">
              (Max: 1 hafta)
            </span>
          </div>
        )}
      </div>
      
      {/* Nasıl? */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nasıl hatırlatılsın?
        </label>
        <div className="space-y-2">
          {/* Sistem Bildirimi */}
          <label className="flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.channels?.inApp ?? true}
                onChange={(e) => handleChannelChange('inApp', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-lg">🔔</span>
              <div>
                <span className="text-sm font-medium block">Sistem Bildirimi</span>
                <p className="text-xs text-gray-500">Uygulama içi bildirim</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
              Ücretsiz
            </span>
          </label>
          
          {/* E-posta */}
          <label className="flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.channels?.email ?? false}
                onChange={(e) => handleChannelChange('email', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-lg">📧</span>
              <div>
                <span className="text-sm font-medium block">E-posta</span>
                <p className="text-xs text-gray-500">Kayıtlı e-posta adresinize gönderilir</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
              Ücretsiz
            </span>
          </label>
          
          {/* SMS */}
          <label className="flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.channels?.sms ?? false}
                onChange={(e) => handleChannelChange('sms', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-lg">📱</span>
              <div>
                <span className="text-sm font-medium block">SMS</span>
                <p className="text-xs text-gray-500">Kayıtlı telefon numaranıza gönderilir</p>
              </div>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-medium">
              Ek ücret
            </span>
          </label>
        </div>
      </div>
      
      {/* En az bir kanal seçili olmalı uyarısı */}
      {!hasAtLeastOneChannel && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <span className="text-red-500 mt-0.5">⚠️</span>
          <div>
            <p className="text-sm text-red-700 font-medium">En az bir hatırlatma kanalı seçmelisiniz</p>
            <p className="text-xs text-red-600 mt-1">Hatırlatma almak için sistem bildirimi, e-posta veya SMS'den birini seçin</p>
          </div>
        </div>
      )}
      
      {/* Bilgilendirme */}
      <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">ℹ️</span>
          <p className="text-xs text-blue-700">
            Hatırlatma, aktivite tarih ve saatinden belirtilen süre kadar önce gönderilecektir.
          </p>
        </div>
      </div>
    </div>
  );
}
