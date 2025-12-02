import React from 'react';
import { useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { 
  Users, 
  DollarSign, 
  Target
} from 'lucide-react';

// Dashboard component'lerini import et
import ModernKPICard from '../../components/Dashboard/ModernKPICard';
import ModernSalesChart from '../../components/Dashboard/ModernSalesChart';
import SalesByCountryTable from '../../components/Dashboard/SalesByCountryTable';
import RecentTransactionsTable from '../../components/Dashboard/RecentTransactionsTable';
import TopCustomersCard from '../../components/Dashboard/TopCustomersCard';
import RealTimeSurveyStats from '../../components/Dashboard/RealTimeSurveyStats';
import GeographicSalesMap from '../../components/Dashboard/GeographicSalesMap';
import CurrencyTooltip from '../../components/Dashboard/CurrencyTooltip';
import SalesSummaryCard from '../../components/Dashboard/SalesSummaryCard';
import GrowthRateCard from '../../components/Dashboard/GrowthRateCard';
import PassiveLeadsCard from '../../components/Dashboard/PassiveLeadsCard';

const DashboardPage = () => {
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  return (
    <>
      {/* Modern Top bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-xl px-4 py-6 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {tenant?.name || 'Vitingo CRM'}
              </h1>
              <p className="text-slate-300 mt-1">Modern İş Yönetimi Dashboard'u</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-sm font-medium text-white">Bugün</p>
              <p className="text-xs text-slate-300">
                {new Date().toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-600"></div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">Online</p>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-300">Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        {/* Welcome Message */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Hoş Geldiniz! 🚀</h2>
              <p className="text-blue-100">Bugün harika bir performans sergiliyorsunuz. İşte özet durumunuz:</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end">
                <p className="text-2xl font-bold">₺{(2847500).toLocaleString('tr-TR')}</p>
                <CurrencyTooltip tryAmount={2847500} />
              </div>
              <p className="text-blue-100 text-sm">Bu Ayın Toplam Satışı</p>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ModernKPICard
            title="Toplam Satışlar"
            value={2847500}
            change="+23.8%"
            changeType="positive"
            icon={DollarSign}
            gradient="from-green-500 to-green-600"
            isCurrency={true}
          />
          <GrowthRateCard />
          <ModernKPICard
            title="Aktif Müşteri"
            value={156}
            change="156 müşteri"
            changeType="positive"
            icon={Users}
            gradient="from-orange-500 to-orange-600"
          />
          <PassiveLeadsCard />
        </div>

        {/* Second Row KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ModernKPICard
            title="Açık Leadler"
            value={89}
            change="+12 bu hafta"
            changeType="positive"
            icon={Users}
            gradient="from-cyan-500 to-cyan-600"
          />
          <ModernKPICard
            title="Kaybedilen Leadler"
            value={15}
            change="-3 bu hafta"
            changeType="positive"
            icon={Users}
            gradient="from-red-500 to-red-600"
          />
          <ModernKPICard
            title="Toplam Alacaklar"
            value={1234567}
            change="+8.9%"
            changeType="positive"
            icon={DollarSign}
            gradient="from-indigo-500 to-indigo-600"
            isCurrency={true}
          />
          <ModernKPICard
            title="CSAT Puanı"
            value={87.5}
            change="+2.3%"
            changeType="positive"
            icon={Target}
            gradient="from-pink-500 to-pink-600"
            isPercentage={true}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2">
            <ModernSalesChart />
          </div>
          <RealTimeSurveyStats />
        </div>

        {/* Sales Summary and Additional Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <SalesSummaryCard />
          <GeographicSalesMap />
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <SalesByCountryTable />
          <RecentTransactionsTable />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1">
          <TopCustomersCard />
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
