import React from 'react';
import { Home, Sparkles, LineChart, FileText } from 'lucide-react';

interface M3BottomNavBarProps {
  activeTab: 'twin' | 'index' | 'chart' | 'ai';
  onChangeTab: (tab: 'twin' | 'index' | 'chart' | 'ai') => void;
}

export const M3BottomNavBar: React.FC<M3BottomNavBarProps> = ({ activeTab, onChangeTab }) => {
  const items = [
    { id: 'twin' as const, label: '3D Twin', icon: Home },
    { id: 'index' as const, label: 'Kenyamanan', icon: LineChart },
    { id: 'chart' as const, label: 'Riwayat', icon: FileText },
    { id: 'ai' as const, label: 'AI Insight', icon: Sparkles },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-m3-surface-container-low border-t border-white/5 pb-[env(safe-area-inset-bottom,12px)] h-20 flex items-center justify-around px-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            className="flex flex-col items-center justify-center flex-1 py-1 touch-target focus:outline-none"
          >
            {/* M3 Active Indicator Pill */}
            <div
              className={`w-14 h-8 rounded-m3-full flex items-center justify-center transition-all ${
                isActive ? 'bg-m3-primary-container text-m3-primary' : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <Icon size={20} />
            </div>
            <span
              className={`text-[11px] font-medium font-ui tracking-wide mt-1 ${
                isActive ? 'text-m3-primary font-semibold' : 'text-m3-on-surface-variant'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
