import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, Plus, Edit2, Trash2, X } from 'lucide-react';
import moment from 'moment';
import apiClient from '../../utils/apiClient';
import ChatModal from './ChatModal';
import MeetingRequestModal from './MeetingRequestModal';

const CalendarPage = ({ currentUser = { id: 'demo_user', role: 'user', name: 'Demo User' } }) => {
  const { tenantSlug } = useParams();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showMeetingRequestModal, setShowMeetingRequestModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef(null);

  // Form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    event_type: 'meeting',
    visibility: 'public',
    attendee_ids: [],
    meeting_link: '',
    all_day: false
  });

  // Mock users for demo (in real app, fetch from API)
  const [users] = useState([
    { id: 'demo_user', name: 'Demo User', email: 'demo@example.com', role: 'user' },
    { id: 'admin_user', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
    { id: 'user1', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', role: 'user' },
    { id: 'user2', name: 'Fatma Demir', email: 'fatma@example.com', role: 'user' },
    { id: 'user3', name: 'Mehmet Kaya', email: 'mehmet@example.com', role: 'user' }
  ]);

  useEffect(() => {
    if (tenantSlug) {
      apiClient.setTenantSlug(tenantSlug);
    }
    loadEvents();
  }, [tenantSlug]);

  // Load events
  const loadEvents = async () => {
    try {
      const response = await apiClient.getCalendarEvents();
      
      if (response && response.status === 'success') {
        const eventsData = response.data || [];
        console.log(`✅ Loaded ${eventsData.length} calendar events from tenant-aware API`);
        console.log(`📊 Tenant: ${response.tenant?.name}`);
        
        // Events are already filtered by backend (is_archived != true)
        // Transform events for FullCalendar
        const transformedEvents = eventsData.map(event => ({
          id: event.id,
          title: event.title,
          start: event.start_datetime,
          end: event.end_datetime,
          allDay: event.all_day,
          backgroundColor: getEventColor(event.event_type),
          borderColor: getEventColor(event.event_type),
          extendedProps: {
            description: event.description,
            location: event.location,
            organizer_name: event.organizer_name,
            attendees: event.attendees,
            event_type: event.event_type,
            meeting_link: event.meeting_link
          }
        }));
        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed invitation loading functionality

  useEffect(() => {
    loadEvents();
  }, []);

  // Get event color based on type
  const getEventColor = (eventType) => {
    const colors = {
      meeting: '#3B82F6',
      task: '#10B981',
      reminder: '#F59E0B',
      personal: '#8B5CF6'
    };
    return colors[eventType] || '#6B7280';
  };

  // Handle date select - DISABLED: Only use "Yeni Toplantı Talebi" button
  const handleDateSelect = (selectInfo) => {
    // Do nothing - direct calendar click disabled
    // User must use "Yeni Toplantı Talebi" button to create meetings
    console.log('Direct calendar click disabled. Use "Yeni Toplantı Talebi" button.');
  };

  // Handle event click
  const handleEventClick = (clickInfo) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      allDay: clickInfo.event.allDay,
      ...clickInfo.event.extendedProps
    });
    setShowEventModal(true);
  };

  // Create new event
  const handleCreateEvent = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventForm,
          start_datetime: moment(eventForm.start_datetime).toISOString(),
          end_datetime: moment(eventForm.end_datetime).toISOString()
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setEventForm({
          title: '',
          description: '',
          start_datetime: '',
          end_datetime: '',
          location: '',
          event_type: 'meeting',
          visibility: 'public',
          attendee_ids: [],
          meeting_link: '',
          all_day: false
        });
        loadEvents(); // Reload events
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  // Removed invitation response functionality

  const canViewAllCalendars = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  return (
    <div className="h-screen bg-gray-50">
      {/* Main Calendar Area */}
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Takvim</h1>
              <p className="text-gray-600">
                {canViewAllCalendars ? 'Tüm takvimleri görüntülüyorsunuz' : 'Kendi takviminizi görüntülüyorsunuz'}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowMeetingRequestModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Toplantı Talebi</span>
            </button>
            
            <button
              onClick={() => setShowChatModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Sohbet</span>
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-gray-500">Takvim yükleniyor...</div>
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              initialView="dayGridMonth"
              editable={true}
              selectable={false}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={events}
              select={handleDateSelect}
              eventClick={handleEventClick}
              locale="tr"
              height="calc(100vh - 150px)"
              buttonText={{
                today: 'Bugün',
                month: 'Ay',
                week: 'Hafta',
                day: 'Gün',
                list: 'Liste'
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
            />
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlangıç
                  </label>
                  <p className="text-gray-900">
                    {moment(selectedEvent.start).format('DD.MM.YYYY HH:mm')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bitiş
                  </label>
                  <p className="text-gray-900">
                    {moment(selectedEvent.end).format('DD.MM.YYYY HH:mm')}
                  </p>
                </div>
              </div>

              {selectedEvent.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <p className="text-gray-900">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konum
                  </label>
                  <p className="text-gray-900">{selectedEvent.location}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Düzenleyen
                </label>
                <p className="text-gray-900">{selectedEvent.organizer_name}</p>
              </div>

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Katılımcılar
                  </label>
                  <div className="space-y-1">
                    {selectedEvent.attendees.map((attendee, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-900">{attendee.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          attendee.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          attendee.status === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {attendee.status === 'accepted' ? 'Kabul' :
                           attendee.status === 'declined' ? 'Reddetti' : 'Bekliyor'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Yeni Toplantı Oluştur</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toplantı Başlığı *
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Toplantı başlığını girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Toplantı açıklaması"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.start_datetime}
                    onChange={(e) => setEventForm({...eventForm, start_datetime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.end_datetime}
                    onChange={(e) => setEventForm({...eventForm, end_datetime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konum
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Toplantı konumu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Katılımcılar
                </label>
                <select
                  multiple
                  value={eventForm.attendee_ids}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                    setEventForm({...eventForm, attendee_ids: selectedIds});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                >
                  {users.filter(user => user.id !== currentUser.id).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Birden fazla katılımcı seçmek için Ctrl/Cmd tuşunu basılı tutun
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Toplantı Türü
                  </label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm({...eventForm, event_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="meeting">Toplantı</option>
                    <option value="task">Görev</option>
                    <option value="reminder">Hatırlatıcı</option>
                    <option value="personal">Kişisel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Görünürlük
                  </label>
                  <select
                    value={eventForm.visibility}
                    onChange={(e) => setEventForm({...eventForm, visibility: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="public">Herkese Açık</option>
                    <option value="private">Özel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toplantı Bağlantısı
                </label>
                <input
                  type="url"
                  value={eventForm.meeting_link}
                  onChange={(e) => setEventForm({...eventForm, meeting_link: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Zoom, Teams bağlantısı"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={!eventForm.title || !eventForm.start_datetime || !eventForm.end_datetime}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md"
                >
                  Toplantı Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      <ChatModal 
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        currentUser={currentUser}
      />

      {/* Meeting Request Modal */}
      <MeetingRequestModal 
        isOpen={showMeetingRequestModal}
        onClose={() => setShowMeetingRequestModal(false)}
        currentUser={currentUser}
        onSuccess={(result) => {
          console.log('Meeting request created successfully:', result);
          // Optionally reload events or show success message
          loadEvents();
        }}
      />
    </div>
  );
};

export default CalendarPage;