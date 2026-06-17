import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Package, LayoutDashboard, Box, Users2, ShoppingCart } from 'lucide-react';
import { cn } from './ui/Button';
import { Chatbot } from './ui/Chatbot';

export function Layout() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/customers', icon: Users2, label: 'Customers' },
    { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar - Dark Enterprise Theme */}
      <aside className="w-64 bg-brand-900 border-r border-brand-800 hidden md:flex flex-col text-slate-300">
        <div className="p-6 border-b border-brand-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-600 shadow-glow flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Ethara IMS</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-medium",
                isActive 
                  ? "bg-brand-800 text-white shadow-inner" 
                  : "text-slate-400 hover:bg-brand-800/50 hover:text-white"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    isActive ? "text-accent-500 scale-110" : "text-slate-500 group-hover:text-slate-300 group-hover:scale-110"
                  )} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f4f6f8]">
        {/* Mobile Header */}
        <header className="md:hidden bg-brand-900 border-b border-brand-800 p-4 flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center">
             <Package className="w-5 h-5 text-white" />
           </div>
           <span className="text-xl font-bold text-white tracking-tight">Ethara IMS</span>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Global Floating Chatbot Widget */}
      <Chatbot />
    </div>
  );
}
