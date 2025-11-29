import React, { useState, useEffect } from 'react';

const TimelineModule = ({ data, onChange }) => {
  // Helper functions
  const subtractDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result.toISOString().split('T')[0];
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
  };

  const getDefaultTimeline = (eventStartDate) => {
    const eventDate = eventStartDate ? new Date(eventStartDate) : new Date();
    
    return {
      title: "Proje Zaman Çizelgesi",
      eventInfo: {
        eventName: '',
        venue: '',
        hall: '',
        standNumber: '',
        eventStartDate: eventDate.toISOString().split('T')[0],
        eventEndDate: addDays(eventDate, 3),
        setupStartDate: subtractDays(eventDate, 2),
        setupStartTime: '08:00',
        teardownEndDate: addDays(eventDate, 5)
      },
      phases: [
        {
          id: 'design',
          name: 'Tasarım',
          icon: '📐',
          color: '#8B5CF6',
          startDate: subtractDays(eventDate, 60),
          endDate: subtractDays(eventDate, 45),
          tasks: [
            { id: Date.now() + 1, name: 'Konsept tasarım sunumu', date: subtractDays(eventDate, 55), critical: false },
            { id: Date.now() + 2, name: 'Revizyon süresi', duration: '5 gün', critical: false },
            { id: Date.now() + 3, name: 'Final onay', date: subtractDays(eventDate, 45), critical: true }
          ]
        },
        {
          id: 'production',
          name: 'Üretim',
          icon: '🏭',
          color: '#F59E0B',
          startDate: subtractDays(eventDate, 44),
          endDate: subtractDays(eventDate, 14),
          tasks: [
            { id: Date.now() + 4, name: 'Malzeme tedariki', duration: '7 gün', critical: false },
            { id: Date.now() + 5, name: 'CNC kesim & işleme', duration: '13 gün', critical: false },
            { id: Date.now() + 6, name: 'Boya & kaplama', duration: '7 gün', critical: false },
            { id: Date.now() + 7, name: 'Kalite kontrol', duration: '3 gün', critical: false }
          ]
        },
        {
          id: 'logistics',
          name: 'Lojistik',
          icon: '🚚',
          color: '#3B82F6',
          startDate: subtractDays(eventDate, 5),
          endDate: subtractDays(eventDate, 3),
          tasks: [
            { id: Date.now() + 8, name: 'Paketleme & yükleme', date: subtractDays(eventDate, 5), critical: false },
            { id: Date.now() + 9, name: 'Nakliye', date: subtractDays(eventDate, 4), critical: false },
            { id: Date.now() + 10, name: 'Fuar alanına teslimat', date: subtractDays(eventDate, 3), critical: false }
          ]
        },
        {
          id: 'setup',
          name: 'Kurulum',
          icon: '🔧',
          color: '#10B981',
          startDate: subtractDays(eventDate, 2),
          endDate: subtractDays(eventDate, 1),
          tasks: [
            { id: Date.now() + 11, name: 'Stand montajı', date: subtractDays(eventDate, 2), critical: false },
            { id: Date.now() + 12, name: 'Elektrik & aydınlatma', date: subtractDays(eventDate, 1), critical: false },
            { id: Date.now() + 13, name: 'Grafik & branding', date: subtractDays(eventDate, 1), critical: false },
            { id: Date.now() + 14, name: 'Final kontrol', date: subtractDays(eventDate, 1), critical: true }
          ]
        },
        {
          id: 'event',
          name: 'Fuar Dönemi',
          icon: '🎪',
          color: '#EF4444',
          startDate: eventDate.toISOString().split('T')[0],
          endDate: addDays(eventDate, 3),
          isMainEvent: true,
          tasks: [
            { id: Date.now() + 15, name: '7/24 teknik destek', note: 'Yerinde ekip', critical: false },
            { id: Date.now() + 16, name: 'Acil müdahale ekibi hazır', note: '', critical: false }
          ]
        },
        {
          id: 'teardown',
          name: 'Söküm & Depolama',
          icon: '📦',
          color: '#6B7280',
          startDate: addDays(eventDate, 4),
          endDate: addDays(eventDate, 5),
          tasks: [
            { id: Date.now() + 17, name: 'Stand sökümü', date: addDays(eventDate, 4), critical: false },
            { id: Date.now() + 18, name: 'Nakliye', date: addDays(eventDate, 5), critical: false },
            { id: Date.now() + 19, name: 'Depolama / iade', date: addDays(eventDate, 5), critical: false }
          ]
        }
      ],
      milestones: [],
      projectManager: {
        name: '',
        phone: '',
        email: '',
        availabilityNote: ''
      }
    };
  };

  const [timeline, setTimeline] = useState(() => {
    if (data && typeof data === 'object' && data.phases) {
      return data;
    }
    return getDefaultTimeline(new Date());
  });

  const [expandedPhase, setExpandedPhase] = useState(null);

  // Timeline değiştiğinde parent'a bildir
  useEffect(() => {
    if (onChange) {
      onChange(timeline);
    }
  }, [timeline, onChange]);

  // Phase güncelle
  const updatePhase = (phaseId, updates) => {
    setTimeline(prev => ({
      ...prev,
      phases: prev.phases.map(p => 
        p.id === phaseId ? { ...p, ...updates } : p
      )
    }));
  };

  // Task ekle/güncelle/sil
  const addTask = (phaseId) => {
    const newTask = { id: Date.now(), name: 'Yeni görev', date: '', critical: false };
    const phase = timeline.phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    updatePhase(phaseId, {
      tasks: [...(phase.tasks || []), newTask]
    });
  };

  const updateTask = (phaseId, taskId, updates) => {
    const phase = timeline.phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    updatePhase(phaseId, {
      tasks: phase.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    });
  };

  const deleteTask = (phaseId, taskId) => {
    const phase = timeline.phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    updatePhase(phaseId, {
      tasks: phase.tasks.filter(t => t.id !== taskId)
    });
  };

  // Tarih formatlama
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateRange = (start, end) => {
    if (!start || !end) return '';
    const s = new Date(start);
    const e = new Date(end);
    const sameMonth = s.getMonth() === e.getMonth();
    const sameYear = s.getFullYear() === e.getFullYear();
    
    if (sameMonth && sameYear) {
      return `${s.getDate()} - ${e.getDate()} ${s.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`;
    }
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <div className="timeline-module">
      
      {/* BAŞLIK */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
        <input
          type="text"
          value={timeline.title || ''}
          onChange={(e) => setTimeline(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Proje Zaman Çizelgesi"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      
      {/* FUAR BİLGİLERİ */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
          <span className="text-xl">🎪</span>
          Fuar Bilgileri
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-600 font-medium">Fuar Adı</label>
            <input
              type="text"
              value={timeline.eventInfo?.eventName || ''}
              onChange={(e) => setTimeline(prev => ({
                ...prev,
                eventInfo: { ...prev.eventInfo, eventName: e.target.value }
              }))}
              placeholder="ISK-SODEX 2025"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-600 font-medium">Fuar Yeri</label>
            <input
              type="text"
              value={timeline.eventInfo?.venue || ''}
              onChange={(e) => setTimeline(prev => ({
                ...prev,
                eventInfo: { ...prev.eventInfo, venue: e.target.value }
              }))}
              placeholder="İstanbul Fuar Merkezi"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 font-medium">Hall</label>
              <input
                type="text"
                value={timeline.eventInfo?.hall || ''}
                onChange={(e) => setTimeline(prev => ({
                  ...prev,
                  eventInfo: { ...prev.eventInfo, hall: e.target.value }
                }))}
                placeholder="Hall 9"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Stand No</label>
              <input
                type="text"
                value={timeline.eventInfo?.standNumber || ''}
                onChange={(e) => setTimeline(prev => ({
                  ...prev,
                  eventInfo: { ...prev.eventInfo, standNumber: e.target.value }
                }))}
                placeholder="B45"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 font-medium">Fuar Başlangıç</label>
              <input
                type="date"
                value={timeline.eventInfo?.eventStartDate || ''}
                onChange={(e) => setTimeline(prev => ({
                  ...prev,
                  eventInfo: { ...prev.eventInfo, eventStartDate: e.target.value }
                }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Fuar Bitiş</label>
              <input
                type="date"
                value={timeline.eventInfo?.eventEndDate || ''}
                onChange={(e) => setTimeline(prev => ({
                  ...prev,
                  eventInfo: { ...prev.eventInfo, eventEndDate: e.target.value }
                }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-gray-600 font-medium">Kurulum Başlangıç</label>
            <input
              type="date"
              value={timeline.eventInfo?.setupStartDate || ''}
              onChange={(e) => setTimeline(prev => ({
                ...prev,
                eventInfo: { ...prev.eventInfo, setupStartDate: e.target.value }
              }))}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>
      
      {/* DİKEY TIMELINE */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📅</span>
            Proje Aşamaları
          </h3>
        </div>
        
        {/* Timeline Container */}
        <div className="relative">
          {/* Dikey çizgi */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          {/* Phases */}
          <div className="space-y-4">
            {timeline.phases?.map((phase, index) => (
              <div key={phase.id} className="relative">
                
                {/* Timeline dot */}
                <div 
                  className={`
                    absolute left-4 w-5 h-5 rounded-full border-4 border-white shadow-md z-10
                    ${phase.isMainEvent ? 'ring-4 ring-red-200' : ''}
                  `}
                  style={{ backgroundColor: phase.color }}
                />
                
                {/* Phase Card */}
                <div 
                  className={`
                    ml-12 border rounded-xl overflow-hidden transition-all
                    ${phase.isMainEvent ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
                    ${expandedPhase === phase.id ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}
                  `}
                >
                  {/* Phase Header */}
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{phase.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          {phase.name}
                          {phase.isMainEvent && (
                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                              🎯 ANA HEDEF
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {formatDateRange(phase.startDate, phase.endDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {phase.tasks?.length || 0} görev
                      </span>
                      <span className={`transition-transform ${expandedPhase === phase.id ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>
                  
                  {/* Phase Content - Expanded */}
                  {expandedPhase === phase.id && (
                    <div className="border-t px-4 py-4 bg-gray-50">
                      
                      {/* Tarih Düzenleme */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="text-xs text-gray-500 font-medium">Başlangıç</label>
                          <input
                            type="date"
                            value={phase.startDate || ''}
                            onChange={(e) => updatePhase(phase.id, { startDate: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium">Bitiş</label>
                          <input
                            type="date"
                            value={phase.endDate || ''}
                            onChange={(e) => updatePhase(phase.id, { endDate: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      
                      {/* Görevler */}
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500 font-medium">Görevler</label>
                        
                        {phase.tasks?.map((task, taskIndex) => (
                          <div 
                            key={task.id || taskIndex}
                            className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200"
                          >
                            <span className="text-gray-400">✓</span>
                            <input
                              type="text"
                              value={task.name || ''}
                              onChange={(e) => updateTask(phase.id, task.id, { name: e.target.value })}
                              className="flex-1 px-2 py-1 text-sm border-0 focus:ring-0"
                              placeholder="Görev adı"
                            />
                            <input
                              type="text"
                              value={task.date || task.duration || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val.includes('-') || val.match(/\d{4}-\d{2}-\d{2}/)) {
                                  updateTask(phase.id, task.id, { date: val, duration: '' });
                                } else {
                                  updateTask(phase.id, task.id, { duration: val, date: '' });
                                }
                              }}
                              className="w-32 px-2 py-1 text-sm text-gray-500 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                              placeholder="Tarih / Süre"
                            />
                            {task.critical && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">
                                Kritik
                              </span>
                            )}
                            <label className="flex items-center text-xs text-gray-500">
                              <input
                                type="checkbox"
                                checked={task.critical || false}
                                onChange={(e) => updateTask(phase.id, task.id, { critical: e.target.checked })}
                                className="mr-1 rounded"
                              />
                              Kritik
                            </label>
                            <button
                              onClick={() => deleteTask(phase.id, task.id)}
                              className="text-red-400 hover:text-red-600 text-sm px-2"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => addTask(phase.id)}
                          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition"
                        >
                          + Görev Ekle
                        </button>
                      </div>
                      
                      {/* Renk Seçimi */}
                      <div className="mt-4 flex items-center gap-3">
                        <label className="text-xs text-gray-500 font-medium">Renk:</label>
                        <div className="flex gap-2">
                          {['#8B5CF6', '#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#6B7280', '#EC4899'].map(color => (
                            <button
                              key={color}
                              onClick={() => updatePhase(phase.id, { color })}
                              className={`w-6 h-6 rounded-full border-2 transition ${phase.color === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* KRİTİK TARİHLER */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-amber-800 mb-4 flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          Kritik Tarihler & Milestone'lar
        </h3>
        
        <div className="space-y-3">
          {timeline.milestones?.map((milestone, index) => (
            <div 
              key={index}
              className={`
                flex items-center gap-3 p-3 rounded-lg border
                ${milestone.type === 'critical' ? 'bg-red-100 border-red-200' : ''}
                ${milestone.type === 'warning' ? 'bg-yellow-100 border-yellow-200' : ''}
                ${milestone.type === 'target' ? 'bg-green-100 border-green-200' : ''}
                ${milestone.type === 'payment' ? 'bg-blue-100 border-blue-200' : ''}
                ${!milestone.type ? 'bg-white border-gray-200' : ''}
              `}
            >
              <span className="text-lg">
                {milestone.type === 'critical' ? '🔴' : ''}
                {milestone.type === 'warning' ? '🟡' : ''}
                {milestone.type === 'target' ? '🎯' : ''}
                {milestone.type === 'payment' ? '💰' : ''}
                {!milestone.type ? '📌' : ''}
              </span>
              
              <input
                type="date"
                value={milestone.date || ''}
                onChange={(e) => {
                  const newMilestones = [...(timeline.milestones || [])];
                  newMilestones[index] = { ...milestone, date: e.target.value };
                  setTimeline(prev => ({ ...prev, milestones: newMilestones }));
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-amber-500"
              />
              
              <input
                type="text"
                value={milestone.title || ''}
                onChange={(e) => {
                  const newMilestones = [...(timeline.milestones || [])];
                  newMilestones[index] = { ...milestone, title: e.target.value };
                  setTimeline(prev => ({ ...prev, milestones: newMilestones }));
                }}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-amber-500"
                placeholder="Milestone başlığı"
              />
              
              <select
                value={milestone.type || ''}
                onChange={(e) => {
                  const newMilestones = [...(timeline.milestones || [])];
                  newMilestones[index] = { ...milestone, type: e.target.value };
                  setTimeline(prev => ({ ...prev, milestones: newMilestones }));
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Normal</option>
                <option value="critical">🔴 Kritik</option>
                <option value="warning">🟡 Uyarı</option>
                <option value="target">🎯 Hedef</option>
                <option value="payment">💰 Ödeme</option>
              </select>
              
              <button
                onClick={() => {
                  const newMilestones = timeline.milestones.filter((_, i) => i !== index);
                  setTimeline(prev => ({ ...prev, milestones: newMilestones }));
                }}
                className="text-red-400 hover:text-red-600 px-2"
              >
                ✕
              </button>
            </div>
          ))}
          
          <button
            onClick={() => {
              const newMilestones = [...(timeline.milestones || []), { date: '', title: '', type: '' }];
              setTimeline(prev => ({ ...prev, milestones: newMilestones }));
            }}
            className="w-full py-2 border-2 border-dashed border-amber-300 rounded-lg text-sm text-amber-600 hover:border-amber-400 hover:text-amber-700 transition"
          >
            + Milestone Ekle
          </button>
        </div>
      </div>
      
      {/* PROJE YÖNETİCİSİ */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <span className="text-xl">📞</span>
          Proje Yöneticisi & İletişim
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-600 font-medium">Ad Soyad</label>
            <input
              type="text"
              value={timeline.projectManager?.name || ''}
              onChange={(e) => setTimeline(prev => ({
                ...prev,
                projectManager: { ...prev.projectManager, name: e.target.value }
              }))}
              placeholder="Murat Bucak"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-600 font-medium">Telefon</label>
            <input
              type="tel"
              value={timeline.projectManager?.phone || ''}
              onChange={(e) => setTimeline(prev => ({
                ...prev,
                projectManager: { ...prev.projectManager, phone: e.target.value }
              }))}
              placeholder="+90 532 XXX XX XX"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-600 font-medium">E-posta</label>
            <input
              type="email"
              value={timeline.projectManager?.email || ''}
              onChange={(e) => setTimeline(prev => ({
                ...prev,
                projectManager: { ...prev.projectManager, email: e.target.value }
              }))}
              placeholder="murat@vitingo.com"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-3">
          <label className="text-xs text-gray-600 font-medium">Ulaşılabilirlik Notu</label>
          <input
            type="text"
            value={timeline.projectManager?.availabilityNote || ''}
            onChange={(e) => setTimeline(prev => ({
              ...prev,
              projectManager: { ...prev.projectManager, availabilityNote: e.target.value }
            }))}
            placeholder="Kurulum döneminde 7/24 ulaşılabilir"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
    </div>
  );
};

export default TimelineModule;
