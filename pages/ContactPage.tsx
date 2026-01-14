import { Edit3, Info, Navigation, Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Calendar from '../components/Calendar';
import ConfirmationModal from '../components/ConfirmationModal';

import { Service } from '../config/services';
import { useNotification } from '../contexts/NotificationContext';
import { fetchServicesFromApi, formatDateForApi } from '../lib/api/admin';
import { simulateNotification } from '../lib/notifications';
import {
  Booking,
  formatDateToKey,
  generateTimeSlots,
  getAvailability,
  saveAvailability,
} from '../lib/storage';

/* -------------------------------------------------------------------------- */
/*                          TIPE GROUPING KATEGORI LOCAL                      */
/* -------------------------------------------------------------------------- */

type ServiceCategoryGroup = {
  category: string;
  services: Service[];
};

/* -------------------------------------------------------------------------- */
/*                                   HERO                                     */
/* -------------------------------------------------------------------------- */

const ContactHero: React.FC = () => (
  <div className="relative bg-dark-bg">
    <div className="absolute inset-0">
      <img
        loading="lazy"
        src="https://images.unsplash.com/photo-1587560699334-cc426240169f?q=80&w=2070&auto=format&fit=crop"
        alt="Pesan Layanan"
        className="w-full h-full object-cover opacity-30 dark:opacity-40"
      />
    </div>
    <div className="relative container mx-auto px-6 py-32 text-center text-white">
      <h1 className="text-4xl md:text-5xl font-bold font-poppins leading-tight" data-aos="fade-up">
        Pesan Layanan Profesional Dengan Mudah
      </h1>
      <p
        className="text-lg max-w-2xl mx-auto text-gray-300 mt-4"
        data-aos="fade-up"
        data-aos-delay="100"
      >
        Hanya beberapa langkah untuk menjadwalkan teknisi ahli kami. Isi formulir di bawah ini dan
        biarkan kami yang mengurus sisanya.
      </p>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                             PROGRESS INDICATOR                             */
/* -------------------------------------------------------------------------- */

const ProgressIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = ['Info Kontak', 'Layanan', 'Jadwal', 'Konfirmasi'];
  return (
    <div className="flex items-start justify-center mb-10 px-4" aria-label="Progress">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = currentStep > stepNumber;
        const isCurrent = currentStep === stepNumber;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center text-center w-20">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-primary border-primary text-white'
                    : isCurrent
                    ? 'border-primary text-primary'
                    : 'border-gray-300 dark:border-gray-600 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className={`font-bold ${isCurrent ? 'text-primary' : 'text-gray-400'}`}>
                    {stepNumber}
                  </span>
                )}
              </div>
              <p
                className={`mt-2 text-xs font-semibold break-words ${
                  isCurrent || isCompleted ? 'text-gray-800 dark:text-white' : 'text-gray-400'
                }`}
              >
                {step}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mt-5 transition-colors duration-300 ${
                  isCompleted ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              ></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                      GOOGLE MAPS SCRIPT LOADER (FIX)                        */
/* -------------------------------------------------------------------------- */

declare global {
  interface Window {
    google?: any;
  }
}

function loadGoogleMapsJs(apiKey: string) {
  // sudah loaded?
  if (window.google?.maps?.Geocoder) return Promise.resolve(true);

  // sudah pernah inject script?
  const existing = document.querySelector<HTMLScriptElement>('script[data-gmaps="1"]');
  if (existing) {
    // tunggu sampai siap
    return new Promise<boolean>((resolve) => {
      const t = setInterval(() => {
        if (window.google?.maps?.Geocoder) {
          clearInterval(t);
          resolve(true);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(t);
        resolve(!!window.google?.maps?.Geocoder);
      }, 12000);
    });
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.gmaps = '1';

    script.onload = () => resolve(!!window.google?.maps?.Geocoder);
    script.onerror = () => resolve(false);

    document.head.appendChild(script);
  });
}

/* -------------------------------------------------------------------------- */
/*                             CONTACT FORM SECTION                           */
/* -------------------------------------------------------------------------- */

const ContactFormSection: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialServiceParam = searchParams.get('service') || '';

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    address: '',
    service: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    time: '',
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showLocationHint, setShowLocationHint] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  const [addressQuery, setAddressQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof formData, string>> & {
      location?: string;
      startDate?: string;
    }
  >({});

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addNotification } = useNotification();

  // AVAILABILITY (API)
  const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set());
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState<boolean>(false);

  // Layanan dari API
  const [allServicesData, setAllServicesData] = useState<ServiceCategoryGroup[]>([]);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [serviceLoading, setServiceLoading] = useState<boolean>(false);

  // ====== FIX: pastikan Google Maps JS ke-load (pakai key yang kamu minta) ======
  const GOOGLE_KEY = 'AIzaSyC7j3bV-cPjjNceAzN4g0Oh4-6wU7VroLM';
  const [gmapsReady, setGmapsReady] = useState(false);
  const [gmapsLoadError, setGmapsLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = await loadGoogleMapsJs(GOOGLE_KEY);
      if (!alive) return;
      if (ok) {
        setGmapsReady(true);
        setGmapsLoadError(null);
      } else {
        setGmapsReady(false);
        setGmapsLoadError(
          'Google Maps JS gagal dimuat. Cek internet, adblock, atau API key restriction.',
        );
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                           LOAD SERVICES FROM API                           */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const loadServices = async () => {
      try {
        setServiceLoading(true);
        setServiceError(null);

        const servicesFromApi = await fetchServicesFromApi();

        const byCategory: Record<string, Service[]> = {};
        servicesFromApi.forEach((service) => {
          const categoryName = service.category || 'Lainnya';
          if (!byCategory[categoryName]) byCategory[categoryName] = [];
          byCategory[categoryName].push(service);
        });

        const categories: ServiceCategoryGroup[] = Object.entries(byCategory).map(
          ([category, services]) => ({ category, services }),
        );

        setAllServicesData(categories);

        if (initialServiceParam) {
          const matchByName = servicesFromApi.find(
            (s) => s.name.toLowerCase() === initialServiceParam.toLowerCase().trim(),
          );

          if (matchByName) {
            setFormData((prev) => ({
              ...prev,
              service: String(matchByName.id),
            }));
          }
        }
      } catch (err: any) {
        console.error('Gagal memuat layanan dari API:', err);
        setServiceError(
          err?.message || 'Gagal memuat data layanan dari server. Silakan coba beberapa saat lagi.',
        );
        setAllServicesData([]);
      } finally {
        setServiceLoading(false);
      }
    };

    loadServices();
  }, [initialServiceParam]);

  const allServices = useMemo(
    () => allServicesData.flatMap((cat) => cat.services),
    [allServicesData],
  );

  const selectedServiceDetails = useMemo(() => {
    const id = Number(formData.service);
    if (!id) return undefined;
    return allServices.find((s) => Number(s.id) === id);
  }, [formData.service, allServices]);

  const durationDays = (selectedServiceDetails as any)?.durationDays || 1;

  /* -------------------------------------------------------------------------- */
  /*                           LOAD AVAILABILITY (API)                          */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setAvailabilityLoading(true);
        setAvailabilityError(null);

        const availability = await getAvailability();

        if (!mounted) return;

        const fully = Array.isArray(availability.fullyBookedDates)
          ? availability.fullyBookedDates
          : [];
        const slots = Array.isArray(availability.bookedSlots) ? availability.bookedSlots : [];

        setFullyBookedDates(new Set(fully));
        setBookedSlots(new Set(slots));
      } catch (err: any) {
        console.error('Gagal load availability:', err);
        if (!mounted) return;
        setAvailabilityError(err?.message || 'Gagal memuat availability');
        setFullyBookedDates(new Set());
        setBookedSlots(new Set());
      } finally {
        if (mounted) setAvailabilityLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const availableTimes = useMemo(() => generateTimeSlots(9, 17, 12, 13, 30), []);

  const handleDateSelect = (date: Date) => {
    setScheduleError('');
    const newEndDate = new Date(date);
    newEndDate.setDate(newEndDate.getDate() + durationDays - 1);

    for (let d = new Date(date); d <= newEndDate; d.setDate(d.getDate() + 1)) {
      if (fullyBookedDates.has(formatDateToKey(d))) {
        setScheduleError(
          `Rentang tanggal yang dipilih (${date.toLocaleDateString(
            'id-ID',
          )} - ${newEndDate.toLocaleDateString(
            'id-ID',
          )}) tidak tersedia karena salah satu hari telah penuh.`,
        );
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      startDate: date,
      endDate: newEndDate,
      time: '',
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUseCurrentLocation = () => {
    setIsFetchingLocation(true);
    setLocationError('');
    setLocationMessage('');
    setShowLocationHint(true);
    setErrors((prev) => ({ ...prev, location: undefined }));

    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung oleh browser ini.');
      setIsFetchingLocation(false);
      setShowLocationHint(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setLocationMessage('Lokasi GPS berhasil ditemukan.');
        setIsFetchingLocation(false);
        setShowLocationHint(false);
      },
      (error) => {
        let message = 'Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Anda menolak izin lokasi. Mohon izinkan akses untuk melanjutkan.';
        }
        setLocationError(message);
        setIsFetchingLocation(false);
        setShowLocationHint(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                     FIX: MANUAL SEARCH VIA google.maps.Geocoder            */
  /* -------------------------------------------------------------------------- */
  const handleSearchAddress = async () => {
    const q = addressQuery.trim();
    if (!q) {
      setLocationMessage('Mohon masukkan alamat untuk dicari.');
      return;
    }

    setIsGeocoding(true);
    setLocationError('');
    setLocationMessage('');
    setErrors((prev) => ({ ...prev, location: undefined }));

    try {
      // Pastikan maps siap (script ke-load)
      if (!gmapsReady) {
        const ok = await loadGoogleMapsJs(GOOGLE_KEY);
        setGmapsReady(ok);
        if (!ok) {
          throw new Error('Google Maps JS belum siap. Cek adblock / restriction / network.');
        }
      }

      const geocoder = new window.google.maps.Geocoder();

      const result = await new Promise<any>((resolve, reject) => {
        geocoder.geocode(
          {
            address: q,
            region: 'ID',
          },
          (results: any, status: string) => {
            if (status === 'OK' && results?.length) resolve(results[0]);
            else {
              // status penting: REQUEST_DENIED, ZERO_RESULTS, OVER_QUERY_LIMIT, INVALID_REQUEST
              reject(new Error(`Geocoding gagal: ${status}`));
            }
          },
        );
      });

      const loc = result.geometry.location;
      const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
      const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new Error('Koordinat tidak valid dari Google Maps.');
      }

      setLocation({ lat, lng });
      setLocationMessage(`Lokasi berhasil ditemukan: ${result.formatted_address || q}`);
    } catch (err: any) {
      console.error('Manual geocode error:', err);

      // tampilkan sebab paling umum
      const msg = String(err?.message || '');
      if (msg.includes('REQUEST_DENIED')) {
        setLocationMessage(
          'REQUEST_DENIED: API key kemungkinan belum enable Geocoding API / Maps JavaScript API, billing belum aktif, atau domain belum di-allow di key restriction.',
        );
      } else if (msg.includes('ZERO_RESULTS')) {
        setLocationMessage(
          "Alamat tidak ditemukan (ZERO_RESULTS). Coba tulis lebih spesifik, misal: 'Monas, Jakarta Pusat'.",
        );
      } else if (msg.includes('OVER_QUERY_LIMIT')) {
        setLocationMessage('Kuota geocoding habis (OVER_QUERY_LIMIT). Coba lagi nanti.');
      } else {
        setLocationMessage(
          err?.message || 'Terjadi kesalahan saat mencari alamat. Silakan coba lagi.',
        );
      }

      setLocation(null);
    } finally {
      setIsGeocoding(false);
    }
  };

  const validateField = (name: keyof typeof formData, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Nama wajib diisi.';
        break;
      case 'whatsapp':
        if (!value.trim()) return 'Nomor WhatsApp wajib diisi.';
        if (!/^(08|\+628)\d{8,12}$/.test(value))
          return 'Format nomor WhatsApp tidak valid (contoh: 08123456789).';
        break;
      case 'address':
        if (!value.trim()) return 'Alamat wajib diisi.';
        break;
    }
    return undefined;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as {
      name: keyof typeof formData;
      value: string;
    };
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> & {
      location?: string;
    } = {};
    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;

    const whatsappError = validateField('whatsapp', formData.whatsapp);
    if (whatsappError) newErrors.whatsapp = whatsappError;

    const addressError = validateField('address', formData.address);
    if (addressError) newErrors.address = addressError;

    if (!location) newErrors.location = 'Mohon tandai lokasi Anda.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.service) newErrors.service = 'Pilih layanan.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.startDate) newErrors.startDate = 'Pilih tanggal.';
    if (!formData.time) newErrors.time = 'Pilih waktu.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    if (step === 1) isValid = validateStep1();
    if (step === 2) isValid = validateStep2();
    if (step === 3) isValid = validateStep3();

    if (isValid) setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setErrors({});
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      if (!validateStep1()) setStep(1);
      else if (!validateStep2()) setStep(2);
      else if (!validateStep3()) setStep(3);
      return;
    }

    if (!location || !formData.startDate) {
      addNotification('Lokasi atau tanggal belum terisi. Silakan lengkapi data.', 'error');
      return;
    }

    const serviceId = Number(formData.service);
    if (!serviceId || Number.isNaN(serviceId)) {
      addNotification('Layanan tidak valid. Silakan pilih ulang layanan.', 'error');
      setStep(2);
      return;
    }

    if (availabilityLoading) {
      addNotification('Sedang memuat slot jadwal. Coba lagi sebentar.', 'info');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        fullname: formData.name,
        whatsapp: formData.whatsapp,
        service: serviceId,
        address: formData.address,
        lat: location.lat,
        lng: location.lng,
        schedule_date: formatDateForApi(formData.startDate),
        schedule_time: formData.time,
      };

      const res = await fetch('https://api-homeservice.viniela.id/api/v1/user/store-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      let resJson: any = null;
      try {
        resJson = await res.json();
      } catch {
        // ignore
      }

      if (!res.ok) {
        const msg = resJson?.message || `Gagal menyimpan booking di server (status ${res.status}).`;
        throw new Error(msg);
      }

      const serviceNameForDisplay = selectedServiceDetails?.name || initialServiceParam || '';

      const newBooking: Booking = {
        id: Date.now(),
        name: formData.name,
        whatsapp: formData.whatsapp,
        address: formData.address,
        service: serviceNameForDisplay || String(serviceId),
        startDate: formData.startDate.toISOString(),
        endDate: (formData.endDate ?? formData.startDate).toISOString(),
        time: formData.time,
        status: 'Confirmed',
        technician: 'Belum Ditugaskan',
        lat: location.lat,
        lng: location.lng,
      };

      const currentAvailability = await getAvailability();

      const currentBookedSlots = Array.isArray(currentAvailability.bookedSlots)
        ? currentAvailability.bookedSlots
        : [];
      const currentFully = Array.isArray(currentAvailability.fullyBookedDates)
        ? currentAvailability.fullyBookedDates
        : [];

      const slotKey = `${formatDateToKey(formData.startDate)}-${formData.time}`;

      const newBookedSlots = Array.from(new Set([...currentBookedSlots, slotKey]));
      let newFullyBookedDates = [...currentFully];

      if (durationDays > 1 && formData.endDate) {
        const datesToBlock = new Set(newFullyBookedDates);
        for (
          let d = new Date(formData.startDate);
          d <= formData.endDate;
          d.setDate(d.getDate() + 1)
        ) {
          datesToBlock.add(formatDateToKey(d));
        }
        newFullyBookedDates = Array.from(datesToBlock);
      }

      await saveAvailability({
        fullyBookedDates: newFullyBookedDates,
        bookedSlots: newBookedSlots,
      });

      setFullyBookedDates(new Set(newFullyBookedDates));
      setBookedSlots(new Set(newBookedSlots));

      const uiMessage = simulateNotification('order_created', newBooking);
      addNotification(uiMessage, 'success');

      setIsModalOpen(true);
    } catch (err: any) {
      console.error('Gagal menyimpan booking:', err);
      addNotification(
        `Gagal menyimpan booking: ${err?.message || 'Terjadi kesalahan tidak diketahui.'}`,
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: '',
      whatsapp: '',
      address: '',
      service: '',
      startDate: null,
      endDate: null,
      time: '',
    });
    setLocation(null);
    setLocationError('');
    setErrors({});
    setStep(1);
    navigate('/services');
  };

  const scheduleString = useMemo(() => {
    if (!formData.startDate) return '';
    const start = formData.startDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (!formData.endDate || formData.startDate.getTime() === formData.endDate.getTime()) {
      return start;
    }
    const end = formData.endDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return `${start} - ${end}`;
  }, [formData.startDate, formData.endDate]);

  const serviceNameForDisplay = selectedServiceDetails?.name || initialServiceParam || '';

  return (
    <section className="py-24 bg-light-bg dark:bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl md:text-3xl font-bold font-poppins text-gray-800 dark:text-white mb-6 text-center">
              Formulir Pemesanan Layanan
            </h2>

            <ProgressIndicator currentStep={step} />

            {serviceError && (
              <div className="mb-4 text-center text-sm text-red-500">{serviceError}</div>
            )}

            {availabilityError && (
              <div className="mb-4 text-center text-sm text-red-500">{availabilityError}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="min-h-[420px] py-4">
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                          required
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <label
                          htmlFor="whatsapp"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Nomor WhatsApp
                        </label>
                        <input
                          type="tel"
                          name="whatsapp"
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                          placeholder="08123456789"
                          required
                        />
                        {errors.whatsapp && (
                          <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Alamat Lengkap
                      </label>
                      <textarea
                        name="address"
                        id="address"
                        rows={3}
                        value={formData.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                        placeholder="Contoh: Jl. Mawar No. 10, RT 01/RW 02, Kelurahan, Kecamatan, Kota."
                        required
                      ></textarea>
                      {errors.address && (
                        <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Penanda Lokasi (Wajib)
                      </label>

                      {/* GPS */}
                      <div className="p-4 border dark:border-slate-700 rounded-lg">
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          Opsi 1: Gunakan Lokasi GPS
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Paling akurat jika Anda memesan dari lokasi pengerjaan.
                        </p>

                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={isFetchingLocation || isGeocoding}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-slate-800 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                        >
                          {isFetchingLocation ? (
                            <svg
                              className="animate-spin h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          ) : (
                            <Navigation size={16} />
                          )}

                          <span>
                            {isFetchingLocation ? 'Mencari GPS...' : 'Gunakan Lokasi Saat Ini'}
                          </span>
                        </button>

                        {showLocationHint && (
                          <p className="text-blue-600 dark:text-blue-400 text-xs mt-2 flex items-center gap-1.5">
                            <Info size={14} />
                            Mohon izinkan akses lokasi pada prompt browser Anda.
                          </p>
                        )}

                        {locationError && (
                          <p className="text-red-500 text-xs mt-2">{locationError}</p>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="flex items-center my-4">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm font-semibold">
                          ATAU
                        </span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                      </div>

                      {/* Search address */}
                      <div className="p-4 border dark:border-slate-700 rounded-lg">
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          Opsi 2: Cari Alamat Manual
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Gunakan jika memesan untuk lokasi lain (misal: rumah orang tua).
                        </p>

                        {/* status maps loader */}
                        {!gmapsReady && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                            Memuat Google Maps...
                          </p>
                        )}
                        {gmapsLoadError && (
                          <p className="text-xs text-red-500 mb-2">{gmapsLoadError}</p>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={addressQuery}
                            onChange={(e) => setAddressQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSearchAddress();
                              }
                            }}
                            placeholder="Contoh: Monas, Jakarta Pusat"
                            className="block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={handleSearchAddress}
                            disabled={isGeocoding || isFetchingLocation}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark disabled:bg-gray-400"
                          >
                            {isGeocoding ? (
                              <svg
                                className="animate-spin h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            ) : (
                              <Search size={16} />
                            )}
                            <span>{isGeocoding ? 'Mencari...' : 'Cari'}</span>
                          </button>
                        </div>

                        {locationMessage && (
                          <p
                            className={`text-xs mt-2 ${
                              location ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                            }`}
                          >
                            {locationMessage}
                          </p>
                        )}
                      </div>

                      {errors.location && !locationError && !locationMessage && (
                        <p className="text-red-500 text-xs mt-2">{errors.location}</p>
                      )}

                      {location && (
                        <div className="mt-4 rounded-lg overflow-hidden h-48 shadow-md border dark:border-slate-600">
                          <iframe
                            title="Location Preview"
                            key={`${location.lat}-${location.lng}`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen={false}
                            src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed`}
                          ></iframe>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <label
                        htmlFor="service"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Pilih Layanan
                      </label>

                      <select
                        name="service"
                        id="service"
                        value={formData.service}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary text-base p-3"
                        required
                        disabled={serviceLoading || !!serviceError}
                      >
                        <option value="" disabled>
                          -- Pilih salah satu --
                        </option>

                        {allServicesData.map((category) => (
                          <optgroup key={category.category} label={category.category}>
                            {category.services.map((service) => (
                              <option key={service.id ?? service.name} value={String(service.id)}>
                                {service.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      {errors.service && (
                        <p className="text-red-500 text-xs mt-1">{errors.service}</p>
                      )}

                      {selectedServiceDetails && (
                        <div className="mt-4 p-3 bg-primary-light dark:bg-slate-700/50 rounded-lg text-sm text-primary-dark dark:text-teal-300">
                          Estimasi durasi pengerjaan: <strong>{durationDays} hari</strong>. Kalender
                          akan otomatis memilih rentang tanggal yang dibutuhkan.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pilih Tanggal Mulai
                      </label>

                      <Calendar
                        selectedDate={formData.startDate}
                        onDateSelect={handleDateSelect}
                        fullyBookedDates={fullyBookedDates}
                      />

                      {errors.startDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
                      )}
                      {scheduleError && (
                        <p className="text-red-500 text-xs mt-1">{scheduleError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pilih Waktu Mulai
                      </label>

                      {!formData.startDate ? (
                        <div className="text-center p-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg h-full flex items-center justify-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Pilih tanggal untuk melihat slot waktu.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-primary-light dark:bg-slate-700/50 rounded-lg text-sm text-primary-dark dark:text-teal-300 mb-4">
                            <p>
                              <strong>Tanggal Terpilih:</strong>
                            </p>
                            <p>{scheduleString}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {availableTimes.map((time) => {
                              const slotKey = `${formatDateToKey(formData.startDate!)}-${time}`;
                              const isBooked = bookedSlots.has(slotKey);

                              return (
                                <button
                                  type="button"
                                  key={time}
                                  onClick={() => setFormData((prev) => ({ ...prev, time }))}
                                  disabled={isBooked}
                                  className={`p-2 rounded-md text-sm font-semibold border-2 transition-colors ${
                                    formData.time === time
                                      ? 'bg-primary text-white border-primary'
                                      : 'bg-transparent border-gray-300 dark:border-slate-600'
                                  } ${
                                    isBooked
                                      ? 'bg-gray-200 dark:bg-slate-600 text-gray-400 dark:text-gray-500 line-through cursor-not-allowed'
                                      : 'hover:border-primary'
                                  }`}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                    </div>
                  </div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      Konfirmasi Pesanan Anda
                    </h3>

                    <div className="bg-light-bg dark:bg-slate-700/50 p-4 rounded-lg space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Info Kontak</p>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {formData.name}
                          </p>
                          <p className="text-gray-600 dark:text-slate-300">{formData.whatsapp}</p>
                          <p className="text-gray-600 dark:text-slate-300 max-w-xs">
                            {formData.address}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-primary hover:underline text-sm font-semibold flex items-center gap-1"
                        >
                          <Edit3 size={12} /> Ubah
                        </button>
                      </div>

                      <div className="flex justify-between items-center border-t border-gray-200 dark:border-slate-600 pt-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Layanan</p>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {serviceNameForDisplay || '-'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-primary hover:underline text-sm font-semibold flex items-center gap-1"
                        >
                          <Edit3 size={12} /> Ubah
                        </button>
                      </div>

                      <div className="flex justify-between items-center border-t border-gray-200 dark:border-slate-600 pt-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Jadwal</p>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {scheduleString} - {formData.time}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="text-primary hover:underline text-sm font-semibold flex items-center gap-1"
                        >
                          <Edit3 size={12} /> Ubah
                        </button>
                      </div>
                    </div>

                    {location && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Pratinjau Lokasi
                        </p>
                        <div className="rounded-lg overflow-hidden h-32 shadow-md border dark:border-slate-600">
                          <iframe
                            title="Location Preview"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen={false}
                            src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed`}
                          ></iframe>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FOOTER BUTTONS */}
              <div className="mt-8 pt-6 border-t dark:border-slate-700 flex justify-between items-center">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-gray-200 font-bold px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                  >
                    Kembali
                  </button>
                ) : (
                  <div />
                )}

                {step < 4 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Lanjut
                  </button>
                )}

                {step === 4 && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-primary text-white font-bold px-8 py-3 rounded-lg hover:bg-primary-dark transition-all duration-300 disabled:bg-gray-400 flex items-center justify-center"
                  >
                    {isLoading && (
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    {isLoading ? 'Mengirim...' : 'Kirim Pesanan'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        bookingDetails={{
          name: formData.name,
          service: serviceNameForDisplay || '-',
          schedule: `${scheduleString} pukul ${formData.time}`,
        }}
      />
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*                               MAIN PAGE EXPORT                             */
/* -------------------------------------------------------------------------- */

const ContactPage: React.FC = () => {
  return (
    <>
      <ContactHero />
      <ContactFormSection />
    </>
  );
};

export default ContactPage;
