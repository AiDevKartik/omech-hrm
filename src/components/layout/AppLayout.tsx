/**
 * App Layout Component
 * Shell container hosting Sidebar, Topbar, and active route views
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Database, Server } from 'lucide-react';
import { STRINGS } from '../../constants/strings';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans">
      <div className="flex flex-1 min-h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          {/* Architecture Readiness Notice */}
          <div className="bg-stone-950/80 border-b border-stone-800/80 px-4 py-1.5 flex items-center justify-between text-[11px] text-stone-400">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono text-stone-300">{STRINGS.NOTICE_PROTOTYPE_API}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-stone-500">
              <Database className="w-3 h-3 text-emerald-500" />
              <span>localStore.ts active • All reads/mutations via React Query</span>
            </div>
          </div>

          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
