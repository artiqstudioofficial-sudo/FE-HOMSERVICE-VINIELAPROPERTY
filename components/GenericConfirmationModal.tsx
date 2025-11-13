import React, { useEffect } from 'react';

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
    confirmText?: string;
    confirmButtonClass?: string;
};

const GenericConfirmationModal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    children, 
    confirmText = 'Konfirmasi', 
    confirmButtonClass = 'bg-primary hover:bg-primary-dark focus:ring-primary' 
}) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
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
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/50 mb-4">
                    <svg className="h-10 w-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                
                <h3 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">{title}</h3>
                
                <div className="text-secondary dark:text-slate-300 mt-2 mb-6">
                    {children}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button onClick={onClose} className="w-full bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50">
                        Batal
                    </button>
                    <button onClick={onConfirm} className={`w-full text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${confirmButtonClass}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenericConfirmationModal;