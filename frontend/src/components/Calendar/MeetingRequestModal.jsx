import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Calendar, Clock, MapPin, Video, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MeetingRequestModal = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [requestForm, setRequestForm] = useState({
    subject: '',
    date: '',
    start_time: '',
    end_time: '',
    meeting_type: 'physical',
    location: '',
    platform: 'Zoom',
    meeting_link: '',
    attendee_ids: []
  });

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const platformOptions = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'WebEx'];

  // Realistic test data samples
  const testDataSamples = {
    subjects: [
      'Proje Durum Değerlendirme Toplantısı',
      'Haftalık Ekip Koordinasyon Toplantısı',
      'Müşteri Görüşmesi - Yeni Proje',
      'Aylık Performans Değerlendirme',
      'Stratejik Planlama Toplantısı',
      'Teknik Analiz ve Çözüm Toplantısı',
      'Bütçe Planlama Görüşmesi'
    ],
    locations: [
      'Toplantı Odası 1 (Zemin Kat)',
      'Toplantı Odası 2 (1. Kat)',
      'Yönetim Kurulu Salonu',
      'Kafeterya Toplantı Alanı',
      'Açık Ofis Alan B'
    ],
    platforms: ['Zoom', 'Google Meet', 'Microsoft Teams']
  };

  // Load system users
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // First try to get users from database
      const response = await fetch(`${BACKEND_URL}/api/users?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const usersData = await response.json();
        console.log('RAW API RESPONSE:', usersData);
        
        // If no users in database, run migration
        if (usersData.length === 0) {
          console.log('No users found in database, running migration...');
          
          const migrationResponse = await fetch(`${BACKEND_URL}/api/users/migrate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (migrationResponse.ok) {
            const migrationResult = await migrationResponse.json();
            console.log('Migration successful:', migrationResult);
            
            // Reload users after migration
            const retryResponse = await fetch(`${BACKEND_URL}/api/users?t=${Date.now()}`);
            if (retryResponse.ok) {
              const retryUsersData = await retryResponse.json();
              const filteredUsers = retryUsersData.filter(user => user.id !== currentUser.id);
              setUsers(filteredUsers);
              console.log(`✅ LOADED ${filteredUsers.length} MIGRATED USERS FROM DATABASE:`);
              filteredUsers.forEach(user => {
                console.log(`- ${user.name} (${user.email}) - ${user.department}`);
              });
            }
          } else {
            console.error('Migration failed');
          }
        } else {
          // Users exist in database, use them
          const filteredUsers = usersData.filter(user => user.id !== currentUser.id);
          setUsers(filteredUsers);
          console.log(`✅ LOADED ${filteredUsers.length} USERS FROM DATABASE:`);
          
          filteredUsers.forEach(user => {
            console.log(`- ${user.name} (${user.email}) - ${user.department}`);
          });
        }
      } else {
        console.error('Failed to load users, status:', response.status);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Reset form when modal opens
      setRequestForm({
        subject: '',
        date: '',
        start_time: '',
        end_time: '',
        meeting_type: 'physical',
        location: '',
        platform: 'Zoom',
        meeting_link: '',
        attendee_ids: []
      });
      setUserSearchTerm('');
    }
  }, [isOpen]);

  // Fill form with realistic test data
  const fillTestData = () => {
    const randomSubject = testDataSamples.subjects[Math.floor(Math.random() * testDataSamples.subjects.length)];
    const randomMeetingType = Math.random() > 0.5 ? 'physical' : 'online';
    const randomLocation = testDataSamples.locations[Math.floor(Math.random() * testDataSamples.locations.length)];
    const randomPlatform = testDataSamples.platforms[Math.floor(Math.random() * testDataSamples.platforms.length)];
    
    // Generate date (tomorrow or 2-3 days from now)
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + Math.floor(Math.random() * 3) + 1);
    const dateStr = futureDate.toISOString().split('T')[0];
    
    // Generate time (between 09:00 and 16:00, 1 hour duration)
    const startHour = Math.floor(Math.random() * 7) + 9; // 9-15
    const startMinute = Math.random() > 0.5 ? '00' : '30';
    const startTime = `${String(startHour).padStart(2, '0')}:${startMinute}`;
    
    const endHour = startMinute === '30' ? startHour + 1 : startHour;
    const endMinute = startMinute === '30' ? '30' : '00';
    const endTime = `${String(endHour + 1).padStart(2, '0')}:${endMinute}`;
    
    // Select 1-3 random attendees
    const randomAttendeeCount = Math.min(Math.floor(Math.random() * 3) + 1, users.length);
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const selectedAttendees = shuffledUsers.slice(0, randomAttendeeCount).map(u => u.id);
    
    setRequestForm({
      subject: randomSubject,
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
      meeting_type: randomMeetingType,
      location: randomMeetingType === 'physical' ? randomLocation : '',
      platform: randomMeetingType === 'online' ? randomPlatform : 'Zoom',
      meeting_link: randomMeetingType === 'online' ? `https://meet.example.com/${Math.random().toString(36).substr(2, 9)}` : '',
      attendee_ids: selectedAttendees
    });
    
    console.log('✅ Test verisi dolduruldu:', {
      subject: randomSubject,
      date: dateStr,
      time: `${startTime} - ${endTime}`,
      type: randomMeetingType,
      attendees: selectedAttendees.length
    });
  };

  // Create meeting request
  const handleCreateRequest = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create meeting request
      const response = await fetch(`${BACKEND_URL}/api/meeting-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestForm,
          organizer_id: currentUser.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Meeting request created:', result);
        
        // 2. ALSO create calendar event so it shows in calendar immediately
        try {
          // Combine date and time to create datetime
          const startDatetime = `${requestForm.date}T${requestForm.start_time}:00`;
          const endDatetime = `${requestForm.date}T${requestForm.end_time}:00`;
          
          const calendarEventData = {
            title: requestForm.subject,
            description: `Toplantı Talebi - ${requestForm.meeting_type === 'physical' ? 'Fiziksel' : 'Online'}`,
            start_datetime: startDatetime,
            end_datetime: endDatetime,
            location: requestForm.meeting_type === 'physical' ? requestForm.location : requestForm.platform,
            event_type: 'meeting',
            visibility: 'public',
            organizer_id: currentUser?.id || 'system',
            attendee_ids: requestForm.attendee_ids || []
          };
          
          console.log('📅 Creating calendar event:', calendarEventData);
          
          const calendarResponse = await fetch(`${BACKEND_URL}/api/calendar/events`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(calendarEventData)
          });
          
          if (calendarResponse.ok) {
            console.log('✅ Calendar event also created successfully');
          } else {
            console.warn('⚠️ Calendar event creation failed, but meeting request was created');
          }
        } catch (calendarError) {
          console.error('Error creating calendar event:', calendarError);
          // Don't fail the whole operation if calendar creation fails
        }
        
        // Reset form and close modal
        setRequestForm({
          subject: '',
          date: '',
          start_time: '',
          end_time: '',
          meeting_type: 'physical',
          location: '',
          platform: 'Zoom',
          meeting_link: '',
          attendee_ids: []
        });
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
        
        onClose();
      } else {
        throw new Error('Failed to create meeting request');
      }
    } catch (error) {
      console.error('Error creating meeting request:', error);
      alert('Toplantı talebi oluşturulurken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5); // HH:MM format
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <span>Yeni Toplantı Talebi</span>
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={fillTestData}
                className="px-4 py-2 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Gerçekçi Veri Doldur</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Toplantı Konusu *
            </label>
            <input
              type="text"
              value={requestForm.subject}
              onChange={(e) => setRequestForm({...requestForm, subject: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Toplantı konusunu girin"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarih *
              </label>
              <input
                type="date"
                value={requestForm.date}
                onChange={(e) => setRequestForm({...requestForm, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Saati *
              </label>
              <input
                type="time"
                value={requestForm.start_time}
                onChange={(e) => setRequestForm({...requestForm, start_time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitiş Saati *
              </label>
              <input
                type="time"
                value={requestForm.end_time}
                onChange={(e) => setRequestForm({...requestForm, end_time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Toplantı Türü *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="meeting_type"
                  value="physical"
                  checked={requestForm.meeting_type === 'physical'}
                  onChange={(e) => setRequestForm({...requestForm, meeting_type: e.target.value})}
                  className="mr-2"
                />
                <MapPin className="h-4 w-4 mr-1" />
                Fiziki
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="meeting_type"
                  value="virtual"
                  checked={requestForm.meeting_type === 'virtual'}
                  onChange={(e) => setRequestForm({...requestForm, meeting_type: e.target.value})}
                  className="mr-2"
                />
                <Video className="h-4 w-4 mr-1" />
                Sanal
              </label>
            </div>
          </div>

          {/* Conditional Location/Platform */}
          {requestForm.meeting_type === 'physical' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toplantı Adresi *
              </label>
              <textarea
                value={requestForm.location}
                onChange={(e) => setRequestForm({...requestForm, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Toplantı adresini girin"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform *
                </label>
                <select
                  value={requestForm.platform}
                  onChange={(e) => setRequestForm({...requestForm, platform: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {platformOptions.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toplantı Linki
                </label>
                <input
                  type="url"
                  value={requestForm.meeting_link}
                  onChange={(e) => setRequestForm({...requestForm, meeting_link: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://zoom.us/j/123456789 veya Google Meet linki"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Toplantı linkinizi buraya kopyalayın. Katılımcılar bu linke tıklayarak toplantıya katılabilecek.
                </p>
              </div>
            </div>
          )}

          {/* Attendees */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Katılımcılar ({requestForm.attendee_ids.length} kişi seçildi)
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setRequestForm({
                      ...requestForm,
                      attendee_ids: users.map(user => user.id)
                    });
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Tümünü Seç
                </button>
                <span className="text-xs text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setRequestForm({
                      ...requestForm,
                      attendee_ids: []
                    });
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Tümünü Temizle
                </button>
              </div>
            </div>

            {/* Search box */}
            <div className="mb-2 relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Kullanıcı ara (ad, email, departman)..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {isLoadingUsers ? (
              <div className="text-sm text-gray-500 py-4 text-center">Kullanıcılar yükleniyor...</div>
            ) : (
              <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    Sistem kayıtlı kullanıcı bulunamadı
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {(() => {
                      const filteredUsers = users.filter(user => {
                        if (!userSearchTerm) return true;
                        const searchLower = userSearchTerm.toLowerCase();
                        return (
                          user.name.toLowerCase().includes(searchLower) ||
                          user.email.toLowerCase().includes(searchLower) ||
                          (user.department && user.department.toLowerCase().includes(searchLower))
                        );
                      });

                      // Group by department
                      const groupedUsers = filteredUsers.reduce((groups, user) => {
                        const dept = user.department || 'Diğer';
                        if (!groups[dept]) groups[dept] = [];
                        groups[dept].push(user);
                        return groups;
                      }, {});

                      return Object.keys(groupedUsers).sort().map(department => (
                        <div key={department} className="mb-3">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
                            {department}
                          </div>
                          {groupedUsers[department].map(user => (
                            <label key={user.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={requestForm.attendee_ids.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRequestForm({
                                      ...requestForm,
                                      attendee_ids: [...requestForm.attendee_ids, user.id]
                                    });
                                  } else {
                                    setRequestForm({
                                      ...requestForm,
                                      attendee_ids: requestForm.attendee_ids.filter(id => id !== user.id)
                                    });
                                  }
                                }}
                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {user.name}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                      {user.email}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-medium text-gray-700">
                                      {user.department}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                      {user.role === 'admin' ? '👑 Yönetici' : 
                                       user.role === 'manager' ? '📋 Müdür' : 
                                       '👤 Çalışan'}
                                    </p>
                                  </div>
                                </div>
                                {user.phone && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {user.phone}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}
            
            {/* Selected users summary */}
            {requestForm.attendee_ids.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 rounded border">
                <p className="text-xs text-blue-700 font-medium mb-1">Seçilen Katılımcılar:</p>
                <div className="flex flex-wrap gap-1">
                  {requestForm.attendee_ids.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <span
                        key={userId}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                      >
                        {user.name}
                        <button
                          onClick={() => {
                            setRequestForm({
                              ...requestForm,
                              attendee_ids: requestForm.attendee_ids.filter(id => id !== userId)
                            });
                          }}
                          className="ml-1 hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={handleCreateRequest}
              disabled={!requestForm.subject || !requestForm.date || !requestForm.start_time || !requestForm.end_time || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Toplantı Talebi Oluştur</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRequestModal;