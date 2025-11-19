// components/admin/charts/BarChart.tsx
import React from 'react';

type Props = {
  data: { label: string; value: number }[];
  title: string;
};

const BarChart: React.FC<Props> = ({ data, title }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const colors = ['#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4', '#CCFBF1'];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-gray-700 dark:text-gray-200 truncate pr-2">
                {item.label}
              </span>
              <span className="font-bold text-primary">{item.value}</span>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-full">
              <div
                className="h-4 rounded-full"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: colors[index % colors.length],
                }}
                title={`${item.label}: ${item.value}`}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
