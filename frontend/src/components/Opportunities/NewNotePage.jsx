import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft,
  Save,
  FileText,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  Quote,
  Code,
  Highlighter,
  Calendar,
  Tag,
  User,
  Clock,
  Sparkles,
  Plus,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function NewNotePage({ 
  opportunity, 
  onBack, 
  onSave 
}) {
  const { toast } = useToast();
  const textareaRef = useRef(null);
  
  // Form states
  const [noteData, setNoteData] = useState({
    title: '',
    content: '',
    tags: [],
    priority: 'medium', // low, medium, high, critical
    category: 'general' // general, meeting, call, email, task, follow_up
  });
  
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Note categories
  const NOTE_CATEGORIES = {
    general: { label: 'Genel', color: 'bg-blue-100 text-blue-800', icon: FileText },
    meeting: { label: 'Toplantı', color: 'bg-green-100 text-green-800', icon: Calendar },
    call: { label: 'Görüşme', color: 'bg-purple-100 text-purple-800', icon: User },
    email: { label: 'E-posta', color: 'bg-orange-100 text-orange-800', icon: FileText },
    task: { label: 'Görev', color: 'bg-red-100 text-red-800', icon: List },
    follow_up: { label: 'Takip', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
  };

  // Priority levels
  const PRIORITY_LEVELS = {
    low: { label: 'Düşük', color: 'bg-gray-100 text-gray-800' },
    medium: { label: 'Orta', color: 'bg-blue-100 text-blue-800' },
    high: { label: 'Yüksek', color: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Kritik', color: 'bg-red-100 text-red-800' }
  };

  const handleInputChange = (field, value) => {
    setNoteData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !noteData.tags.includes(newTag.trim())) {
      setNoteData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNoteData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const insertTextAtCursor = (text) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = noteData.content;
      const newContent = currentContent.substring(0, start) + text + currentContent.substring(end);
      
      handleInputChange('content', newContent);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    }
  };

  const formatText = (format) => {
    const formatMap = {
      bold: '**Kalın Metin**',
      italic: '*İtalik Metin*',
      underline: '<u>Altı Çizili Metin</u>',
      bullet: '\n• ',
      numbered: '\n1. ',
      quote: '\n> ',
      code: '`kod`',
      link: '[Link Metni](https://example.com)'
    };
    
    insertTextAtCursor(formatMap[format] || '');
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!noteData.title.trim()) {
        toast({
          title: "Hata",
          description: "Not başlığı boş olamaz.",
          variant: "destructive",
        });
        return;
      }

      if (!noteData.content.trim()) {
        toast({
          title: "Hata", 
          description: "Not içeriği boş olamaz.",
          variant: "destructive",
        });
        return;
      }

      const notePayload = {
        content: `# ${noteData.title}\n\n${noteData.content}`,
        category: noteData.category,
        priority: noteData.priority,
        tags: noteData.tags,
        metadata: {
          title: noteData.title,
          category: noteData.category,
          priority: noteData.priority,
          tags: noteData.tags
        }
      };

      console.log('💾 Saving note:', notePayload);

      const response = await fetch(`${BACKEND_URL}/api/opportunities/${opportunity.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notePayload)
      });

      if (!response.ok) {
        throw new Error('Not kaydedilemedi');
      }

      const savedNote = await response.json();
      console.log('✅ Note saved successfully:', savedNote);

      toast({
        title: "Başarılı",
        description: "Not başarıyla kaydedildi.",
        className: "bg-green-50 border-green-200 text-green-800",
      });

      // Call onSave callback if provided
      if (onSave) {
        onSave(savedNote);
      }

      // Go back to activity timeline
      if (onBack) {
        onBack();
      }

    } catch (error) {
      console.error('❌ Error saving note:', error);
      toast({
        title: "Hata",
        description: "Not kaydedilirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    const content = `# ${noteData.title}\n\n${noteData.content}`;
    // Simple markdown preview - in a real app you might use a markdown parser
    return (
      <div className="prose prose-sm max-w-none">
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-white hover:bg-white/20 p-2 rounded-lg"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FileText className="h-7 w-7" />
                  </div>
                  <h1 className="text-3xl font-bold">Yeni Not Oluştur</h1>
                </div>
                <p className="mt-2 text-green-100">
                  {opportunity?.eventName || opportunity?.title} için detaylı not oluşturun
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowPreview(!showPreview)}
                className="text-white hover:bg-white/20 px-4 py-2 rounded-lg"
              >
                {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPreview ? 'Düzenle' : 'Önizleme'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !noteData.title.trim() || !noteData.content.trim()}
                className="bg-white text-green-600 hover:bg-green-50 px-6 py-2 font-semibold rounded-lg shadow-lg"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Note Editor */}
          <div className="lg:col-span-3">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <Sparkles className="h-6 w-6 text-green-600" />
                  <span>Not Editörü</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                
                {/* Note Title */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Not Başlığı *
                  </label>
                  <Input
                    value={noteData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Not başlığını giriniz..."
                    className="text-lg font-medium"
                  />
                </div>

                {/* Formatting Toolbar */}
                {!showPreview && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('bold')}
                        className="h-8 px-3"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('italic')}
                        className="h-8 px-3"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('underline')}
                        className="h-8 px-3"
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                      <div className="h-6 w-px bg-gray-300 mx-1"></div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('bullet')}
                        className="h-8 px-3"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('numbered')}
                        className="h-8 px-3"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <div className="h-6 w-px bg-gray-300 mx-1"></div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('quote')}
                        className="h-8 px-3"
                      >
                        <Quote className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('code')}
                        className="h-8 px-3"
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => formatText('link')}
                        className="h-8 px-3"
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Note Content */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Not İçeriği *
                  </label>
                  {showPreview ? (
                    <div className="min-h-[300px] p-4 border rounded-lg bg-gray-50">
                      {renderPreview()}
                    </div>
                  ) : (
                    <Textarea
                      ref={textareaRef}
                      value={noteData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="Not içeriğinizi buraya yazabilirsiniz. Markdown formatını destekler..."
                      className="min-h-[300px] text-base leading-relaxed"
                    />
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Etiketler
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {noteData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 flex items-center space-x-2">
                        <span>{tag}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-red-600" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Etiket ekle..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white px-4"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Note Settings */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800">Not Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori
                  </label>
                  <div className="space-y-2">
                    {Object.entries(NOTE_CATEGORIES).map(([key, category]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`category-${key}`}
                          name="category"
                          value={key}
                          checked={noteData.category === key}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="text-green-600"
                        />
                        <label htmlFor={`category-${key}`} className="flex items-center space-x-2 cursor-pointer">
                          <category.icon className="h-4 w-4" />
                          <Badge className={`${category.color} text-xs`}>
                            {category.label}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Öncelik
                  </label>
                  <div className="space-y-2">
                    {Object.entries(PRIORITY_LEVELS).map(([key, priority]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`priority-${key}`}
                          name="priority"
                          value={key}
                          checked={noteData.priority === key}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          className="text-green-600"
                        />
                        <label htmlFor={`priority-${key}`} className="cursor-pointer">
                          <Badge className={`${priority.color} text-xs`}>
                            {priority.label}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Opportunity Info */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800">Fırsat Bilgisi</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fırsat Adı</label>
                    <p className="font-semibold text-gray-800">{opportunity?.eventName || opportunity?.title || 'Bilinmiyor'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Müşteri</label>
                    <p className="text-gray-700">{opportunity?.customer || 'Bilinmiyor'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Durum</label>
                    <p className="text-gray-700">{opportunity?.statusText || 'Bilinmiyor'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}