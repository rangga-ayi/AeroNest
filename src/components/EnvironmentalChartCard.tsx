import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TelemetryRecord } from '../types/telemetry';
import { LineChart, Maximize2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export const EnvironmentalChartCard: React.FC<{ history: TelemetryRecord[]; onExpand: () => void }> = ({
  history,
  onExpand,
}) => {
  const chartData = useMemo(() => {
    return {
      labels: history.map(item => {
        const d = new Date(item.timestamp);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }),
      datasets: [
        {
          label: 'Suhu (°C)',
          data: history.map(item => item.suhu),
          borderColor: '#fb7185',
          backgroundColor: 'rgba(251, 113, 133, 0.1)',
          fill: true,
          tension: 0.35,
          yAxisID: 'ySuhu',
        },
        {
          label: 'Kelembapan (%)',
          data: history.map(item => item.kelembapan),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.05)',
          fill: true,
          tension: 0.35,
          yAxisID: 'yHum',
        }
      ]
    };
  }, [history]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#8c99a8', font: { family: 'JetBrains Mono', size: 10 } } },
    },
    scales: {
      x: { ticks: { color: '#8c99a8', font: { family: 'JetBrains Mono', size: 9 } }, grid: { display: false } },
      ySuhu: { type: 'linear' as const, position: 'left' as const, ticks: { color: '#fb7185', font: { family: 'JetBrains Mono', size: 9 } } },
      yHum: { type: 'linear' as const, position: 'right' as const, ticks: { color: '#38bdf8', font: { family: 'JetBrains Mono', size: 9 } }, grid: { display: false } },
    }
  };

  return (
    <div className="m3-card p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <LineChart size={16} className="text-m3-primary" />
            <h3 className="font-bold text-m3-on-surface text-sm font-ui">Tren 24 Jam</h3>
          </div>
          <button
            onClick={onExpand}
            className="touch-target p-1.5 rounded-m3-md hover:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-white"
            aria-label="Perbesar Grafik"
          >
            <Maximize2 size={15} />
          </button>
        </div>

        <div className="h-[200px] sm:h-[220px] w-full mt-3">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};
