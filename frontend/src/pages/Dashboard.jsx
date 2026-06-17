import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Users, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { apiClient } from '../api/client';
import { DataTable } from '../components/ui/DataTable';

function SummaryCard({ title, value, icon: Icon, colorClass, isLoading }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 flex items-start gap-4 transition-transform hover:-translate-y-1 hover:shadow-lg duration-300">
      <div className={`p-4 rounded-2xl ${colorClass}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">{title}</h3>
        {isLoading ? (
          <div className="h-8 w-20 bg-slate-100 rounded animate-pulse"></div>
        ) : (
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/stats');
      return response.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get('/products');
      return response.data;
    },
  });

  // Prepare data for the chart: Top 5 products by quantity
  const chartData = products 
    ? [...products].sort((a, b) => b.quantity - a.quantity).slice(0, 6)
    : [];

  const lowStockColumns = [
    { header: 'Product Name', accessor: 'name', className: 'font-semibold text-slate-800' },
    { header: 'SKU', accessor: 'sku', className: 'text-slate-500 font-mono text-xs' },
    { 
      header: 'Quantity', 
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200 shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5" />
          {row.quantity} left in stock
        </span>
      ) 
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="bg-brand-900 -mx-6 md:-mx-8 -mt-6 md:-mt-8 px-6 md:px-8 py-10 pb-24 shadow-inner text-white">
        <h1 className="text-3xl font-bold tracking-tight">Overview Dashboard</h1>
        <p className="text-slate-400 mt-2 text-lg">Your inventory and business health at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-16 relative z-10 px-2">
        <SummaryCard 
          title="Total Products" 
          value={stats?.total_products || 0} 
          icon={Package} 
          colorClass="bg-blue-50 text-blue-600 border border-blue-100"
          isLoading={isLoading}
        />
        <SummaryCard 
          title="Total Customers" 
          value={stats?.total_customers || 0} 
          icon={Users} 
          colorClass="bg-purple-50 text-purple-600 border border-purple-100"
          isLoading={isLoading}
        />
        <SummaryCard 
          title="Total Orders" 
          value={stats?.total_orders || 0} 
          icon={ShoppingCart} 
          colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-soft border border-slate-200 p-6 flex flex-col h-96">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2 bg-accent-50 text-accent-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Top Inventory Levels</h2>
          </div>
          <div className="flex-1 w-full h-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="quantity" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Loading chart data...</div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="flex flex-col h-96">
          <div className="flex items-center gap-2 mb-4 pl-2">
            <h2 className="text-lg font-bold text-slate-800">Low Stock Alerts</h2>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">Requires Attention</span>
          </div>
          <div className="flex-1 overflow-hidden">
             <DataTable 
               columns={lowStockColumns} 
               data={stats?.low_stock_products} 
               isLoading={isLoading} 
               emptyTitle="Inventory is Healthy"
               emptyDescription="None of your products are currently running low on stock."
             />
          </div>
        </div>
      </div>
    </div>
  );
}
