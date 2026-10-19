import { useState } from 'react';
import { useTelemetry } from './hooks/useTelemetry';
import { HeaderNav } from './components/HeaderNav';
import { M3BottomNavBar } from './components/M3BottomNavBar';
import { LabCanvas3D } from './components/LabCanvas3D';
import { EnvironmentalIndexPanel } from './components/EnvironmentalIndexPanel';
import { HardwareDiagnosticsCard } from './components/HardwareDiagnosticsCard';
import { EnvironmentalChartCard } from './components/EnvironmentalChartCard';
import { SystemFlowCard } from './components/SystemFlowCard';
import { AIInsightSheet } from './components/AIInsightSheet';
import { HistoryLogSheet } from './components/HistoryLogSheet';
import { exportToCSV } from './utils/csvExport';

export function App() {
  const { latest, history, laporanAI, indices } = useTelemetry(60);
  const [activeTab, setActiveTab] = useState<'twin' | 'index' | 'chart' | 'ai'>('twin');
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);

  const handleOpenAI = () => setAiSheetOpen(true);
  const handleOpenHistory = () => setHistorySheetOpen(true);

  return (
    <div className="min-h-screen pb-24 md:pb-8 p-3 sm:p-5 lg:p-8 max-w-[1600px] mx-auto">
      {/* Top App Bar */}
      <HeaderNav
        latest={latest}
        indices={indices}
        onOpenAI={handleOpenAI}
        onOpenHistory={handleOpenHistory}
        onExportCSV={() => exportToCSV(history)}
      />

      {/* Main Grid: Mobile Tab Switcher or Desktop Full Bento Grid */}
      <main className="space-y-4 sm:space-y-6">
        {/* Row 1: 3D Stage (2 cols) & Environmental Index (1 col) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className={`md:col-span-2 ${activeTab === 'twin' ? 'block' : 'hidden md:block'}`}>
            <LabCanvas3D
              latest={latest}
              indices={indices}
            />
          </div>
          <div className={`md:col-span-1 ${activeTab === 'index' ? 'block' : 'hidden md:block'}`}>
            <EnvironmentalIndexPanel latest={latest} indices={indices} />
          </div>
        </div>

        {/* Row 2: 3 Responsive Bottom Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className={activeTab === 'twin' ? 'block' : 'hidden md:block'}>
            <HardwareDiagnosticsCard latest={latest} indices={indices} />
          </div>
          <div className={activeTab === 'chart' ? 'block' : 'hidden md:block'}>
            <EnvironmentalChartCard history={history} onExpand={handleOpenHistory} />
          </div>
          <div className="hidden md:block">
            <SystemFlowCard indices={indices} />
          </div>
        </div>
      </main>

      {/* Mobile M3 Bottom Navigation Bar */}
      <M3BottomNavBar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          if (tab === 'ai') handleOpenAI();
          else if (tab === 'chart') handleOpenHistory();
          else setActiveTab(tab);
        }}
      />

      {/* M3 Modal Bottom Sheets */}
      <AIInsightSheet
        isOpen={aiSheetOpen}
        onClose={() => setAiSheetOpen(false)}
        laporan={laporanAI}
      />
      <HistoryLogSheet
        isOpen={historySheetOpen}
        onClose={() => setHistorySheetOpen(false)}
        history={history}
      />
    </div>
  );
}

export default App;
