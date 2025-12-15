import BarChart from '@/components/admin/charts/BarChart';
import PieChart from '@/components/admin/charts/PieChart';
import React from 'react';

type TechnicianPerformance = {
  name: string;
  completed: number;
  totalMinutes: number;
};

type PopularService = { label: string; value: number };
type StatusDistributionItem = { label: string; value: number | string };

type KpiData = {
  technicianPerformance: TechnicianPerformance[];
  popularServices: PopularService[];
  statusDistribution: StatusDistributionItem[];
};

type Props = {
  kpiData: KpiData;
};

const formatDuration = (minutes: number): string => {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} jam`;
  return `${hours} jam ${remainingMinutes} mnt`;
};

const KpiSection: React.FC<Props> = ({ kpiData }) => {
  const popularCount = kpiData?.popularServices?.length ?? 0;

  // optional: total selesai dari data bar (top N)
  const popularTotalCompleted = (kpiData?.popularServices ?? []).reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0,
  );

  const popularTitle =
    popularCount > 0
      ? `${popularCount} Layanan Terlaris (Selesai) • Total ${popularTotalCompleted} selesai`
      : 'Layanan Terlaris (Selesai)';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart data={kpiData.popularServices} title={popularTitle} />
        <PieChart data={kpiData.statusDistribution} title="Distribusi Status Pesanan" />
      </div>

      <div>
        <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white mb-4">
          Performa Teknisi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiData.technicianPerformance.length > 0 ? (
            kpiData.technicianPerformance.map((tech) => (
              <div key={tech.name} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="font-bold text-xl text-gray-800 dark:text-white">{tech.name}</h3>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pekerjaan Selesai</p>
                    <p className="text-2xl font-bold text-primary">{tech.completed}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Waktu Kerja</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatDuration(tech.totalMinutes)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">
              Belum ada data KPI yang bisa ditampilkan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KpiSection;
