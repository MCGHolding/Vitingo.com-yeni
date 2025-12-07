/**
 * Demo Navigation Config
 * =======================
 * Sidebar'da Demo bölümü için menü yapılandırması
 * 
 * Bu bölüm sadece:
 * 1. Feature flag 'demo_module' açıksa
 * 2. Kullanıcı super-admin veya admin ise
 * görünür.
 */

import {
  Beaker,           // Demo ana icon
  Users,            // Müşteriler V2
  LayoutDashboard,  // Dashboard V2
  FileText,         // Faturalar V2
  TrendingUp,       // Raporlar V2
  Zap,              // Lead Generation
  Mail,             // E-posta Thread
  Settings,         // Ayarlar
  Sparkles,         // AI Features
  Globe,            // Global Data
  Package,          // Paketler
  Flag,             // Feature Flags
} from 'lucide-react';

export const demoNavigation = {
  name: 'Demo',
  icon: Beaker,
  featureFlag: 'demo_module', // Bu flag açık olmalı
  requiredRoles: ['super-admin', 'admin'], // Bu roller gerekli
  
  submenu: [
    {
      name: 'Müşteriler V2',
      href: '/demo/musteriler-v2',
      icon: Users,
      description: 'Gelişmiş müşteri modülü',
      featureFlag: 'customer_module_v2',
      badge: 'Yeni',
      badgeColor: 'green'
    },
    {
      name: 'Dashboard V2',
      href: '/demo/dashboard-v2',
      icon: LayoutDashboard,
      description: 'Yeni dashboard tasarımı',
      featureFlag: 'dashboard_v2',
      badge: 'Beta',
      badgeColor: 'blue'
    },
    {
      name: 'E-posta Threads',
      href: '/demo/email-threads',
      icon: Mail,
      description: 'Müşteri yazışma sistemi',
      featureFlag: 'email_threads',
      badge: 'Geliştiriliyor',
      badgeColor: 'yellow'
    },
    {
      name: 'Lead Generation',
      href: '/demo/lead-gen',
      icon: Zap,
      description: 'Apollo/RocketReach entegrasyonu',
      featureFlag: 'lead_generation',
      badge: 'Yakında',
      badgeColor: 'purple'
    },
    {
      name: 'AI Özellikleri',
      href: '/demo/ai-features',
      icon: Sparkles,
      description: 'AI destekli özellikler',
      featureFlag: 'ai_features',
      badge: 'Deneysel',
      badgeColor: 'pink'
    },
    
    // Admin araçları (sadece super-admin)
    {
      name: '─── Admin Araçları ───',
      type: 'divider',
      requiredRoles: ['super-admin']
    },
    {
      name: 'Global Data Yönetimi',
      href: '/demo/admin/global-data',
      icon: Globe,
      description: 'Para birimi, ülke, şehir yönetimi',
      requiredRoles: ['super-admin']
    },
    {
      name: 'Feature Flags',
      href: '/demo/admin/feature-flags',
      icon: Flag,
      description: 'Feature flag yönetimi',
      requiredRoles: ['super-admin']
    },
    {
      name: 'Paket Yönetimi',
      href: '/demo/admin/packages',
      icon: Package,
      description: 'Paket ve özellik yönetimi',
      requiredRoles: ['super-admin']
    }
  ]
};

/**
 * Demo menüsünü filtrele (kullanıcı rolüne göre)
 */
export const filterDemoNavigation = (userRole) => {
  return {
    ...demoNavigation,
    submenu: demoNavigation.submenu.filter(item => {
      // Divider'lar için rol kontrolü
      if (item.type === 'divider') {
        if (item.requiredRoles && !item.requiredRoles.includes(userRole)) {
          return false;
        }
        return true;
      }
      
      // Normal menü öğeleri için rol kontrolü
      if (item.requiredRoles && !item.requiredRoles.includes(userRole)) {
        return false;
      }
      
      return true;
    })
  };
};

/**
 * Badge renk sınıfları
 */
export const badgeColors = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  purple: 'bg-purple-100 text-purple-800',
  pink: 'bg-pink-100 text-pink-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
};

export default demoNavigation;
