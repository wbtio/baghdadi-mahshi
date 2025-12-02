'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Loader2, TrendingUp, ShoppingBag, DollarSign, CheckCircle, Package } from 'lucide-react';

// --- Interfaces ---
interface OrderData {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface OrderItemData {
  menu_item_id: string;
  quantity: number;
  menu_item?: any;
}

// --- Colors & Config ---
const COLORS = {
  primary: '#d4a574',
  primaryLight: '#e6c4a0',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  text: '#374151',
  grid: '#f3f4f6',
};

const CHART_PALETTE = ['#d4a574', '#8b5a3c', '#a08060', '#e6c4a0', '#5c4033'];

const chartConfig: ChartConfig = {
  value: { label: 'القيمة', color: COLORS.primary },
  count: { label: 'العدد', color: COLORS.primary },
  revenue: { label: 'الإيرادات', color: COLORS.primary },
  orders: { label: 'الطلبات', color: COLORS.primary },
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select(`
          menu_item_id,
          quantity,
          menu_item:menu_items(
            name_ar,
            category_id,
            category:categories(name_ar)
          )
        `);

      setOrders(ordersData || []);
      setOrderItems(orderItemsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Data Processing (Memoized for Performance) ---
  
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    
    return { totalRevenue, totalOrders, completedOrders, completionRate };
  }, [orders]);

  const dailyData = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    const ordersMap: Record<string, number> = {};

    orders.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString('ar-IQ', {
        month: 'short',
        day: 'numeric',
      });
      revenueMap[date] = (revenueMap[date] || 0) + Number(order.total_amount);
      ordersMap[date] = (ordersMap[date] || 0) + 1;
    });

    // Create a combined array for charts that need synced X-Axis
    const dates = Array.from(new Set([...Object.keys(revenueMap), ...Object.keys(ordersMap)]));
    return dates.map(date => ({
      date,
      revenue: revenueMap[date] || 0,
      orders: ordersMap[date] || 0
    }));
  }, [orders]);

  const topDishes = useMemo(() => {
    const dishCounts: Record<string, { name: string; count: number }> = {};
    orderItems.forEach((item) => {
      const menuItem = item.menu_item as any;
      const name = menuItem?.name_ar || 'غير معروف';
      // Truncate long names for chart readability
      const displayName = name.length > 20 ? name.substring(0, 18) + '...' : name;
      
      if (!dishCounts[item.menu_item_id]) {
        dishCounts[item.menu_item_id] = { name: displayName, count: 0 };
      }
      dishCounts[item.menu_item_id].count += item.quantity;
    });

    return Object.values(dishCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((dish, index) => ({ ...dish, fill: CHART_PALETTE[index % CHART_PALETTE.length] }));
  }, [orderItems]);

  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'انتظار', color: COLORS.warning },
      preparing: { label: 'تحضير', color: COLORS.info },
      ready: { label: 'جاهز', color: COLORS.success },
      completed: { label: 'مكتمل', color: '#059669' },
      cancelled: { label: 'ملغي', color: COLORS.danger },
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusConfig[status]?.label || status,
      value: count,
      fill: statusConfig[status]?.color || '#9ca3af',
    }));
  }, [orders]);

  const categoryData = useMemo(() => {
    const categoryCounts: Record<string, { name: string; count: number }> = {};
    orderItems.forEach((item) => {
      const menuItem = item.menu_item as any;
      const categoryName = menuItem?.category?.name_ar || 'أخرى';
      const categoryId = menuItem?.category_id || 'unknown';
      if (!categoryCounts[categoryId]) {
        categoryCounts[categoryId] = { name: categoryName, count: 0 };
      }
      categoryCounts[categoryId].count += item.quantity;
    });
    return Object.values(categoryCounts).map((cat, index) => ({
      ...cat,
      fill: CHART_PALETTE[index % CHART_PALETTE.length],
    }));
  }, [orderItems]);


  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="p-4 md:p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">لوحة التقارير</h1>
        <p className="text-gray-500">نظرة عامة على أداء المطعم والمبيعات</p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="إجمالي الإيرادات" 
          value={stats.totalRevenue.toLocaleString()} 
          suffix="د.ع"
          icon={<DollarSign className="w-6 h-6 text-[#d4a574]" />}
          bgIcon="bg-[#d4a574]/10"
        />
        <StatCard 
          title="إجمالي الطلبات" 
          value={stats.totalOrders} 
          suffix="طلب"
          icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
          bgIcon="bg-blue-100"
        />
        <StatCard 
          title="الطلبات المكتملة" 
          value={stats.completedOrders} 
          suffix="مكتمل"
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          bgIcon="bg-green-100"
        />
        <StatCard 
          title="نسبة النجاح" 
          value={stats.completionRate} 
          suffix="%"
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          bgIcon="bg-purple-100"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Chart */}
        <CardWrapper title="الإيرادات اليومية" subtitle="متابعة التدفق المالي خلال الفترة الماضية">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.text }} dy={10} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.text }} tickFormatter={(value) => `${value/1000}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke={COLORS.primary} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#revenueGrad)" 
              />
            </AreaChart>
          </ChartContainer>
        </CardWrapper>

        {/* Orders Trend Chart */}
        <CardWrapper title="حركة الطلبات" subtitle="عدد الطلبات اليومية">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.text }} dy={10} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.text }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent cursor={{fill: 'transparent'}} />} />
              <Bar 
                dataKey="orders" 
                fill={COLORS.primary} 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              />
            </BarChart>
          </ChartContainer>
        </CardWrapper>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Dishes (Horizontal Bar for better text readability) */}
        <div className="lg:col-span-2">
          <CardWrapper title="الأطباق الأكثر طلباً" subtitle="أفضل 5 أصناف مبيعاً">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart 
                data={topDishes} 
                layout="vertical" 
                margin={{ top: 0, right: 0, left: 20, bottom: 0 }} // Added left margin for labels
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={COLORS.grid} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={130} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 13, fill: '#1f2937', fontWeight: 500 }} 
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                  {topDishes.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardWrapper>
        </div>

        {/* Categories (Donut Chart) */}
        <CardWrapper title="المبيعات حسب القسم" subtitle="توزيع المبيعات">
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} strokeWidth={0} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                formatter={(value) => <span className="text-xs text-gray-600 mr-2">{value}</span>}
              />
            </PieChart>
          </ChartContainer>
        </CardWrapper>
      </div>

       {/* Status Distribution */}
       <CardWrapper title="توزيع حالات الطلبات" subtitle="نظرة عامة على سير العمل">
          <div className="flex flex-col md:flex-row items-center justify-around h-[250px]">
            <ChartContainer config={chartConfig} className="h-[200px] w-[200px] md:w-[250px] md:h-[250px]">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} strokeWidth={2} stroke="#fff" />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            
            {/* Custom Legend for Status */}
            <div className="flex flex-wrap justify-center gap-3 md:flex-col md:items-start mt-4 md:mt-0 max-w-full">
                {statusData.map((status, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: status.fill }}></span>
                        <span className="text-gray-700 font-medium">{status.name}:</span>
                        <span className="text-gray-500">{status.value}</span>
                    </div>
                ))}
            </div>
          </div>
        </CardWrapper>
    </div>
  );
}

// --- Sub Components for Cleaner Code ---

function StatCard({ title, value, suffix, icon, bgIcon }: any) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {suffix && <span className="text-xs text-gray-400 font-medium">{suffix}</span>}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${bgIcon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function CardWrapper({ title, subtitle, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1 min-h-0 w-full">
        {children}
      </div>
    </div>
  );
}