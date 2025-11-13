import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Service, serviceIcons } from '../config/services';
import { X, CheckCircle, XCircle, ShieldCheck, Clock } from 'lucide-react';

interface ServiceDetailModalProps {
    service: Service | null;
    onClose: () => void;
}

const formatDuration = (minutes: number): string => {
    if (!minutes || minutes <= 0) return 'N/A';
    if (minutes < 60) return `${minutes} mnt`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} jam`;
    return `${hours}j ${remainingMinutes}m`;
};

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ service, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!service) return null;

    const modalContent = (
        <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="text-primary">{serviceIcons[service.icon] || serviceIcons['Wrench']}</div>
                    <h2 id="service-modal-title" className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">
                        {service.name}
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                    aria-label="Tutup modal"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <p className="text-secondary dark:text-slate-300">{service.description}</p>
                
                <div className="bg-light-bg dark:bg-slate-900/50 p-4 rounded-lg grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Harga Mulai</p>
                        <p className="font-bold text-lg text-primary">{formatPrice(service.price)}<span className="text-xs font-normal text-secondary dark:text-slate-300">/{service.priceUnit}</span></p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Estimasi Durasi</p>
                        <p className="font-bold text-lg text-secondary dark:text-slate-200 flex items-center justify-center gap-1.5"><Clock size={16} /> {formatDuration(service.duration)}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Garansi</p>
                        <p className={`font-bold text-lg flex items-center justify-center gap-1.5 ${service.guarantee ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                           {service.guarantee ? <><ShieldCheck size={16} /> 30 Hari</> : 'Tidak Tersedia'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-3">Termasuk Dalam Layanan</h4>
                        <ul className="space-y-2">
                            {service.includes.map((item, index) => (
                                <li key={index} className="flex items-start gap-2 text-secondary dark:text-slate-300">
                                    <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-3">Tidak Termasuk</h4>
                        <ul className="space-y-2">
                            {service.excludes.map((item, index) => (
                                <li key={index} className="flex items-start gap-2 text-secondary dark:text-slate-300">
                                    <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-light-bg dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 rounded-b-2xl">
                <Link
                    to={`/contact?service=${encodeURIComponent(service.name)}`}
                    className="w-full block text-center bg-primary text-white font-bold px-8 py-3 rounded-lg hover:bg-primary-dark transition-all duration-300 shadow-lg"
                >
                    Pesan Layanan Ini
                </Link>
            </div>
        </div>
    );

    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${service ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            {modalContent}
        </div>
    );
};

export default ServiceDetailModal;
