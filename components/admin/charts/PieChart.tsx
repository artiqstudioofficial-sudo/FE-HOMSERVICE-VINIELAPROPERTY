// components/admin/charts/PieChart.tsx
import React from 'react';
import { BookingStatus } from '../../../lib/storage';

type Props = {
  data: { label: string; value: number }[];
  title: string;
};

const statusColorHex: { [key in BookingStatus]: string } = {
  Confirmed: '#3B82F6', // blue-500
  'On Site': '#06B6D4', // cyan-500
  'In Progress': '#EAB308', // yellow-500
  Completed: '#22C55E', // green-500
  Cancelled: '#9CA3AF', // gray-400
};

const PieChart: React.FC<Props> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  let accumulatedPercentage = 0;
  const gradients = data.map((item) => {
    const color = statusColorHex[item.label as BookingStatus] || '#CCCCCC';
    const percentage = (item.value / total) * 100;
    const start = accumulatedPercentage;
    accumulatedPercentage += percentage;
    const end = accumulatedPercentage;
    return `${color} ${start}% ${end}%`;
  });

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div
          className="w-40 h-40 rounded-full mx-auto"
          style={{ background: `conic-gradient(${gradients.join(', ')})` }}
        ></div>
        <div className="space-y-2">
          {data.map((item) => {
            const color = statusColorHex[item.label as BookingStatus] || '#9CA3AF';
            return (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                </div>
                <span className="font-bold text-gray-800 dark:text-white">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PieChart;
