
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getBookings, saveBookings, getAvailability, saveAvailability, formatDateToKey, parseKeyToDate, generateTimeSlots, Booking, BookingStatus, getPhoto, getServices, saveServices, getUsers, saveUsers, User } from '../lib/storage';
import Calendar from '../components/Calendar';
import GenericConfirmationModal from '../components/GenericConfirmationModal';
import { Service, ServiceCategory, serviceIcons } from '../config/services';
import ServiceFormModal from '../components/ServiceFormModal';
import { useNotification } from '../contexts/NotificationContext';
import { simulateNotification } from '../lib/notifications';
import { MapPin, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, Search, Filter, PlusCircle, Edit, Trash2, UserPlus, Users, X, BarChart2, LayoutDashboard, Settings, Map as MapIcon, Calendar as CalendarIcon, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BookingFormModal from '../components/BookingFormModal';


const statuses: BookingStatus[] = ['Confirmed', 'On Site', 'In Progress', 'Completed', 'Cancelled'];

const statusColors: { [key in BookingStatus]: string } = {
    'Confirmed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
    'On Site': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300',
    'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300',
    'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
};

const timelineStatusColors: { [key in BookingStatus]: string } = {
    'Confirmed': 'bg-blue-500 border-blue-700',
    'On Site': 'bg-cyan-500 border-cyan-700',
    'In Progress': 'bg-yellow-500 border-yellow-700',
    'Completed': 'bg-green-500 border-green-700',
    'Cancelled': 'bg-gray-400 border-gray-600',
};

// --- Technician Form Modal Component ---
interface TechnicianFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (technician: User) => void;
    technicianToEdit: User | null;
    existingUsernames: string[];
}

