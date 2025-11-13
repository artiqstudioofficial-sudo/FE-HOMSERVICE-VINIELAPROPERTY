import React, { useEffect } from 'react';

type BookingDetails = {
    name?: string;
    service?: string;
    schedule?: string;
};

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    bookingDetails: BookingDetails;
};

const ConfirmationModal: React.FC<ModalProps> = ({ isOpen, onClose, bookingDetails }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
            aria-modal="true" 
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all scale-95 duration-300" 
                data-aos="zoom-in" 
                data-aos-duration="400"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">Pesanan Diterima!</h3>
                <p className="text-secondary dark:text-slate-300 mt-2 mb-6">Terima kasih, <span className="font-semibold text-gray-800 dark:text-white">{bookingDetails.name}</span>. Pesanan Anda telah berhasil kami catat.</p>
                
                <div className="bg-light-bg dark:bg-slate-700 p-4 rounded-lg text-left space-y-2 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white">
                     <p><strong>Layanan:</strong> {bookingDetails.service}</p>
                     <p><strong>Jadwal:</strong> {bookingDetails.schedule}</p>
                     <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">Kami akan segera menghubungi Anda melalui WhatsApp untuk konfirmasi lebih lanjut.</p>
                </div>

                <button onClick={onClose} className="mt-8 w-full bg-primary text-white font-bold px-8 py-3 rounded-lg hover:bg-primary-dark transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50">
                    Tutup
                </button>
            </div>
        </div>
    );
};

export default ConfirmationModal;