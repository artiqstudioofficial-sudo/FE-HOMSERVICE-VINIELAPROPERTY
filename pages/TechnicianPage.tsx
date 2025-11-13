import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBookings, saveBookings, Booking, BookingStatus, savePhoto, getPhoto } from '../lib/storage';
import { useNotification } from '../contexts/NotificationContext';
import { simulateNotification } from '../lib/notifications';
import { compressImage } from '../lib/image';
import GenericConfirmationModal from '../components/GenericConfirmationModal';
import { MapPin, Navigation, LayoutDashboard, CalendarCheck, Map as MapIcon, LogOut, CheckCircle, Clock } from 'lucide-react';

const PhotoUpload: React.FC<{
    label: string;
    photoKey: string | undefined;
    onUpload: (base64: string) => void;
    disabled?: boolean;
}> = ({ label, photoKey, onUpload, disabled = false }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [photoData, setPhotoData] = useState<string | null>(null);

    useEffect(() => {
        if (photoKey) {
            setPhotoData(getPhoto(photoKey));
        } else {
            setPhotoData(null);
        }
    }, [photoKey]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64String = reader.result as string;
                    const compressedBase64 = await compressImage(base64String);
                    onUpload(compressedBase64);
                    setPhotoData(compressedBase64); // Immediately update preview
                } catch (error) {
                    console.error("Image processing failed:", error);
                    alert("Gagal memproses gambar. Pastikan file adalah format gambar yang valid.");
                } finally {
                    setIsUploading(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <div className="mt-1 flex items-center space-x-4">
                <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                    {isUploading ? (
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : photoData ? (
                        <img src={photoData} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                    )}
                </div>
                <label htmlFor={`file-upload-${label.replace(/\s+/g, '-')}`} className={`relative cursor-pointer bg-white dark:bg-slate-600 py-2 px-3 border border-gray-300 dark:border-slate-500 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <span>{photoData ? 'Ganti Foto' : 'Unggah Foto'}</span>
                    <input id={`file-upload-${label.replace(/\s+/g, '-')}`} name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={disabled} />
                </label>
            </div>
        </div>
    );
};


const JobCard: React.FC<{ booking: Booking; onBookingUpdate: (updatedBooking: Booking) => void }> = ({ booking, onBookingUpdate }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(booking.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(booking.endDate);
    endDate.setHours(0, 0, 0, 0);

    const isMultiDay = startDate.getTime() !== endDate.getTime();
    const isJobActiveToday = today >= startDate && today <= endDate;
    const isStartDate = today.getTime() === startDate.getTime();
    const isEndDate = today.getTime() === endDate.getTime();
    
    const [isCompleting, setIsCompleting] = useState(false);
    const [additionalWorkNotes, setAdditionalWorkNotes] = useState(booking.additionalWorkNotes || '');
    const [additionalCosts, setAdditionalCosts] = useState(booking.additionalCosts || 0);
    const [displayCosts, setDisplayCosts] = useState(() => 
        (booking.additionalCosts || 0).toString() === '0' ? '0' : new Intl.NumberFormat('id-ID').format(booking.additionalCosts || 0)
    );
    const [isConfirmingComplete, setIsConfirmingComplete] = useState(false);
    const { addNotification } = useNotification();

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setAdditionalCosts(0);
            setDisplayCosts('');
            return;
        }
        const numericValue = parseInt(value.replace(/\./g, ''), 10);

        if (!isNaN(numericValue)) {
            setAdditionalCosts(numericValue);
            setDisplayCosts(new Intl.NumberFormat('id-ID').format(numericValue));
        }
    };
    
    const handleCostBlur = () => {
        if (displayCosts === '') {
            setDisplayCosts('0');
        }
    };

    const handleStatusUpdate = (status: BookingStatus) => {
        let updatedBooking = { ...booking, status };
        const now = new Date().toISOString();

        if (status === 'On Site') {
            updatedBooking.arrivalTime = now;
            const uiMessage = simulateNotification('technician_on_the_way', updatedBooking);
            addNotification(uiMessage, 'info');
        }
        if (status === 'In Progress') updatedBooking.startTime = now;
        
        onBookingUpdate(updatedBooking);
    };

    const handlePhotoUpload = (type: 'arrival' | 'before' | 'after', base64: string) => {
        const photoKey = `${booking.id}-${type}`;
        savePhoto(photoKey, base64);
        
        const updatedBooking = {
            ...booking,
            photos: {
                ...booking.photos,
                [type]: photoKey
            }
        };
        onBookingUpdate(updatedBooking);
    };
    
    const handleCompleteJob = () => {
        if (!booking.photos?.after) {
            alert("Harap unggah foto setelah pengerjaan selesai.");
            return;
        }
        setIsConfirmingComplete(true);
    };

    const executeCompleteJob = () => {
        const now = new Date();
        const startTime = new Date(booking.startTime!);
        const duration = Math.round((now.getTime() - startTime.getTime()) / 60000);

        const updatedBooking: Booking = {
            ...booking,
            status: 'Completed',
            endTime: now.toISOString(),
            workDurationMinutes: duration > 0 ? duration : 0,
            additionalWorkNotes,
            additionalCosts
        };
        const uiMessage = simulateNotification('job_completed', updatedBooking);
        addNotification(uiMessage, 'success');
        onBookingUpdate(updatedBooking);
        setIsCompleting(false);
        setIsConfirmingComplete(false);
    }

    const renderAction = () => {
        if (!isJobActiveToday && booking.status !== 'Completed' && booking.status !== 'Cancelled') {
             return (
                <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
                    <p className="font-semibold text-gray-500 dark:text-gray-400">Tugas belum dimulai.</p>
                </div>
            );
        }

        switch (booking.status) {
            case 'Confirmed':
                if (!isStartDate) return <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center"><p className="font-semibold text-gray-500 dark:text-gray-400">Tugas dimulai pada {startDate.toLocaleDateString('id-ID')}</p></div>;
                return (
                    <div className="mt-4 pt-4 border-t dark:border-slate-700">
                        <button onClick={() => handleStatusUpdate('On Site')} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                            Saya Sudah di Lokasi
                        </button>
                    </div>
                );
            case 'On Site':
                if (!isStartDate) return <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center"><p className="font-semibold text-gray-500 dark:text-gray-400">Menunggu hari pertama dimulai.</p></div>;
                return (
                     <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-4">
                        <p className="text-sm text-center font-semibold text-blue-600 dark:text-blue-400">Tiba pada: {new Date(booking.arrivalTime!).toLocaleTimeString('id-ID')}</p>
                        <PhotoUpload label="Foto Tiba di Lokasi" photoKey={booking.photos?.arrival} onUpload={(b64) => handlePhotoUpload('arrival', b64)} />
                        {booking.photos?.arrival && (
                            <PhotoUpload label="Foto Sebelum Pengerjaan" photoKey={booking.photos?.before} onUpload={(b64) => handlePhotoUpload('before', b64)} />
                        )}
                        <button onClick={() => handleStatusUpdate('In Progress')} disabled={!booking.photos?.arrival || !booking.photos?.before} className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-400">
                            Mulai Pekerjaan
                        </button>
                    </div>
                );
            case 'In Progress':
                const actionContent = isEndDate ? (
                    <button onClick={() => setIsCompleting(true)} className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                        Selesaikan Pekerjaan
                    </button>
                ) : (
                     <p className="font-semibold text-yellow-600 dark:text-yellow-400 text-center">Pekerjaan Sedang Berlangsung</p>
                );
                return (
                    <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-4">
                        <p className="text-sm text-center font-semibold text-yellow-600 dark:text-yellow-400">Mulai pada: {new Date(booking.startTime!).toLocaleTimeString('id-ID')}</p>
                        {actionContent}
                    </div>
                );
            case 'Completed':
                 return (
                    <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
                        <p className="font-semibold text-green-600 dark:text-green-400">Pekerjaan Selesai</p>
                    </div>
                );
            case 'Cancelled':
                 return (
                    <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
                        <p className="font-semibold text-red-600 dark:text-red-400">Dibatalkan</p>
                    </div>
                );
            default: return null;
        }
    }

    const formatSchedule = () => {
        const start = startDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!isMultiDay) {
            return `${start} - ${booking.time}`;
        }
        const end = endDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
        return `${start} s/d ${end}`;
    };

    return (
        <div className={`bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden border-l-4 ${isJobActiveToday ? 'border-primary' : 'border-transparent'}`} data-aos="fade-up">
            <div className="p-5">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{booking.service}</p>
                        <p className="font-bold text-lg text-gray-800 dark:text-white">{booking.name}</p>
                    </div>
                    {isJobActiveToday && <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded-full">AKTIF HARI INI</span>}
                </div>
                
                <div className="mt-4 space-y-2 text-sm text-secondary dark:text-slate-300">
                    <p><strong>Jadwal:</strong> {formatSchedule()}</p>
                    <div>
                        <p><strong>Alamat:</strong> {booking.address}</p>
                        <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${booking.lat},${booking.lng}`} 
                            target="_blank" rel="noopener noreferrer" 
                            className="mt-2 inline-flex items-center gap-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                            <Navigation size={14} />
                            Dapatkan Arah
                        </a>
                    </div>
                    <p><strong>Telepon:</strong> {booking.whatsapp}</p>

                    {(booking.arrivalTime || booking.startTime || booking.endTime) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700/50">
                            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Log Waktu Pengerjaan</h4>
                            {booking.arrivalTime && <p><strong>Tiba di Lokasi:</strong> {new Date(booking.arrivalTime).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                            {booking.startTime && <p><strong>Mulai Kerja:</strong> {new Date(booking.startTime).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                            {booking.endTime && <p><strong>Selesai Kerja:</strong> {new Date(booking.endTime).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                            {booking.workDurationMinutes != null && <p><strong>Total Durasi Kerja:</strong> {booking.workDurationMinutes} menit</p>}
                        </div>
                    )}
                </div>

                {isCompleting ? (
                    <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-4">
                        <h4 className="font-bold text-center">Formulir Penyelesaian</h4>
                        <PhotoUpload label="Foto Setelah Selesai" photoKey={booking.photos?.after} onUpload={(b64) => handlePhotoUpload('after', b64)} />
                        <div>
                            <label htmlFor={`notes-${booking.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan Pekerjaan Tambahan</label>
                            <textarea id={`notes-${booking.id}`} rows={3} value={additionalWorkNotes} onChange={(e) => setAdditionalWorkNotes(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary sm:text-sm" placeholder="Please fill out this field."></textarea>
                        </div>
                        <div>
                            <label htmlFor={`costs-${booking.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Biaya Tambahan (Bahan, dll.)</label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-gray-500 sm:text-sm">Rp</span></div>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    id={`costs-${booking.id}`} 
                                    value={displayCosts} 
                                    onChange={handleCostChange}
                                    onBlur={handleCostBlur} 
                                    className="block w-full rounded-md border-gray-300 pl-8 pr-2 dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary sm:text-sm" placeholder="0" />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <button onClick={() => setIsCompleting(false)} className="w-full bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">Batal</button>
                             <button onClick={handleCompleteJob} disabled={!booking.photos?.after} className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-400">Konfirmasi Selesai</button>
                        </div>
                    </div>
                ) : (
                    renderAction()
                )}
            </div>
            <GenericConfirmationModal
                isOpen={isConfirmingComplete}
                onClose={() => setIsConfirmingComplete(false)}
                onConfirm={executeCompleteJob}
                title="Konfirmasi Penyelesaian"
                confirmText="Ya, Selesaikan"
                confirmButtonClass="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
                <p>Apakah Anda yakin ingin menyelesaikan pekerjaan ini? Pastikan semua data dan foto sudah benar.</p>
            </GenericConfirmationModal>
        </div>
    );
}

type TechnicianSection = 'dashboard' | 'jobs' | 'map';

const TechnicianPage: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [activeSection, setActiveSection] = useState<TechnicianSection>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; title: string } | null>(null);
    const [jobFilter, setJobFilter] = useState<'upcoming' | 'completed'>('upcoming');

    useEffect(() => {
        const handleFocus = () => setAllBookings(getBookings());
        window.addEventListener('focus', handleFocus);
        handleFocus(); // Initial load
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const technicianJobs = useMemo(() => {
        if (!currentUser) return [];
        return allBookings
            .filter(job => job.technician === currentUser.name)
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [currentUser, allBookings]);


    const { completedJobs, upcomingJobsCategorized, upcomingJobsFlat } = useMemo(() => {
        const upcoming = technicianJobs.filter(job => job.status !== 'Completed' && job.status !== 'Cancelled');
        const completed = technicianJobs.filter(job => job.status === 'Completed' || job.status === 'Cancelled');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const categorized = {
            today: [] as Booking[],
            tomorrow: [] as Booking[],
            upcoming: [] as Booking[],
        };

        upcoming.forEach(job => {
            const jobStartDate = new Date(job.startDate);
            jobStartDate.setHours(0,0,0,0);
            const jobEndDate = new Date(job.endDate);
            jobEndDate.setHours(0,0,0,0);

            if (jobStartDate.getTime() === today.getTime() || (today > jobStartDate && today <= jobEndDate)) {
                categorized.today.push(job);
            } else if (jobStartDate.getTime() === tomorrow.getTime()) {
                categorized.tomorrow.push(job);
            } else if (jobStartDate.getTime() > tomorrow.getTime()) {
                categorized.upcoming.push(job);
            }
        });
        
        return { completedJobs: completed, upcomingJobsCategorized: categorized, upcomingJobsFlat: upcoming };
    }, [technicianJobs]);

     useEffect(() => {
        if (activeSection === 'map' && upcomingJobsFlat.length > 0 && !selectedLocation) {
            setSelectedLocation({
                lat: upcomingJobsFlat[0].lat,
                lng: upcomingJobsFlat[0].lng,
                title: upcomingJobsFlat[0].name
            });
        }
    }, [activeSection, upcomingJobsFlat, selectedLocation]);

    const handleBookingUpdate = (updatedBooking: Booking) => {
        const allCurrentBookings = getBookings();
        const updatedBookings = allCurrentBookings.map(b => 
            b.id === updatedBooking.id ? updatedBooking : b
        );
        saveBookings(updatedBookings);
        setAllBookings(updatedBookings); // Refresh local state
    };
    
    const dashboardStats = useMemo(() => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0,0,0,0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);
        
        const jobsThisWeek = upcomingJobsFlat.filter(job => {
            const jobDate = new Date(job.startDate);
            return jobDate >= startOfWeek && jobDate <= endOfWeek;
        });

        return {
            today: upcomingJobsCategorized.today.length,
            thisWeek: jobsThisWeek.length,
            completed: completedJobs.length
        };
    }, [upcomingJobsCategorized.today, upcomingJobsFlat, completedJobs]);

    if (!currentUser) {
        return <div className="text-center py-20">Loading...</div>;
    }
    
    const sectionTitles: Record<TechnicianSection, string> = {
        dashboard: 'Dashboard',
        jobs: 'Tugas Saya',
        map: 'Peta Tugas',
    };

    const renderSection = () => {
        switch(activeSection) {
            case 'dashboard': return (
                <div key="dashboard" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center gap-4">
                            <div className="bg-primary-light p-3 rounded-full"><CalendarCheck className="h-6 w-6 text-primary"/></div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Tugas Hari Ini</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{dashboardStats.today}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center gap-4">
                           <div className="bg-primary-light p-3 rounded-full"><Clock className="h-6 w-6 text-primary"/></div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Tugas Minggu Ini</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{dashboardStats.thisWeek}</p>
                            </div>
                        </div>
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center gap-4">
                            <div className="bg-primary-light p-3 rounded-full"><CheckCircle className="h-6 w-6 text-primary"/></div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tugas Selesai</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{dashboardStats.completed}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white mb-4">Jadwal Hari Ini</h2>
                        {upcomingJobsCategorized.today.length > 0 ? (
                             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg divide-y dark:divide-slate-700">
                                {upcomingJobsCategorized.today.map(job => (
                                    <div key={job.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">{job.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{job.service}</p>
                                        </div>
                                        <div className="text-right">
                                             <p className="font-bold text-primary">{job.time}</p>
                                             <p className="text-xs text-gray-400">{job.status}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        ) : (
                             <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                                <p className="text-gray-500 dark:text-gray-400">Tidak ada jadwal untuk hari ini.</p>
                             </div>
                        )}
                    </div>
                </div>
            );
            case 'jobs': 
                const categories: { [key: string]: Booking[] } = {
                    "Hari Ini": upcomingJobsCategorized.today,
                    "Besok": upcomingJobsCategorized.tomorrow,
                    "Akan Datang": upcomingJobsCategorized.upcoming,
                };
                const isUpcomingEmpty = Object.values(categories).every(jobs => jobs.length === 0);
            return (
                <div key="jobs">
                     <div className="mb-6">
                        <div className="inline-flex rounded-md shadow-sm bg-white dark:bg-slate-800 p-1">
                            <button onClick={() => setJobFilter('upcoming')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${jobFilter === 'upcoming' ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                Akan Datang
                            </button>
                            <button onClick={() => setJobFilter('completed')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${jobFilter === 'completed' ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                Riwayat
                            </button>
                        </div>
                    </div>
                    {jobFilter === 'upcoming' && (
                        isUpcomingEmpty ? (
                             <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-md" data-aos="zoom-in">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tidak Ada Tugas Akan Datang</h3>
                            </div>
                        ) : (
                             <div className="space-y-10">
                                {Object.entries(categories).map(([title, jobs]) => (
                                    jobs.length > 0 && (
                                        <div key={title} data-aos="fade-up">
                                            <h3 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-4">{title}</h3>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {jobs.map(job => <JobCard key={job.id} booking={job} onBookingUpdate={handleBookingUpdate} />)}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )
                    )}
                     {jobFilter === 'completed' && (
                         completedJobs.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{completedJobs.map(job => <JobCard key={job.id} booking={job} onBookingUpdate={handleBookingUpdate} />)}</div>
                         ) : (
                             <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-md" data-aos="zoom-in">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Belum Ada Riwayat Tugas</h3>
                            </div>
                         )
                     )}
                </div>
            );
            case 'map': return (
                <div key="map" className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]" data-aos="fade-up">
                    <div className="lg:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-4 space-y-3 h-full overflow-y-auto">
                        {upcomingJobsFlat.length > 0 ? upcomingJobsFlat.map(job => (
                            <div key={job.id} className={`w-full p-4 rounded-lg transition-all duration-200 border-l-4 ${selectedLocation?.title === job.name ? 'bg-primary-light dark:bg-slate-700 border-primary' : 'bg-transparent'}`}>
                                <button onClick={() => setSelectedLocation({ lat: job.lat, lng: job.lng, title: job.name })} className="w-full text-left">
                                    <p className="font-bold text-gray-800 dark:text-white">{job.name}</p>
                                    <div className="text-sm font-semibold text-primary mt-1">
                                        {new Date(job.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} - {job.time}
                                    </div>
                                </button>
                            </div>
                        )) : (
                           <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                               <p>Tidak ada pekerjaan akan datang.</p>
                           </div>
                        )}
                    </div>
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden h-full flex flex-col">
                        {selectedLocation ? (
                            <iframe
                                key={`${selectedLocation.lat}-${selectedLocation.lng}`}
                                title="Job Location Map"
                                className="w-full h-full border-0"
                                src={`https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                allowFullScreen={false}
                                loading="lazy"
                            ></iframe>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-6">
                                <MapPin size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
                                <h3 className="font-bold text-xl">Peta Lokasi Tugas</h3>
                                <p>Tidak ada tugas akan datang untuk ditampilkan.</p>
                            </div>
                        )}
                    </div>
                </div>
            );
            default: return null;
        }
    }

    return (
         <div className="bg-light-bg dark:bg-slate-900 min-h-screen">
            <div className="flex">
                 {/* Sidebar */}
                <aside className={`fixed lg:relative lg:translate-x-0 inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 shadow-lg transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex items-center justify-center p-6 border-b dark:border-slate-700 h-20">
                        <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-poppins">Teknisi</span>
                    </div>
                    <nav className="flex-grow p-4 space-y-2">
                        {[
                            { name: 'Dashboard', icon: LayoutDashboard, section: 'dashboard' },
                            { name: 'Tugas Saya', icon: CalendarCheck, section: 'jobs' },
                            { name: 'Peta Tugas', icon: MapIcon, section: 'map' },
                        ].map(item => (
                            <button key={item.section} onClick={() => { setActiveSection(item.section as TechnicianSection); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${activeSection === item.section ? 'bg-primary-light text-primary dark:bg-slate-700' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'}`}>
                                <item.icon size={20} />
                                {item.name}
                            </button>
                        ))}
                    </nav>
                     <div className="p-4 border-t dark:border-slate-700">
                        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50">
                            <LogOut size={20}/>
                            Logout
                        </button>
                     </div>
                </aside>

                 {/* Main Content */}
                <div className="flex-1 w-full lg:w-auto">
                    {/* Header */}
                    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm h-20 flex items-center justify-between lg:justify-end px-6">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 dark:text-gray-300">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">Hello, {currentUser?.name}</span>
                             <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-slate-700 flex items-center justify-center text-primary font-bold text-lg">
                               {currentUser?.name.charAt(0)}
                            </div>
                        </div>
                    </header>
                    {/* Page Content */}
                    <main className="p-6">
                        <h1 className="text-3xl font-bold font-poppins text-gray-800 dark:text-white mb-6">{sectionTitles[activeSection]}</h1>
                        {renderSection()}
                    </main>
                </div>
            </div>
             {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden"></div>}
        </div>
    );
};

export default TechnicianPage;