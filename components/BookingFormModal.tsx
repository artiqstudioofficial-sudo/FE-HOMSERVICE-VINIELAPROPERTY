import React, { useState, useEffect, useMemo } from 'react';
import { X, MapPin, Search } from 'lucide-react';
import { Service, ServiceCategory } from '../config/services';
import { User, Booking, BookingStatus, formatDateToKey, generateTimeSlots } from '../lib/storage';
import Calendar from './Calendar';

interface BookingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (booking: Omit<Booking, 'id'>) => void;
    services: ServiceCategory[];
    technicians: User[];
    availability: {
        fullyBookedDates: string[];
        bookedSlots?: string[];
    };
}

const BookingFormModal: React.FC<BookingFormModalProps> = ({ isOpen, onClose, onSave, services, technicians, availability }) => {
    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        address: '',
        service: '',
        startDate: null as Date | null,
        endDate: null as Date | null,
        time: '',
        technician: 'Belum Ditugaskan',
        status: 'Confirmed' as BookingStatus,
    });
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof typeof formData | 'location', string>>>({});
    const [addressQuery, setAddressQuery] = useState('');
    const [mapSrc, setMapSrc] = useState('https://maps.google.com/maps?q=Jakarta&z=11&output=embed');
    const [locationMessage, setLocationMessage] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);


    const allServices = useMemo(() => services.flatMap(cat => cat.services), [services]);
    const selectedServiceDetails = useMemo(() => {
        return allServices.find(s => s.name === formData.service);
    }, [formData.service, allServices]);
    const durationDays = selectedServiceDetails?.durationDays || 1;
    
    const fullyBookedDates = useMemo(() => new Set(availability.fullyBookedDates), [availability.fullyBookedDates]);
    const bookedSlots = useMemo(() => new Set(availability.bookedSlots || []), [availability.bookedSlots]);
    const availableTimes = useMemo(() => generateTimeSlots(9, 17, 12, 13, 30), []);

    useEffect(() => {
        if (isOpen) {
            // Reset form on open
            setFormData({
                name: '', whatsapp: '', address: '', service: '',
                startDate: null, endDate: null, time: '',
                technician: 'Belum Ditugaskan', status: 'Confirmed'
            });
            setLocation(null);
            setErrors({});
            setAddressQuery('');
            setMapSrc('https://maps.google.com/maps?q=Jakarta&z=11&output=embed');
            setLocationMessage('');
            setIsGeocoding(false);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setErrors(prev => ({ ...prev, [name]: undefined }));
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateSelect = (date: Date) => {
        const newEndDate = new Date(date);
        newEndDate.setDate(newEndDate.getDate() + durationDays - 1);
        setFormData({ ...formData, startDate: date, endDate: newEndDate, time: '' });
        setErrors(prev => ({ ...prev, startDate: undefined, time: undefined }));
    };

    const handleSearchAddress = async () => {
        if (!addressQuery.trim()) {
            setLocationMessage("Mohon masukkan alamat untuk dicari.");
            return;
        }

        setIsGeocoding(true);
        setLocationMessage('');
        setErrors(prev => ({ ...prev, location: undefined }));

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("Geocoding API Key is missing.");
            setLocationMessage("Konfigurasi API Key Geocoding tidak ditemukan.");
            setIsGeocoding(false);
            return;
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry.location;
                setLocation({ lat, lng });
                setMapSrc(`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`);
                setLocationMessage("Lokasi berhasil ditemukan dan ditandai di peta.");
            } else {
                setLocation(null);
                setLocationMessage("Alamat tidak ditemukan. Coba gunakan alamat yang lebih spesifik.");
            }
        } catch (error) {
            console.error('Geocoding API error:', error);
            setLocation(null);
            setLocationMessage("Terjadi kesalahan saat mencari alamat. Silakan coba lagi.");
        } finally {
            setIsGeocoding(false);
        }
    };
    
    const validate = () => {
        const newErrors: Partial<Record<keyof typeof formData | 'location', string>> = {};
        if (!formData.name.trim()) newErrors.name = "Nama wajib diisi.";
        if (!formData.whatsapp.trim()) newErrors.whatsapp = "Nomor WhatsApp wajib diisi.";
        if (!formData.address.trim()) newErrors.address = "Alamat wajib diisi.";
        if (!formData.service) newErrors.service = "Layanan wajib dipilih.";
        if (!formData.startDate) newErrors.startDate = "Tanggal wajib dipilih.";
        if (!formData.time) newErrors.time = "Waktu wajib dipilih.";
        if (!location) newErrors.location = "Mohon cari alamat dan tandai lokasi di peta.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const bookingData: Omit<Booking, 'id'> = {
                ...formData,
                startDate: formData.startDate!.toISOString(),
                endDate: formData.endDate!.toISOString(),
                lat: location!.lat,
                lng: location!.lng,
            };
            onSave(bookingData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl transform transition-all" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">Tambah Booking Manual</h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"><X size={24} /></button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Customer Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Pelanggan</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary" />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nomor WhatsApp</label>
                                <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary" />
                                {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Lengkap</label>
                             <textarea name="address" rows={2} value={formData.address} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"></textarea>
                             {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                        </div>

                        {/* Order Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Layanan</label>
                                <select name="service" value={formData.service} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary">
                                    <option value="" disabled>-- Pilih Layanan --</option>
                                    {services.map(category => (
                                        <optgroup key={category.category} label={category.category}>
                                            {category.services.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                                {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teknisi</label>
                                <select name="technician" value={formData.technician} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary">
                                    <option>Belum Ditugaskan</option>
                                    {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status Awal</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary">
                                    {['Confirmed', 'On Site', 'In Progress', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Schedule */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                             <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Jadwal</label>
                                <Calendar selectedDate={formData.startDate} onDateSelect={handleDateSelect} fullyBookedDates={fullyBookedDates} />
                                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                            </div>
                             {formData.startDate ? (
                                 <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Waktu Mulai</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {availableTimes.map(time => {
                                            const slotKey = `${formatDateToKey(formData.startDate!)}-${time}`;
                                            const isBooked = bookedSlots.has(slotKey);
                                            return (
                                                 <button type="button" key={time} onClick={() => setFormData({...formData, time})} disabled={isBooked} className={`p-2 rounded-md text-sm font-semibold border-2 transition-colors ${formData.time === time ? 'bg-primary text-white border-primary' : 'bg-transparent border-gray-300 dark:border-slate-600'} ${isBooked ? 'bg-gray-200 dark:bg-slate-600 text-gray-400 dark:text-gray-500 line-through cursor-not-allowed' : 'hover:border-primary'}`}>
                                                    {time}
                                                </button>
                                            )
                                        })}
                                    </div>
                                     {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Waktu Mulai</label>
                                    <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                        <p className="text-sm text-gray-500">Pilih tanggal dahulu</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Map */}
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cari & Tandai Lokasi di Peta</label>
                             <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="text"
                                    value={addressQuery}
                                    onChange={(e) => setAddressQuery(e.target.value)}
                                    placeholder="Contoh: Monas, Jakarta Pusat"
                                    className="block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                                />
                                <button type="button" onClick={handleSearchAddress} disabled={isGeocoding} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark disabled:bg-gray-400">
                                    {isGeocoding ? (
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : <Search size={16} />}
                                    {isGeocoding ? 'Mencari...' : 'Cari'}
                                </button>
                            </div>
                            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                            {locationMessage && <p className={`text-xs mt-2 ${location ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{locationMessage}</p>}
                            <div className="mt-2 h-64 w-full rounded-lg overflow-hidden border dark:border-slate-600">
                                 <iframe
                                    key={mapSrc}
                                    title="Booking Location Picker"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    src={mapSrc}
                                    allowFullScreen={false}
                                    loading="lazy"
                                ></iframe>
                            </div>
                        </div>

                    </div>

                    <div className="p-6 bg-light-bg dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 rounded-b-2xl flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-gray-200 font-bold px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Batal</button>
                        <button type="submit" className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary-dark">Simpan Booking</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingFormModal;
