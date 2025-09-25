import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { 
  X,
  Users,
  User,
  Crown,
  Briefcase,
  UserCheck,
  Loader2,
  Shield
} from 'lucide-react';

export default function UserSwitchModal({ onClose }) {
  const { switchUser, getAvailableUsers, getRoleName } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const availableUsers = getAvailableUsers();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return Crown;
      case 'sales_manager': return Briefcase;
      case 'sales_rep': return UserCheck;
      default: return User;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'sales_manager': return 'bg-blue-100 text-blue-800';
      case 'sales_rep': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUserSwitch = async (userId) => {
    setLoading(true);
    setSelectedUserId(userId);

    try {
      await switchUser(userId);
      const switchedUser = availableUsers.find(u => u.id === userId);
      
      toast({
        title: "Kullanıcı Değiştirildi",
        description: `${switchedUser.fullName} olarak oturum açıldı.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSelectedUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-auto">
        <Card className="border-0 h-full">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center space-x-3">
                <Shield className="h-7 w-7" />
                <span>Kullanıcı Değiştir</span>
                <Badge className="bg-white/20 text-white text-sm px-3 py-1">Admin Yetkisi</Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2"
                disabled={loading}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-10">
            <div className="mb-10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Users className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Kullanılabilir Kullanıcılar</h3>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Admin yetkileriyle şifre girmeden diğer kullanıcı hesaplarına geçiş yapabilirsiniz. 
                Değiştirmek istediğiniz kullanıcıyı seçin.
              </p>
            </div>

            <div className="space-y-6">
              {availableUsers.map((targetUser) => {
                const RoleIcon = getRoleIcon(targetUser.role);
                const isLoading = loading && selectedUserId === targetUser.id;
                
                return (
                  <div
                    key={targetUser.id}
                    className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-5 flex-1">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="h-16 w-16 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                            {targetUser.avatar ? (
                              <img 
                                src={targetUser.avatar} 
                                alt="Avatar" 
                                className="h-16 w-16 rounded-2xl object-cover" 
                              />
                            ) : (
                              <User className="h-8 w-8 text-white" />
                            )}
                          </div>
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-xl font-bold text-gray-900 truncate">{targetUser.fullName}</h4>
                            <Badge className={`${getRoleBadgeColor(targetUser.role)} text-sm px-3 py-1`}>
                              <RoleIcon className="h-4 w-4 mr-1.5" />
                              {getRoleName(targetUser.role)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-gray-600 font-medium">{targetUser.email}</p>
                            <p className="text-sm text-gray-500">
                              📂 {targetUser.department} • 👤 {targetUser.username}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Switch Button */}
                      <div className="ml-4">
                        <Button
                          onClick={() => handleUserSwitch(targetUser.id)}
                          disabled={loading}
                          size="lg"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-base font-semibold"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Geçiliyor...
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-5 w-5" />
                              Kullanıcıya Geç
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                );
              })}
            </div>

            {availableUsers.length === 0 && (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Kullanıcı Bulunamadı</h3>
                <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
                  Şu anda geçiş yapılabilecek kullanıcı bulunmuyor. Yeni kullanıcılar eklemek için sistem ayarlarını kontrol edin.
                </p>
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-gray-600">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-base font-medium">Bu özellik sadece admin kullanıcıları tarafından kullanılabilir.</span>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onClose}
                  disabled={loading}
                  className="px-10 py-4 text-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Kapat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}