import React, { useState, useEffect } from 'react';
import { Archive, Calendar, Clock, MapPin, Users, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useToast } from '../../hooks/use-toast';

export default function ArchivedMeetingsPage({ onBack }) {
  const { toast } = useToast();
  const [archivedMeetings, setArchivedMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Load archived meetings
  const loadArchivedMeetings = async (page = 1) => {
    setIsLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Get all calendar events
      const response = await fetch(`${backendUrl}/api/calendar/events`);
      if (response.ok) {
        const allEvents = await response.json();
        
        // Filter past events (end_datetime < now)
        const now = new Date();
        const pastEvents = allEvents.filter(event => {
          const endDate = new Date(event.end_datetime);
          return endDate < now;
        });
        
        // Sort by date (newest first)
        pastEvents.sort((a, b) => new Date(b.end_datetime) - new Date(a.end_datetime));
        
        // Calculate pagination
        const total = Math.ceil(pastEvents.length / itemsPerPage);
        setTotalPages(total);
        
        // Get current page items
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = pastEvents.slice(startIndex, endIndex);
        
        setArchivedMeetings(pageItems);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error loading archived meetings:', error);
      toast({
        title: "Hata",
        description: "Arşiv yüklenirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArchivedMeetings();
  }, []);

  // Delete archived meeting
  const handleDelete = async (eventId, eventTitle) => {
    if (!confirm(`"${eventTitle}" toplantısını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/calendar/events/${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Toplantı arşivden silindi",
        });
        loadArchivedMeetings(currentPage); // Reload current page
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast({
        title: "Hata",
        description: "Toplantı silinirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Group meetings by time period
  const groupMeetingsByPeriod = (meetings) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const groups = {
      'Bugün': [],
      'Dün': [],
      'Bu Hafta': [],
      'Geçen Hafta': [],
      'Bu Ay': [],
      'Geçen Ay': [],
      'Daha Eski': []
    };

    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.end_datetime);
      const meetingDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());

      if (meetingDay.getTime() === today.getTime()) {
        groups['Bugün'].push(meeting);
      } else if (meetingDay.getTime() === yesterday.getTime()) {
        groups['Dün'].push(meeting);
      } else if (meetingDate >= thisWeekStart && meetingDate < today) {
        groups['Bu Hafta'].push(meeting);
      } else if (meetingDate >= lastWeekStart && meetingDate < thisWeekStart) {
        groups['Geçen Hafta'].push(meeting);
      } else if (meetingDate >= thisMonthStart && meetingDate < thisWeekStart) {
        groups['Bu Ay'].push(meeting);
      } else if (meetingDate >= lastMonthStart && meetingDate < thisMonthStart) {
        groups['Geçen Ay'].push(meeting);
      } else {
        groups['Daha Eski'].push(meeting);
      }
    });

    return groups;
  };

  const groupedMeetings = groupMeetingsByPeriod(archivedMeetings);

  // Format date
  const formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <Archive className="h-8 w-8 text-purple-600" />
              <span>Toplantı Arşivi</span>
            </h1>
            <p className="text-gray-600 mt-1">Zamanı geçmiş toplantılar</p>
          </div>
          <Button
            variant="outline"
            onClick={onBack}
            className="px-6"
          >
            Takvime Dön
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Yükleniyor...</div>
          </div>
        ) : archivedMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Archive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Arşivlenmiş toplantı bulunamadı</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMeetings).map(([period, meetings]) => (
              meetings.length > 0 && (
                <div key={period}>
                  <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    {period}
                  </h2>
                  <div className="space-y-3">
                    {meetings.map((meeting) => (
                      <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {meeting.title}
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-blue-500" />
                                  <span>{formatDate(meeting.start_datetime)}</span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-green-500" />
                                  <span>{formatTime(meeting.start_datetime)} - {formatTime(meeting.end_datetime)}</span>
                                </div>
                                
                                {meeting.location && (
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4 text-red-500" />
                                    <span>{meeting.location}</span>
                                  </div>
                                )}
                              </div>

                              {meeting.description && (
                                <p className="mt-2 text-sm text-gray-600">{meeting.description}</p>
                              )}

                              {meeting.attendee_ids && meeting.attendee_ids.length > 0 && (
                                <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                                  <Users className="h-4 w-4" />
                                  <span>{meeting.attendee_ids.length} katılımcı</span>
                                </div>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDelete(meeting.id, meeting.title)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => loadArchivedMeetings(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Önceki
            </Button>
            
            <span className="text-sm text-gray-600">
              Sayfa {currentPage} / {totalPages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => loadArchivedMeetings(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sonraki
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