const TechnicianFormModal: React.FC<TechnicianFormModalProps> = ({ isOpen, onClose, onSave, technicianToEdit, existingUsernames }) => {
    const [formData, setFormData] = useState<Partial<User>>({});
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(technicianToEdit ? { ...technicianToEdit, password: '' } : { name: '', username: '', role: 'technician', password: '' });
            setErrors({});
        }
    }, [isOpen, technicianToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name?.trim()) newErrors.name = "Nama wajib diisi.";
        if (!formData.username?.trim()) newErrors.username = "Username wajib diisi.";
        if (!formData.role?.trim()) newErrors.role = "Peran wajib diisi.";

        if (!technicianToEdit) { // New technician
            if (!formData.password?.trim()) newErrors.password = "Password wajib diisi untuk teknisi baru.";
            if (existingUsernames.includes(formData.username!.trim())) {
                newErrors.username = "Username sudah digunakan.";
            }
        } else { // Editing technician
            // Username cannot be changed, so no need for uniqueness check on edit.
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave({ ...formData, role: 'technician' } as User);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">
                            {technicianToEdit ? 'Edit Teknisi' : 'Tambah Teknisi Baru'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"><X size={24} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary" />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                                <input type="text" name="username" value={formData.username || ''} onChange={handleChange} readOnly={!!technicianToEdit} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary read-only:bg-gray-100 dark:read-only:bg-slate-600" />
                                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Peran/Jabatan</label>
                                <input type="text" name="role" value={formData.role || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary" />
                                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <input type="password" name="password" value={formData.password || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary" />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            {technicianToEdit && <p className="text-xs text-gray-400 mt-1">Kosongkan jika tidak ingin mengubah password.</p>}
                        </div>
                    </div>
                    <div className="p-6 bg-light-bg dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 rounded-b-2xl flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-gray-200 font-bold px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Batal</button>
                        <button type="submit" className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary-dark">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Helper Functions for Schedule Conflict Check ---
const getBookingTimeRange = (booking: Booking, servicesMap: Map<string, Service>): { start: Date; end: Date } | null => {
    const service = servicesMap.get(booking.service);
    if (!service) return null;

    const [hour, minute] = booking.time.split(':').map(Number);
    const startDate = new Date(booking.startDate);
    
    const serviceDurationDays = service.durationDays || 1;
    if (serviceDurationDays > 1) {
        startDate.setHours(8, 0, 0, 0);
        const endDate = new Date(booking.endDate);
        endDate.setHours(18, 0, 0, 0); 
        return { start: startDate, end: endDate };
    }

    startDate.setHours(hour, minute, 0, 0);
    const duration = service.duration || 60;
    const endDate = new Date(startDate.getTime() + duration * 60000);

    return { start: startDate, end: endDate };
};

const isTechnicianAvailable = (
    technicianName: string,
    currentBooking: Booking,
    allBookings: Booking[],
    servicesMap: Map<string, Service>
): boolean => {
    if (technicianName === 'Belum Ditugaskan') return true;

    const currentRange = getBookingTimeRange(currentBooking, servicesMap);
    if (!currentRange) return true;

    const techBookings = allBookings.filter(
        b => b.technician === technicianName && b.id !== currentBooking.id && b.status !== 'Cancelled'
    );

    for (const otherBooking of techBookings) {
        const otherRange = getBookingTimeRange(otherBooking, servicesMap);
        if (!otherRange) continue;

        if (currentRange.start < otherRange.end && currentRange.end > otherRange.start) {
            return false;
        }
    }

    return true;
};


const WhatsAppButton: React.FC<{ booking: Booking }> = ({ booking }) => {
    const formatWhatsappNumber = (phone: string) => {
        if (phone.startsWith('0')) {
            return `62${phone.substring(1)}`;
        }
        return phone;
    };

    const generateWhatsappLink = () => {
        const number = formatWhatsappNumber(booking.whatsapp);
        const bookingDate = new Date(booking.startDate).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        const message = `Halo ${booking.name}, kami dari Viniela Home & Service ingin mengkonfirmasi pesanan Anda:

*Layanan:* ${booking.service}
*Jadwal:* ${bookingDate}, pukul ${booking.time}
*Alamat:* ${booking.address}

Mohon balas pesan ini untuk mengkonfirmasi detail di atas sudah benar. Terima kasih.`;
        
        return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    };

    return (
        <a 
            href={generateWhatsappLink()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-green-600 transition-colors"
            title={`Chat ${booking.name} di WhatsApp`}
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.459l-6.354 1.654zm.791-6.938c.323.517.76 1.002 1.251 1.431.987.842 2.197 1.298 3.51 1.298 5.421 0 9.811-4.39 9.811-9.811 0-2.651-1.04-5.14-2.9-7.001-1.859-1.86-4.35-2.901-7.001-2.901-5.42 0-9.81 4.39-9.81 9.81 0 2.05.61 3.992 1.698 5.688l-.299 1.093zM9.262 7.176c-.23-.487-.474-.487-.698-.487-.203 0-.428.02-.638.211-.23.19-.813.78-.813 1.901 0 1.12.831 2.201.946 2.36.116.161 1.638 2.542 4.004 3.53.585.24 1.045.38 1.41.496.535.169.97.143 1.324-.087.419-.27.813-.981.928-1.342.116-.361.116-.671.083-.758-.032-.087-.23-.142-.487-.27-.257-.128-1.515-.748-1.758-.831-.243-.083-.419-.083-.595.083-.176.166-.66.831-.813.981-.152.152-.291.178-.487.05-.196-.128-.831-.289-1.587-.961-.595-.541-.97-1.221-1.085-1.428-.116-.208-.017-.323.07-.43.087-.107.196-.178.291-.269.1-.096.143-.15.211-.243.068-.092.032-.178-.017-.258-.05-.082-.464-1.113-.638-1.515z"/>
            </svg>
            Chat
        </a>
    );
};

const formatDuration = (minutes: number): string => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} mnt`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} jam`;
    return `${hours} jam ${remainingMinutes} mnt`;
}

const BookingPhoto: React.FC<{ photoKey?: string; alt: string; label: string }> = ({ photoKey, alt, label }) => {
    const [photoData, setPhotoData] = useState<string | null>(null);

    useEffect(() => {
        if (photoKey) {
            setPhotoData(getPhoto(photoKey));
        } else {
            setPhotoData(null);
        }
    }, [photoKey]);

    if (!photoData) {
        return null;
    }

    return (
        <a href={photoData} target="_blank" rel="noopener noreferrer" className="block">
            <img src={photoData} className="w-20 h-20 object-cover rounded-md" alt={alt}/>
            <span className="text-center block text-gray-500 text-[10px]">{label}</span>
        </a>
    );
};

const TechnicianSchedule: React.FC<{ bookings: Booking[]; selectedDate: Date; technicians: User[] }> = ({ bookings, selectedDate, technicians }) => {
    const START_HOUR = 8;
    const END_HOUR = 18;
    const WORKDAY_MINUTES = (END_HOUR - START_HOUR - 1) * 60; // 8-18 with 1hr break
    const totalMinutes = (END_HOUR - START_HOUR) * 60;

    const [servicesMap, setServicesMap] = useState<Map<string, Service>>(new Map());

    useEffect(() => {
        const servicesData = getServices();
        const map = new Map();
        servicesData.forEach(category => {
            category.services.forEach(service => {
                map.set(service.name, service);
            });
        });
        setServicesMap(map);
    }, []);

    const filteredBookings = useMemo(() => {
        const selectedDateKey = formatDateToKey(selectedDate);
        return bookings.filter(b => {
            const start = formatDateToKey(new Date(b.startDate));
            const end = formatDateToKey(new Date(b.endDate));
            return selectedDateKey >= start && selectedDateKey <= end && b.status !== 'Cancelled';
        });
    }, [bookings, selectedDate]);
    
    const timelineHours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
    
    const getProgressBarColor = (percentage: number) => {
        if (percentage > 80) return 'bg-red-500';
        if (percentage > 50) return 'bg-yellow-400';
        return 'bg-green-500';
    };

    return (
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
            <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-4">
                Jadwal Teknisi untuk {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
             <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                    <div className="flex border-b-2 border-gray-200 dark:border-slate-700 pb-2">
                        <div className="w-48 flex-shrink-0"></div>
                        <div className="flex-1 grid grid-cols-10">
                            {timelineHours.map(hour => (
                                <div key={hour} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {String(hour).padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>
                    </div>
                    {technicians.map(tech => {
                        const techBookings = filteredBookings.filter(b => b.technician === tech.name);
                        
                        const totalWorkMinutes = techBookings.reduce((total, booking) => {
                            const service = servicesMap.get(booking.service);
                            if (!service) return total;
                        
                            const isMultiDay = service.durationDays && service.durationDays > 1;
                            const isStartDate = formatDateToKey(new Date(booking.startDate)) === formatDateToKey(selectedDate);
                        
                            if (isMultiDay && !isStartDate) {
                                return total + WORKDAY_MINUTES; 
                            }
                            
                            return total + (service.duration || 0);
                        }, 0);

                        const workloadPercentage = Math.min((totalWorkMinutes / WORKDAY_MINUTES) * 100, 100);
                        const progressBarColor = getProgressBarColor(workloadPercentage);

                        return (
                            <div key={tech.id} className="flex border-b border-gray-100 dark:border-slate-700/50">
                                <div className="w-48 flex-shrink-0 py-3 px-2 border-r border-gray-100 dark:border-slate-700/50">
                                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-200 truncate">{tech.name}</p>
                                    <div className="mt-2">
                                        <div className="flex justify-between text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                                            <span>Beban Kerja</span>
                                            <span>{(totalWorkMinutes / 60).toFixed(1)} / {(WORKDAY_MINUTES / 60)} jam</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-slate-700" title={`${workloadPercentage.toFixed(0)}% terisi`}>
                                            <div className={`${progressBarColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${workloadPercentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 h-20 relative">
                                    {timelineHours.map(hour => (
                                        <div key={`line-${hour}`} className="absolute h-full border-l border-gray-100 dark:border-slate-700/50" style={{ left: `${((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}></div>
                                    ))}
                                    {techBookings.map(booking => {
                                        const isMultiDay = booking.startDate !== booking.endDate;
                                        const isStartDate = formatDateToKey(new Date(booking.startDate)) === formatDateToKey(selectedDate);

                                        let minutesFromStart: number;
                                        let durationMinutes: number;
                                        const serviceInfo = servicesMap.get(booking.service);

                                        if (isMultiDay && !isStartDate) {
                                            minutesFromStart = 0;
                                            durationMinutes = (END_HOUR - START_HOUR) * 60;
                                        } else {
                                            const [hour, minute] = booking.time.split(':').map(Number);
                                            minutesFromStart = (hour - START_HOUR) * 60 + minute;
                                            durationMinutes = serviceInfo ? serviceInfo.duration : 60;
                                        }

                                        const leftPercent = (minutesFromStart / totalMinutes) * 100;
                                        const widthPercent = (durationMinutes / totalMinutes) * 100;

                                        if (leftPercent < 0 || leftPercent >= 100) return null;

                                        const statusColorClass = timelineStatusColors[booking.status] || 'bg-gray-500 border-gray-700';

                                        return (
                                            <div
                                                key={booking.id}
                                                className={`absolute top-2 h-16 ${statusColorClass} rounded-lg p-2 text-white shadow-md overflow-hidden border-l-4`}
                                                style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                                                title={`${booking.name} - ${booking.service} @ ${booking.time} [Status: ${booking.status}]`}
                                            >
                                                <p className="text-xs font-bold truncate">{booking.name}</p>
                                                <p className="text-[10px] opacity-80 truncate">{booking.service}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {filteredBookings.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    Tidak ada jadwal pekerjaan untuk tanggal ini.
                </div>
            )}
        </div>
    );
};

const BarChart: React.FC<{ data: { label: string, value: number }[]; title: string; }> = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const colors = ['#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4', '#CCFBF1'];
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">{title}</h3>
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-gray-700 dark:text-gray-200 truncate pr-2">{item.label}</span>
                            <span className="font-bold text-primary">{item.value}</span>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-full">
                            <div
                                className="h-4 rounded-full"
                                style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: colors[index % colors.length] }}
                                title={`${item.label}: ${item.value}`}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PieChart: React.FC<{ data: { label: string, value: number }[]; title: string; }> = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;
    let accumulatedPercentage = 0;
    const gradients = data.map((item, index) => {
        const color = statusColors[item.label as BookingStatus] ? `var(--tw-color-${statusColors[item.label as BookingStatus].match(/(\w+)-100/)?.[1]}-500, #ccc)` : '#ccc';
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
                    role="img"
                    aria-label={`Pie chart showing: ${data.map(d => `${d.label} ${((d.value/total)*100).toFixed(1)}%`).join(', ')}`}
                ></div>
                <div className="space-y-2">
                    {data.map(item => (
                        <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${statusColors[item.label as BookingStatus]?.replace('text-', 'bg-').replace(/-\d+$/, '-500')}`}></span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                            </div>
                            <span className="font-bold text-gray-800 dark:text-white">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

type AdminSection = 'kpi' | 'bookings' | 'schedule' | 'map' | 'technicians' | 'services' | 'availability';

const AdminPage: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [services, setServices] = useState<ServiceCategory[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [activeSection, setActiveSection] = useState<AdminSection>('kpi');
    const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [technicianFilter, setTechnicianFilter] = useState('all');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { addNotification } = useNotification();
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const ITEMS_PER_PAGE = 5;

    const [originalFullyBooked, setOriginalFullyBooked] = useState<Set<string>>(new Set<string>());
    const [originalBookedSlots, setOriginalBookedSlots] = useState<Set<string>>(new Set<string>());
    const [draftFullyBooked, setDraftFullyBooked] = useState<Set<string>>(new Set<string>());
    const [draftBookedSlots, setDraftBookedSlots] = useState<Set<string>>(new Set<string>());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [scheduleDate, setScheduleDate] = useState<Date>(new Date());
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; title: string } | null>(null);
    
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
    const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);
    const [serviceToDelete, setServiceToDelete] = useState<{ serviceName: string; categoryName: string } | null>(null);

    const [isTechnicianModalOpen, setIsTechnicianModalOpen] = useState(false);
    const [technicianToEdit, setTechnicianToEdit] = useState<User | null>(null);
    const [technicianToDelete, setTechnicianToDelete] = useState<User | null>(null);
    const [isAddBookingModalOpen, setIsAddBookingModalOpen] = useState(false);

    const [confirmationState, setConfirmationState] = useState<{
        isOpen: boolean;
        bookingId: number | null;
        field: 'status' | 'technician' | null;
        value: string | null;
        title: string;
        message: string;
    }>({
        isOpen: false,
        bookingId: null,
        field: null,
        value: null,
        title: '',
        message: ''
    });

    const availableTimes = useMemo(() => generateTimeSlots(9, 17, 12, 13, 30), []);
    
    const technicians = useMemo(() => allUsers.filter(u => u.role === 'technician'), [allUsers]);

    const servicesMap = useMemo(() => {
        const map = new Map<string, Service>();
        services.forEach(category => {
            category.services.forEach(service => {
                map.set(service.name, service);
            });
        });
        return map;
    }, [services]);

    const loadData = useCallback(() => {
        setBookings(getBookings());
        setServices(getServices());
        setAllUsers(getUsers());
    }, []);


    useEffect(() => {
        loadData();

        const { fullyBookedDates, bookedSlots } = getAvailability();
        const fullyBookedSet = new Set<string>(fullyBookedDates);
        const bookedSlotsSet = new Set<string>(bookedSlots || []);
        
        setOriginalFullyBooked(fullyBookedSet);
        setDraftFullyBooked(fullyBookedSet);
        setOriginalBookedSlots(bookedSlotsSet);
        setDraftBookedSlots(bookedSlotsSet);

        window.addEventListener('focus', loadData);
        return () => {
            window.removeEventListener('focus', loadData);
        };
    }, [loadData]);
    
    useEffect(() => {
        const fullyBookedChanged = JSON.stringify(Array.from(originalFullyBooked).sort()) !== JSON.stringify(Array.from(draftFullyBooked).sort());
        const bookedSlotsChanged = JSON.stringify(Array.from(originalBookedSlots).sort()) !== JSON.stringify(Array.from(draftBookedSlots).sort());
        setHasUnsavedChanges(fullyBookedChanged || bookedSlotsChanged);
    }, [draftFullyBooked, draftBookedSlots, originalFullyBooked, originalBookedSlots]);
    
    const filteredBookings = useMemo(() => {
        return bookings
            .filter(booking => {
                const searchTermMatch = booking.name.toLowerCase().includes(searchTerm.toLowerCase());
                const statusMatch = statusFilter === 'all' || booking.status === statusFilter;
                const technicianMatch = technicianFilter === 'all' || booking.technician === technicianFilter;
                return searchTermMatch && statusMatch && technicianMatch;
            })
            .sort((a, b) => b.id - a.id);
    }, [bookings, searchTerm, statusFilter, technicianFilter]);


    const paginatedBookings = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredBookings, currentPage]);

    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, technicianFilter]);


    const upcomingJobs = useMemo(() => {
        return bookings
            .filter(b => b.status === 'Confirmed' || b.status === 'On Site')
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [bookings]);

    useEffect(() => {
        if (activeSection === 'map' && upcomingJobs.length > 0 && !selectedLocation) {
            setSelectedLocation({
                lat: upcomingJobs[0].lat,
                lng: upcomingJobs[0].lng,
                title: upcomingJobs[0].name
            });
        } else if (activeSection !== 'map') {
            setSelectedLocation(null);
        }
    }, [activeSection, upcomingJobs, selectedLocation]);


    const handleBookingUpdate = (id: number, field: 'status' | 'technician', value: string) => {
        if (field === 'status' && (value === 'Completed' || value === 'Cancelled')) {
            const bookingToUpdate = bookings.find(b => b.id === id);
            if (!bookingToUpdate) return;
    
            setConfirmationState({
                isOpen: true,
                bookingId: id,
                field: field,
                value: value,
                title: value === 'Completed' ? 'Selesaikan Pesanan?' : 'Batalkan Pesanan?',
                message: value === 'Completed'
                    ? `Apakah Anda yakin ingin menyelesaikan pesanan untuk ${bookingToUpdate.name}?`
                    : `Apakah Anda yakin ingin membatalkan pesanan untuk ${bookingToUpdate.name}? Tindakan ini tidak dapat diurungkan.`
            });
            return;
        }
        
        if (field === 'technician') {
            const originalBooking = bookings.find(b => b.id === id);
            if (originalBooking && originalBooking.technician === 'Belum Ditugaskan' && value !== 'Belum Ditugaskan') {
                 const uiMessage = simulateNotification('technician_assigned', { ...originalBooking, technician: value });
                 addNotification(uiMessage, 'info');
            }
        }

        const updatedBookings = bookings.map(b => 
            b.id === id ? { ...b, [field]: value } : b
        );
        setBookings(updatedBookings);
        saveBookings(updatedBookings);
    };
    
    const closeConfirmationModal = () => {
        setConfirmationState({ isOpen: false, bookingId: null, field: null, value: null, title: '', message: '' });
    };

    const confirmBookingUpdate = () => {
        const { bookingId, field, value } = confirmationState;
        if (bookingId && field && value) {
            const updatedBookings = bookings.map(b => 
                b.id === bookingId ? { ...b, [field]: value } : b
            );
            setBookings(updatedBookings);
            saveBookings(updatedBookings);
        }
        closeConfirmationModal();
    };
    
    const handleToggleFullDay = () => {
        if (!selectedDate) return;
        const dateKey = formatDateToKey(selectedDate);
        const newDraft = new Set<string>(draftFullyBooked);
        if (newDraft.has(dateKey)) {
            newDraft.delete(dateKey);
        } else {
            newDraft.add(dateKey);
        }
        setDraftFullyBooked(newDraft);
    };
    
    const handleToggleSlot = (time: string) => {
        if (!selectedDate) return;
        const slotKey = `${formatDateToKey(selectedDate)}-${time}`;
        const newDraft = new Set<string>(draftBookedSlots);
        if (newDraft.has(slotKey)) {
            newDraft.delete(slotKey);
        } else {
            newDraft.add(slotKey);
        }
        setDraftBookedSlots(newDraft);
    };
    
    const handleSaveChanges = () => {
        saveAvailability({
            fullyBookedDates: Array.from(draftFullyBooked),
            bookedSlots: Array.from(draftBookedSlots),
        });
        setOriginalFullyBooked(new Set(draftFullyBooked));
        setOriginalBookedSlots(new Set(draftBookedSlots));
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
    };

    const handleRemoveBlockedDate = (dateKey: string) => {
        const newDraft = new Set<string>(draftFullyBooked);
        newDraft.delete(dateKey);
        setDraftFullyBooked(newDraft);
    }
    
    const kpiData = useMemo(() => {
        const techKpis: { [key: string]: { completed: number, totalMinutes: number } } = {};
        technicians.forEach(tech => {
            techKpis[tech.name] = { completed: 0, totalMinutes: 0 };
        });
        bookings.forEach(booking => {
            if(booking.technician !== 'Belum Ditugaskan' && booking.status === 'Completed'){
                if(!techKpis[booking.technician]) {
                    techKpis[booking.technician] = { completed: 0, totalMinutes: 0 };
                }
                techKpis[booking.technician].completed += 1;
                techKpis[booking.technician].totalMinutes += booking.workDurationMinutes || 0;
            }
        });
        const technicianPerformance = Object.entries(techKpis).map(([name, data]) => ({ name, ...data }));
        
        const serviceCounts = bookings.reduce((acc, booking) => {
            if (booking.status === 'Completed') {
                acc[booking.service] = (acc[booking.service] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const popularServices = Object.entries(serviceCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([label, value]) => ({ label, value }));

        const statusCounts = bookings.reduce((acc, booking) => {
            acc[booking.status] = (acc[booking.status] || 0) + 1;
            return acc;
        }, {} as Record<BookingStatus, number>);
        const statusDistribution = Object.entries(statusCounts).map(([label, value]) => ({ label, value }));
        
        return { technicianPerformance, popularServices, statusDistribution };
    }, [bookings, technicians]);
    
    const formatSchedule = (startDate: string, endDate: string, time: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
        
        if (start.toDateString() === end.toDateString()) {
            return `${start.toLocaleDateString('id-ID', {...options, year: 'numeric'})}, ${time}`;
        }
        
        return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', {...options, year: 'numeric'})}`;
    };

    const handleOpenAddService = () => {
        setServiceToEdit(null);
        setCategoryToEdit(null);
        setIsServiceModalOpen(true);
    };

    const handleOpenEditService = (service: Service, categoryName: string) => {
        setServiceToEdit(service);
        setCategoryToEdit(categoryName);
        setIsServiceModalOpen(true);
    };
    
    const handleSaveService = (serviceData: Service, categoryName: string) => {
        let newServices = JSON.parse(JSON.stringify(services)) as ServiceCategory[];

        if (serviceToEdit && categoryToEdit) {
            const oldCategory = newServices.find(c => c.category === categoryToEdit);
            if (oldCategory) {
                oldCategory.services = oldCategory.services.filter(s => s.name !== serviceToEdit.name);
                if (oldCategory.services.length === 0) {
                    newServices = newServices.filter(c => c.category !== categoryToEdit);
                }
            }
        }
        
        let targetCategory = newServices.find(c => c.category === categoryName);
        if (targetCategory) {
            const existingServiceIndex = targetCategory.services.findIndex(s => s.name === serviceData.name);
            if (existingServiceIndex > -1) {
                targetCategory.services[existingServiceIndex] = serviceData;
            } else {
                targetCategory.services.push(serviceData);
            }
        } else {
            newServices.push({
                category: categoryName,
                services: [serviceData],
            });
        }
        
        setServices(newServices);
        saveServices(newServices);
        setIsServiceModalOpen(false);
        addNotification(`Layanan "${serviceData.name}" berhasil disimpan.`, 'success');
    };

    const handleDeleteService = () => {
        if (!serviceToDelete) return;

        const { serviceName, categoryName } = serviceToDelete;
        let newServices = JSON.parse(JSON.stringify(services)) as ServiceCategory[];
        
        const category = newServices.find(c => c.category === categoryName);
        if (category) {
            category.services = category.services.filter(s => s.name !== serviceName);
            if (category.services.length === 0) {
                newServices = newServices.filter(c => c.category !== categoryName);
            }
        }

        setServices(newServices);
        saveServices(newServices);
        setServiceToDelete(null);
        addNotification(`Layanan "${serviceName}" telah dihapus.`, 'success');
    };

    // --- Technician Management Handlers ---
    const handleOpenAddTechnician = () => {
        setTechnicianToEdit(null);
        setIsTechnicianModalOpen(true);
    };
    
    const handleOpenEditTechnician = (tech: User) => {
        setTechnicianToEdit(tech);
        setIsTechnicianModalOpen(true);
    };
    
    const handleSaveTechnician = (technicianData: User) => {
        let updatedUsers;
        if (technicianToEdit) { // Editing existing technician
            updatedUsers = allUsers.map(u =>
                u.id === technicianToEdit.id ? { ...u, ...technicianData, password: technicianData.password || u.password } : u
            );
        } else { // Adding new technician
            const newId = allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id)) + 1 : 1;
            updatedUsers = [...allUsers, { ...technicianData, id: newId }];
        }
        setAllUsers(updatedUsers);
        saveUsers(updatedUsers);
        setIsTechnicianModalOpen(false);
        addNotification(`Teknisi "${technicianData.name}" berhasil disimpan.`, 'success');
    };
    
    const handleDeleteTechnician = () => {
        if (!technicianToDelete) return;
        const updatedUsers = allUsers.filter(u => u.id !== technicianToDelete.id);
        setAllUsers(updatedUsers);
        saveUsers(updatedUsers);
        setTechnicianToDelete(null);
        addNotification(`Teknisi "${technicianToDelete.name}" telah dihapus.`, 'success');
    };

    const handleSaveNewBooking = (newBookingData: Omit<Booking, 'id'>) => {
        const allBookings = getBookings();
        const newBooking: Booking = {
            ...newBookingData,
            id: allBookings.length > 0 ? Math.max(...allBookings.map(b => b.id)) + 1 : 1,
        };
        
        const updatedBookings = [...allBookings, newBooking];
        saveBookings(updatedBookings);
        setBookings(updatedBookings);

        const service = servicesMap.get(newBooking.service);
        const durationDays = service?.durationDays || 1;

        const currentAvailability = getAvailability();
        const newBookedSlots = [...(currentAvailability.bookedSlots || []), `${formatDateToKey(new Date(newBooking.startDate))}-${newBooking.time}`];
        let newFullyBookedDates = [...currentAvailability.fullyBookedDates];

        if (durationDays > 1) {
            const datesToBlock = new Set(newFullyBookedDates);
            const startDate = new Date(newBooking.startDate);
            const endDate = new Date(newBooking.endDate);
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                datesToBlock.add(formatDateToKey(d));
            }
            newFullyBookedDates = Array.from(datesToBlock);
        }

        saveAvailability({
            fullyBookedDates: newFullyBookedDates,
            bookedSlots: newBookedSlots,
        });

        // Update local availability state as well to reflect in the calendar
        setOriginalFullyBooked(new Set(newFullyBookedDates));
        setDraftFullyBooked(new Set(newFullyBookedDates));
        setOriginalBookedSlots(new Set(newBookedSlots));
        setDraftBookedSlots(new Set(newBookedSlots));

        addNotification(`Booking baru untuk ${newBooking.name} berhasil ditambahkan.`, 'success');
        setIsAddBookingModalOpen(false);
    };
    
    const technicianDropdownOptions = useMemo(() => {
        return technicians.map(t => t.name).concat(['Belum Ditugaskan']);
    }, [technicians]);
    
    const sectionTitles: Record<AdminSection, string> = {
        kpi: 'Dashboard KPI',
        bookings: 'Daftar Booking',
        schedule: 'Jadwal Teknisi',
        map: 'Peta Lokasi Tugas',
        technicians: 'Manajemen Teknisi',
        services: 'Manajemen Layanan',
        availability: 'Atur Ketersediaan Jadwal',
    };


    const renderSection = () => {
        switch(activeSection) {
            case 'bookings': return (
                  <div key="bookings">
                    <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <label htmlFor="search-booking" className="sr-only">Cari Pelanggan</label>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="search-booking"
                                    type="text"
                                    placeholder="Cari nama pelanggan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label htmlFor="status-filter" className="sr-only">Filter Status</label>
                                <select
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-primary focus:border-primary"
                                >
                                    <option value="all">Semua Status</option>
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="technician-filter" className="sr-only">Filter Teknisi</label>
                                <select
                                    id="technician-filter"
                                    value={technicianFilter}
                                    onChange={(e) => setTechnicianFilter(e.target.value)}
                                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-primary focus:border-primary"
                                >
                                    <option value="all">Semua Teknisi</option>
                                    {technicianDropdownOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl" data-aos="fade-up">
                        {/* Mobile & Tablet Card View */}
                        <div className="md:hidden">
                            {paginatedBookings.length > 0 ? paginatedBookings.map((booking) => (
                                <div key={booking.id} className="p-4 border-b border-gray-200 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{booking.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{booking.whatsapp}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <WhatsAppButton booking={booking} />
                                            <button onClick={() => setExpandedBookingId(expandedBookingId === booking.id ? null : booking.id)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                                                <ChevronDown className={`h-5 w-5 transition-transform text-gray-500 dark:text-gray-400 ${expandedBookingId === booking.id ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 text-sm">
                                        <p><strong className="font-semibold text-gray-600 dark:text-gray-300">Layanan:</strong> {booking.service}</p>
                                        <p><strong className="font-semibold text-gray-600 dark:text-gray-300">Jadwal:</strong> {formatSchedule(booking.startDate, booking.endDate, booking.time)}</p>
                                        <div>
                                            <label className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">Status:</label>
                                            <select value={booking.status} onChange={(e) => handleBookingUpdate(booking.id, 'status', e.target.value as BookingStatus)} className={`text-sm font-medium w-full p-2 rounded-lg border-2 appearance-none ${statusColors[booking.status].replace('bg-','border-')} ${statusColors[booking.status]}`}>
                                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">Teknisi:</label>
                                            <select value={booking.technician || 'Belum Ditugaskan'} onChange={(e) => handleBookingUpdate(booking.id, 'technician', e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-primary focus:border-primary">
                                                {technicianDropdownOptions.map(techName => {
                                                    const isAvailable = isTechnicianAvailable(techName, booking, bookings, servicesMap);
                                                    return <option key={techName} value={techName} disabled={!isAvailable}>{techName}{!isAvailable ? ' (Bentrok)' : ''}</option>;
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                    {expandedBookingId === booking.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700/50 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Detail Pelanggan</h4>
                                                <p><strong>Alamat:</strong> {booking.address}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Laporan Kerja</h4>
                                                <p><strong>Tiba:</strong> {booking.arrivalTime ? new Date(booking.arrivalTime).toLocaleString('id-ID', {dateStyle:'short', timeStyle:'medium'}) : '-'}</p>
                                                <p><strong>Mulai:</strong> {booking.startTime ? new Date(booking.startTime).toLocaleString('id-ID', {dateStyle:'short', timeStyle:'medium'}) : '-'}</p>
                                                <p><strong>Selesai:</strong> {booking.endTime ? new Date(booking.endTime).toLocaleString('id-ID', {dateStyle:'short', timeStyle:'medium'}) : '-'}</p>
                                                <p><strong>Durasi:</strong> {formatDuration(booking.workDurationMinutes || 0)}</p>
                                                <p><strong>Biaya Tambahan:</strong> Rp{booking.additionalCosts?.toLocaleString('id-ID') || 0}</p>
                                                <p className="mt-1"><strong>Catatan:</strong><br/>{booking.additionalWorkNotes || '-'}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Bukti Foto</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    <BookingPhoto photoKey={booking.photos?.arrival} alt="Tiba" label="Tiba"/>
                                                    <BookingPhoto photoKey={booking.photos?.before} alt="Sebelum" label="Sebelum"/>
                                                    <BookingPhoto photoKey={booking.photos?.after} alt="Sesudah" label="Sesudah"/>
                                                    {!booking.photos?.arrival && !booking.photos?.before && !booking.photos?.after && <p className="text-xs">Belum ada foto.</p>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-16 text-gray-500 dark:text-gray-400">Tidak ada data booking yang cocok.</div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pelanggan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Layanan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jadwal</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teknisi</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                    {paginatedBookings.length > 0 ? paginatedBookings.map((booking) => (
                                       <React.Fragment key={booking.id}>
                                            <tr className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors align-top">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-gray-900 dark:text-white">{booking.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{booking.whatsapp}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                                    {booking.service}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                    {formatSchedule(booking.startDate, booking.endDate, booking.time)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm min-w-[180px]">
                                                    <select value={booking.technician || 'Belum Ditugaskan'} onChange={(e) => handleBookingUpdate(booking.id, 'technician', e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-primary focus:border-primary">
                                                        {technicianDropdownOptions.map(techName => {
                                                            const isAvailable = isTechnicianAvailable(techName, booking, bookings, servicesMap);
                                                            return (
                                                                <option key={techName} value={techName} disabled={!isAvailable}>
                                                                    {techName}{!isAvailable ? ' (Bentrok)' : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap min-w-[180px]">
                                                    <select value={booking.status} onChange={(e) => handleBookingUpdate(booking.id, 'status', e.target.value as BookingStatus)} className={`text-sm font-medium w-full p-2 rounded-lg border-2 appearance-none ${statusColors[booking.status].replace('bg-','border-')} ${statusColors[booking.status]}`}>
                                                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <WhatsAppButton booking={booking} />
                                                        <button onClick={() => setExpandedBookingId(expandedBookingId === booking.id ? null : booking.id)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700" title="Lihat Detail">
                                                            <ChevronDown className={`h-5 w-5 transition-transform text-gray-500 dark:text-gray-400 ${expandedBookingId === booking.id ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedBookingId === booking.id && (
                                                <tr className="bg-light-bg dark:bg-slate-900/50">
                                                    <td colSpan={6} className="p-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-300">
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Detail Pelanggan</h4>
                                                                <p><strong>Alamat:</strong> {booking.address}</p>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Laporan Kerja</h4>
                                                                <p><strong>Tiba:</strong> {booking.arrivalTime ? new Date(booking.arrivalTime).toLocaleString('id-ID', {dateStyle:'short', timeStyle:'medium'}) : '-'}</p>
                                                                <p><strong>Mulai:</strong> {booking.startTime ? new Date(booking.startTime).toLocaleString('id-ID', {dateStyle:'short', timeStyle:'medium'}) : '-'}</p>
                                                                <p><strong>Selesai:</strong> {booking.endTime ? new Date(booking.endTime).toLocaleString('id-ID', {dateStyle:'short', timeStyle:'medium'}) : '-'}</p>
                                                                <p><strong>Durasi:</strong> {formatDuration(booking.workDurationMinutes || 0)}</p>
                                                                <p><strong>Biaya Tambahan:</strong> Rp{booking.additionalCosts?.toLocaleString('id-ID') || 0}</p>
                                                                <p className="mt-2"><strong>Catatan:</strong><br/>{booking.additionalWorkNotes || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Bukti Foto</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    <BookingPhoto photoKey={booking.photos?.arrival} alt="Tiba" label="Tiba"/>
                                                                    <BookingPhoto photoKey={booking.photos?.before} alt="Sebelum" label="Sebelum"/>
                                                                    <BookingPhoto photoKey={booking.photos?.after} alt="Sesudah" label="Sesudah"/>
                                                                    {!booking.photos?.arrival && !booking.photos?.before && !booking.photos?.after && <p className="text-xs">Belum ada foto.</p>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                       </React.Fragment>
                                    )) : (
                                        <tr><td colSpan={6} className="text-center py-16 text-gray-500 dark:text-gray-400">Tidak ada data booking yang cocok.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 px-4 py-3 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">
                                        Sebelumnya
                                    </button>
                                    <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">
                                        Berikutnya
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Menampilkan <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)}</span> dari <span className="font-medium">{filteredBookings.length}</span> hasil
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">
                                                <span className="sr-only">Previous</span>
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Halaman {currentPage} dari {totalPages}
                                            </span>
                                            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">
                                                <span className="sr-only">Next</span>
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
            )
            case 'schedule': return (
                     <div key="schedule" className="space-y-6" data-aos="fade-up">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
                                 <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">Pilih Tanggal</h2>
                                <p className="text-sm text-secondary dark:text-slate-300 mb-4">Pilih tanggal untuk melihat jadwal teknisi.</p>
                                <Calendar selectedDate={scheduleDate} onDateSelect={setScheduleDate} fullyBookedDates={new Set<string>()} />
                            </div>
                            <div className="lg:col-span-2">
                                <TechnicianSchedule bookings={bookings} selectedDate={scheduleDate} technicians={technicians} />
                            </div>
                        </div>
                    </div>
                );
            case 'map': return (
                     <div key="map" className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]" data-aos="fade-up">
                        <div className="lg:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-4 space-y-3 h-full overflow-y-auto">
                            <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white p-2 sticky top-0 bg-white dark:bg-slate-800 z-10">
                                Pekerjaan Akan Datang
                            </h2>
                            {upcomingJobs.length > 0 ? upcomingJobs.map(job => (
                                <button 
                                    key={job.id} 
                                    onClick={() => setSelectedLocation({ lat: job.lat, lng: job.lng, title: job.name })}
                                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 border-l-4 ${selectedLocation?.title === job.name ? 'bg-primary-light dark:bg-slate-700 border-primary' : 'bg-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50 border-transparent'}`}
                                >
                                    <p className="font-bold text-gray-800 dark:text-white">{job.name}</p>
                                    <p className="text-sm text-secondary dark:text-slate-300">{job.service}</p>
                                    <p className="text-xs text-gray-400 mt-1 truncate">{job.address}</p>
                                    <div className="text-sm font-semibold text-primary mt-2">
                                        {new Date(job.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} - {job.time}
                                    </div>
                                </button>
                            )) : <p className="text-center py-10 text-gray-500 dark:text-gray-400">Tidak ada pekerjaan akan datang.</p>}
                        </div>
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden h-full flex flex-col">
                             {selectedLocation ? (
                                <>
                                    <div className="p-4 border-b dark:border-slate-700 flex-shrink-0">
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">Lokasi: {selectedLocation.title}</h3>
                                        <a 
                                            href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`} 
                                            target="_blank" rel="noopener noreferrer" 
                                            className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                                            Buka di Google Maps <ExternalLink size={14} />
                                        </a>
                                    </div>
                                    <iframe
                                        key={`${selectedLocation.lat}-${selectedLocation.lng}`}
                                        title="Job Location Map"
                                        className="w-full h-full border-0"
                                        src={`https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                        allowFullScreen={false}
                                        loading="lazy"
                                    ></iframe>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-6">
                                    <MapPin size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
                                    <h3 className="font-bold text-xl">Peta Lokasi Pekerjaan</h3>
                                    <p>Pilih pekerjaan dari daftar untuk melihat lokasinya di peta.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'kpi': return (
                    <div key="kpi" data-aos="fade-up" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BarChart data={kpiData.popularServices} title="5 Layanan Terlaris (Selesai)" />
                            <PieChart data={kpiData.statusDistribution} title="Distribusi Status Pesanan" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white mb-4">Performa Teknisi</h2>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {kpiData.technicianPerformance.length > 0 ? kpiData.technicianPerformance.map(tech => (
                                <div key={tech.name} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                                    <h3 className="font-bold text-xl text-gray-800 dark:text-white">{tech.name}</h3>
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Pekerjaan Selesai</p>
                                            <p className="text-2xl font-bold text-primary">{tech.completed}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Waktu Kerja</p>
                                            <p className="text-2xl font-bold text-primary">{formatDuration(tech.totalMinutes)}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">Belum ada data KPI yang bisa ditampilkan.</p>
                            )}
                        </div>
                        </div>
                    </div>
                );
            case 'technicians': return (
                    <div key="technicians" data-aos="fade-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">Manajemen Teknisi</h2>
                            <button onClick={handleOpenAddTechnician} className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                                <UserPlus size={20} />
                                Tambah Teknisi Baru
                            </button>
                        </div>
                        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl">
                           <div className="divide-y divide-gray-200 dark:divide-slate-700">
                                {technicians.map(tech => (
                                    <div key={tech.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-primary-light dark:bg-slate-700 flex items-center justify-center text-primary font-bold text-lg">
                                                {tech.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{tech.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{tech.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleOpenEditTechnician(tech)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full" title="Edit Teknisi">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => setTechnicianToDelete(tech)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full" title="Hapus Teknisi">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                             {technicians.length === 0 && <p className="text-center py-10 text-gray-500">Belum ada data teknisi.</p>}
                        </div>
                    </div>
                );
            case 'services': return (
                    <div key="services" data-aos="fade-up">
                        <div className="flex justify-between items-center mb-6">
                             <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">Manajemen Layanan</h2>
                             <button onClick={handleOpenAddService} className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                                <PlusCircle size={20} />
                                Tambah Layanan
                             </button>
                        </div>
                        <div className="space-y-8">
                            {services.map(category => (
                                <div key={category.category} className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
                                    <h3 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-4">{category.category}</h3>
                                    <div className="divide-y divide-gray-200 dark:divide-slate-700">
                                        {category.services.map(service => (
                                            <div key={service.name} className="flex items-center justify-between py-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-primary hidden sm:block">
                                                        {serviceIcons[service.icon] || serviceIcons['Wrench']}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{service.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Rp{service.price.toLocaleString('id-ID')} / {service.priceUnit}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleOpenEditService(service, category.category)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full" title="Edit Layanan">
                                                        <Edit size={18} />
                                                    </button>
                                                     <button onClick={() => setServiceToDelete({ serviceName: service.name, categoryName: category.category })} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full" title="Hapus Layanan">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'availability': return (
                    <div key="availability" data-aos="fade-up">
                        <div className="sticky top-4 lg:top-20 z-10 flex justify-end items-center mb-4 p-3 bg-light-bg/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg">
                             {showSaveSuccess && <span className="text-green-600 font-semibold mr-4">Perubahan berhasil disimpan!</span>}
                             <button onClick={handleSaveChanges} disabled={!hasUnsavedChanges} className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary-dark transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">Simpan Perubahan</button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
                            <div className="col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
                                <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">Pilih Tanggal</h2>
                                <p className="text-sm text-secondary dark:text-slate-300 mb-4">Pilih tanggal untuk mengatur slot waktu atau memblokir sepanjang hari.</p>
                                <Calendar selectedDate={selectedDate} onDateSelect={(date) => setSelectedDate(date)} fullyBookedDates={draftFullyBooked} />
                            </div>
                            <div className="col-span-1 lg:col-span-1 xl:col-span-2 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
                                <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">Atur Slot Waktu</h2>
                                {!selectedDate ? (
                                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">Pilih tanggal dari kalender untuk memulai.</div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="font-semibold text-lg text-secondary dark:text-slate-300">{selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                            <button onClick={handleToggleFullDay} className={`px-3 py-1.5 text-xs font-bold rounded-full ${draftFullyBooked.has(formatDateToKey(selectedDate)) ? 'bg-red-100 text-red-700' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200'}`}>
                                                {draftFullyBooked.has(formatDateToKey(selectedDate)) ? 'Buka Blokir Hari Ini' : 'Blokir Seharian'}
                                            </button>
                                        </div>
                                        <div className={`grid grid-cols-3 sm:grid-cols-4 gap-3 ${draftFullyBooked.has(formatDateToKey(selectedDate)) ? 'opacity-40 pointer-events-none' : ''}`}>
                                            {availableTimes.map(time => {
                                                const slotKey = `${formatDateToKey(selectedDate)}-${time}`;
                                                const isBooked = draftBookedSlots.has(slotKey);
                                                return (
                                                    <button key={time} onClick={() => handleToggleSlot(time)} className={`text-center font-semibold px-4 py-2.5 rounded-lg border-2 transition-colors duration-200 ${isBooked ? 'bg-red-500 border-red-500 text-white' : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-gray-600 hover:border-primary'}`}>
                                                        {time}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                         {draftFullyBooked.has(formatDateToKey(selectedDate)) && <p className="text-center mt-4 text-sm text-red-500 font-medium">Semua slot tidak tersedia karena hari ini diblokir.</p>}
                                    </div>
                                )}
                            </div>
                            <div className="col-span-1 lg:col-span-2 xl:col-span-3 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
                                <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">Daftar Tanggal yang Diblokir Penuh</h2>
                                <p className="text-sm text-secondary dark:text-slate-300 mb-4">Berikut adalah daftar tanggal yang telah Anda tandai sebagai penuh (tidak termasuk slot individual).</p>
                                {Array.from(draftFullyBooked).length > 0 ? (
                                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">{Array.from(draftFullyBooked).sort().map(dateKey => (
                                        <li key={dateKey} className="flex justify-between items-center bg-light-bg dark:bg-slate-700 p-3 rounded-lg">
                                            <span className="font-semibold text-gray-700 dark:text-gray-200">{parseKeyToDate(dateKey).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            <button onClick={() => handleRemoveBlockedDate(dateKey)} className="text-red-500 hover:text-red-700 text-sm font-bold">Hapus</button>
                                        </li>
                                    ))}</ul>
                                ) : (
                                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">Tidak ada tanggal yang diblokir penuh.</p>
                                )}
                            </div>
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
                        <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-poppins">Admin Viniela</span>
                    </div>
                    <nav className="flex-grow p-4 space-y-2">
                        {[
                            { name: 'Dashboard KPI', icon: BarChart2, section: 'kpi' },
                            { name: 'Daftar Booking', icon: LayoutDashboard, section: 'bookings' },
                            { name: 'Jadwal Teknisi', icon: CalendarIcon, section: 'schedule' },
                            { name: 'Peta Lokasi', icon: MapIcon, section: 'map' },
                            { name: 'Manajemen Tim', icon: Users, section: 'technicians' },
                            { name: 'Manajemen Layanan', icon: Settings, section: 'services' },
                            { name: 'Atur Ketersediaan', icon: Settings, section: 'availability' },
                        ].map(item => (
                            <button key={item.section} onClick={() => { setActiveSection(item.section as AdminSection); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${activeSection === item.section ? 'bg-primary-light text-primary dark:bg-slate-700' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'}`}>
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
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold font-poppins text-gray-800 dark:text-white">{sectionTitles[activeSection]}</h1>
                             {activeSection === 'bookings' && (
                                <button onClick={() => setIsAddBookingModalOpen(true)} className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                                    <PlusCircle size={20} />
                                    Tambah Booking
                                </button>
                            )}
                        </div>
                        {renderSection()}
                    </main>
                </div>
            </div>
            
            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden"></div>}

            <BookingFormModal 
                isOpen={isAddBookingModalOpen}
                onClose={() => setIsAddBookingModalOpen(false)}
                onSave={handleSaveNewBooking}
                services={services}
                technicians={technicians}
                availability={{
                    fullyBookedDates: Array.from(originalFullyBooked),
                    bookedSlots: Array.from(originalBookedSlots),
                }}
            />

            <ServiceFormModal 
                isOpen={isServiceModalOpen}
                onClose={() => setIsServiceModalOpen(false)}
                onSave={handleSaveService}
                serviceToEdit={serviceToEdit}
                categoryToEdit={categoryToEdit}
                allCategories={services.map(c => c.category)}
            />
            <TechnicianFormModal
                isOpen={isTechnicianModalOpen}
                onClose={() => setIsTechnicianModalOpen(false)}
                onSave={handleSaveTechnician}
                technicianToEdit={technicianToEdit}
                existingUsernames={allUsers.map(u => u.username)}
            />
            <GenericConfirmationModal
                isOpen={confirmationState.isOpen}
                onClose={closeConfirmationModal}
                onConfirm={confirmBookingUpdate}
                title={confirmationState.title}
                confirmText="Ya, Lanjutkan"
                confirmButtonClass={
                    confirmationState.value === 'Cancelled' 
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                    : 'bg-primary hover:bg-primary-dark focus:ring-primary'
                }
            >
                <p>{confirmationState.message}</p>
            </GenericConfirmationModal>
             <GenericConfirmationModal
                isOpen={!!serviceToDelete}
                onClose={() => setServiceToDelete(null)}
                onConfirm={handleDeleteService}
                title="Hapus Layanan?"
                confirmText="Ya, Hapus"
                confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
                <p>Apakah Anda yakin ingin menghapus layanan <span className="font-bold">"{serviceToDelete?.serviceName}"</span>? Tindakan ini tidak dapat diurungkan.</p>
            </GenericConfirmationModal>
            <GenericConfirmationModal
                isOpen={!!technicianToDelete}
                onClose={() => setTechnicianToDelete(null)}
                onConfirm={handleDeleteTechnician}
                title="Hapus Teknisi?"
                confirmText="Ya, Hapus"
                confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
                <p>Apakah Anda yakin ingin menghapus teknisi <span className="font-bold">"{technicianToDelete?.name}"</span>? Tindakan ini tidak dapat diurungkan.</p>
            </GenericConfirmationModal>
        </div>
    );
};

export default AdminPage;
