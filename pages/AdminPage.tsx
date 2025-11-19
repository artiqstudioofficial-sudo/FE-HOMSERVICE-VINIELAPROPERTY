// pages/AdminPage.tsx
import {
  BarChart2,
  Calendar as CalendarIcon,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  MapPin,
  PlusCircle,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BookingFormModal from '../components/BookingFormModal';
import Calendar from '../components/Calendar';
import GenericConfirmationModal from '../components/GenericConfirmationModal';
import ServiceFormModal from '../components/ServiceFormModal';

import { Service, ServiceCategory, serviceIcons } from '../config/services';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  AdminBooking,
  ApiTechScheduleByUser,
  ServiceMasterCategory,
  fetchBookingsFromApi,
  fetchRolesFromApi,
  fetchServiceCategoriesFromApi,
  fetchServicesFromApi,
  fetchTechScheduleFromApi,
  fetchUsersFromApi,
  mapApiStatusToBookingStatus,
  updateBookingStatusOnServer,
} from '../lib/api';
import { simulateNotification } from '../lib/notifications';
import {
  BookingStatus,
  formatDateToKey,
  generateTimeSlots,
  getAvailability,
  getBookings,
  getServices,
  parseKeyToDate,
  saveAvailability,
  saveBookings,
  saveServices,
} from '../lib/storage';

// komponen pecahan
import AdminBookingsSection from '@/components/admin/booking/AdminBookingSection';
import BarChart from '../components/admin/charts/BarChart';
import PieChart from '../components/admin/charts/PieChart';
import TechnicianFormModal from '../components/admin/modals/TechnicianFormModal';
import TechnicianSchedule from '../components/admin/schedule/TechnicianSchedule';

type AdminSection =
  | 'kpi'
  | 'bookings'
  | 'schedule'
  | 'map'
  | 'technicians'
  | 'services'
  | 'availability';

const statuses: BookingStatus[] = ['Confirmed', 'On Site', 'In Progress', 'Completed', 'Cancelled'];

const formatDuration = (minutes: number): string => {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} jam`;
  return `${hours} jam ${remainingMinutes} mnt`;
};

const AdminPage: React.FC = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceMasterCategory[]>([]);
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
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    title: string;
  } | null>(null);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<{
    serviceName: string;
    categoryName: string;
  } | null>(null);

  const [isTechnicianModalOpen, setIsTechnicianModalOpen] = useState(false);
  const [technicianToEdit, setTechnicianToEdit] = useState<any | null>(null);
  const [technicianToDelete, setTechnicianToDelete] = useState<any | null>(null);
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
    message: '',
  });

  const [techSchedules, setTechSchedules] = useState<ApiTechScheduleByUser[]>([]);
  const [isLoadingTechSchedule, setIsLoadingTechSchedule] = useState(false);
  const [techScheduleError, setTechScheduleError] = useState<string | null>(null);

  const ITEMS_PER_PAGE_BOOKING = ITEMS_PER_PAGE;
  const [statusDraft, setStatusDraft] = useState<Record<number, BookingStatus>>({});

  const availableTimes = useMemo(() => generateTimeSlots(9, 17, 12, 13, 30), []);
  const technicians = useMemo(() => allUsers.filter((u) => u.role === 'technician'), [allUsers]);

  const servicesMap = useMemo(() => {
    const map = new Map<string, Service>();
    services.forEach((category) => {
      category.services.forEach((service) => {
        map.set(service.name, service);
      });
    });
    return map;
  }, [services]);

  const loadData = useCallback(async () => {
    try {
      const bookingsFromApi = await fetchBookingsFromApi();
      setBookings(bookingsFromApi);
      saveBookings(bookingsFromApi);
    } catch (err) {
      console.error('Gagal memuat data booking dari server, fallback ke localStorage', err);
      const localBookings = getBookings() as AdminBooking[];
      setBookings(localBookings);
    }

    try {
      const servicesFromApi = await fetchServicesFromApi();
      setServices(servicesFromApi);
      saveServices(servicesFromApi);
    } catch (err) {
      console.error('Gagal memuat data layanan dari server, fallback ke local config', err);
      const localServices = getServices();
      setServices(localServices);
    }

    try {
      const usersFromApi = await fetchUsersFromApi();
      setAllUsers(usersFromApi);
    } catch (err) {
      console.error('Gagal memuat data user dari server', err);
      setAllUsers([]);
    }

    try {
      const rolesFromApi = await fetchRolesFromApi();
      setRoles(rolesFromApi);
    } catch (err) {
      console.error('Gagal memuat data role dari server', err);
      setRoles([]);
    }

    try {
      const categoriesFromApi = await fetchServiceCategoriesFromApi();
      setServiceCategories(categoriesFromApi);
    } catch (err) {
      console.error('Gagal memuat master kategori layanan dari server', err);
      setServiceCategories([]);
    }
  }, []);

  const loadTechSchedule = useCallback(async (date: Date) => {
    try {
      setIsLoadingTechSchedule(true);
      setTechScheduleError(null);

      const data = await fetchTechScheduleFromApi(date);
      setTechSchedules(data);
    } catch (err: any) {
      console.error('Error loadTechSchedule:', err);
      setTechSchedules([]);
      setTechScheduleError(err?.message || 'Gagal memuat jadwal teknisi');
    } finally {
      setIsLoadingTechSchedule(false);
    }
  }, []);

  // init
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

  // sync statusDraft
  useEffect(() => {
    setStatusDraft((prev) => {
      const next = { ...prev };
      bookings.forEach((b) => {
        if (!next[b.id]) {
          next[b.id] = b.status;
        }
      });
      return next;
    });
  }, [bookings]);

  // detect ada perubahan availability
  useEffect(() => {
    const fullyBookedChanged =
      JSON.stringify(Array.from(originalFullyBooked).sort()) !==
      JSON.stringify(Array.from(draftFullyBooked).sort());
    const bookedSlotsChanged =
      JSON.stringify(Array.from(originalBookedSlots).sort()) !==
      JSON.stringify(Array.from(draftBookedSlots).sort());
    setHasUnsavedChanges(fullyBookedChanged || bookedSlotsChanged);
  }, [draftFullyBooked, draftBookedSlots, originalFullyBooked, originalBookedSlots]);

  // load jadwal ketika buka tab schedule atau ganti tanggal
  useEffect(() => {
    if (activeSection === 'schedule' && scheduleDate) {
      loadTechSchedule(scheduleDate);
    }
  }, [activeSection, scheduleDate, loadTechSchedule]);

  // filter bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((booking) => {
        const searchTermMatch = booking.name.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'all' || booking.status === statusFilter;
        const technicianMatch =
          technicianFilter === 'all' || booking.technician === technicianFilter;
        return searchTermMatch && statusMatch && technicianMatch;
      })
      .sort((a, b) => b.id - a.id);
  }, [bookings, searchTerm, statusFilter, technicianFilter]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE_BOOKING;
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE_BOOKING);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE_BOOKING);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, technicianFilter]);

  const upcomingJobs = useMemo(
    () =>
      bookings
        .filter((b) => b.status === 'Confirmed' || b.status === 'On Site')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [bookings],
  );

  useEffect(() => {
    if (activeSection === 'map' && upcomingJobs.length > 0 && !selectedLocation) {
      setSelectedLocation({
        lat: upcomingJobs[0].lat,
        lng: upcomingJobs[0].lng,
        title: upcomingJobs[0].name,
      });
    } else if (activeSection !== 'map') {
      setSelectedLocation(null);
    }
  }, [activeSection, upcomingJobs, selectedLocation]);

  // ==== HANDLER BOOKING / STATUS ====
  const handleBookingUpdate = (id: number, field: 'technician', value: string) => {
    if (field === 'technician') {
      const originalBooking = bookings.find((b) => b.id === id);

      if (
        originalBooking &&
        originalBooking.technician === 'Belum Ditugaskan' &&
        value !== 'Belum Ditugaskan'
      ) {
        const uiMessage = simulateNotification('technician_assigned', {
          ...originalBooking,
          technician: value,
        });
        addNotification(uiMessage, 'info');
      }

      const techUser = allUsers.find((u) => u.name === value);
      const updatedBookings = bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              technician: value,
              technicianUserId: value === 'Belum Ditugaskan' ? null : techUser?.id ?? null,
            }
          : b,
      );
      setBookings(updatedBookings);
      saveBookings(updatedBookings);
    }
  };

  const handleStatusSubmit = (id: number) => {
    const bookingToUpdate = bookings.find((b) => b.id === id);
    if (!bookingToUpdate) return;

    const newStatus = statusDraft[id] ?? bookingToUpdate.status;

    if (newStatus === bookingToUpdate.status) {
      addNotification('Status belum berubah, tidak ada yang perlu diupdate.', 'info');
      return;
    }

    let title = 'Ubah Status Booking?';
    let message = `Apakah Anda yakin ingin mengubah status pesanan untuk ${bookingToUpdate.name} dari "${bookingToUpdate.status}" menjadi "${newStatus}"?`;

    if (newStatus === 'Completed') {
      title = 'Selesaikan Pesanan?';
      message = `Apakah Anda yakin ingin menyelesaikan pesanan untuk ${bookingToUpdate.name}?`;
    } else if (newStatus === 'Cancelled') {
      title = 'Batalkan Pesanan?';
      message = `Apakah Anda yakin ingin membatalkan pesanan untuk ${bookingToUpdate.name}? Tindakan ini tidak dapat diurungkan.`;
    }

    setConfirmationState({
      isOpen: true,
      bookingId: id,
      field: 'status',
      value: newStatus,
      title,
      message,
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationState({
      isOpen: false,
      bookingId: null,
      field: null,
      value: null,
      title: '',
      message: '',
    });
  };

  const confirmBookingUpdate = async () => {
    const { bookingId, field, value } = confirmationState;
    if (!bookingId || !field || !value) {
      closeConfirmationModal();
      return;
    }

    if (field === 'status') {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) {
        closeConfirmationModal();
        return;
      }

      const nextStatus = value as BookingStatus;

      try {
        if (booking.formId) {
          const techUserIdFromBooking = booking.technicianUserId ?? null;
          const techUserFromList = allUsers.find((u) => u.name === booking.technician);
          const userId = techUserIdFromBooking ?? techUserFromList?.id;

          if (!userId) {
            addNotification(
              'Tidak ditemukan user_id untuk teknisi ini. Pastikan teknisi sudah dipilih di daftar user.',
              'error',
            );
            closeConfirmationModal();
            return;
          }

          await updateBookingStatusOnServer(booking.formId, nextStatus, userId);
        }

        const updatedBookings = bookings.map((b) =>
          b.id === bookingId ? { ...b, status: nextStatus } : b,
        );
        setBookings(updatedBookings);
        saveBookings(updatedBookings);

        setStatusDraft((prev) => ({
          ...prev,
          [bookingId]: nextStatus,
        }));

        addNotification(
          `Status booking untuk ${booking.name} berhasil diubah menjadi "${nextStatus}".`,
          'success',
        );
      } catch (err) {
        console.error(err);
        addNotification(
          'Gagal mengubah status di server. Silakan cek koneksi atau mapping status & coba lagi.',
          'error',
        );
      } finally {
        closeConfirmationModal();
      }

      return;
    }

    closeConfirmationModal();
  };

  // ==== HANDLER AVAILABILITY ====
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
  };

  // ==== HANDLER SERVICE ====
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
    const applyLocalUpdate = () => {
      let newServices = JSON.parse(JSON.stringify(services)) as ServiceCategory[];

      if (serviceToEdit && categoryToEdit) {
        const oldCategory = newServices.find((c) => c.category === categoryToEdit);
        if (oldCategory) {
          oldCategory.services = oldCategory.services.filter((s) => s.name !== serviceToEdit.name);
          if (oldCategory.services.length === 0) {
            newServices = newServices.filter((c) => c.category !== categoryToEdit);
          }
        }
      }

      let targetCategory = newServices.find((c) => c.category === categoryName);
      if (targetCategory) {
        const existingServiceIndex = targetCategory.services.findIndex(
          (s) => s.name === serviceData.name,
        );
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
    };

    // EDIT: lokal
    if (serviceToEdit) {
      applyLocalUpdate();
      setIsServiceModalOpen(false);
      addNotification(`Layanan "${serviceData.name}" berhasil diperbarui.`, 'success');
      return;
    }

    // CREATE: panggil API + kirim service_category_id
    (async () => {
      try {
        const anyService = serviceData as any;

        const durationMinutes =
          anyService.duration_minute ??
          (typeof serviceData.duration === 'number' ? serviceData.duration : 0);

        const durationHours =
          anyService.duration_hour ??
          (typeof serviceData.duration === 'number' ? Math.floor(serviceData.duration / 60) : 0);

        const masterCategory = serviceCategories.find((c) => c.name === categoryName);

        const payload = {
          name: serviceData.name,
          price: String(serviceData.price ?? 0),
          unit_price: serviceData.priceUnit ?? 'unit',
          point: anyService.point ?? 0,
          icon: serviceData.icon,
          service_category_id: masterCategory ? masterCategory.id : null,
          duration_minute: durationMinutes,
          duration_hour: durationHours,
          is_guarantee: anyService.is_guarantee ?? false,
        };

        const res = await fetch('http://localhost:4222/api/v1/admin/service-store', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `Gagal menyimpan layanan: ${res.status}`);
        }

        applyLocalUpdate();
        setIsServiceModalOpen(false);
        addNotification(`Layanan "${serviceData.name}" berhasil disimpan ke server.`, 'success');
      } catch (error) {
        console.error('Error saat menyimpan layanan ke server:', error);
        addNotification(
          'Gagal menyimpan layanan ke server. Silakan cek koneksi atau coba lagi.',
          'error',
        );
      }
    })();
  };

  const handleDeleteService = () => {
    if (!serviceToDelete) return;

    const { serviceName, categoryName } = serviceToDelete;
    let newServices = JSON.parse(JSON.stringify(services)) as ServiceCategory[];

    const category = newServices.find((c) => c.category === categoryName);
    if (category) {
      category.services = category.services.filter((s) => s.name !== serviceName);
      if (category.services.length === 0) {
        newServices = newServices.filter((c) => c.category !== categoryName);
      }
    }

    setServices(newServices);
    saveServices(newServices);
    setServiceToDelete(null);
    addNotification(`Layanan "${serviceName}" telah dihapus.`, 'success');
  };

  // ==== HANDLER TECHNICIAN ====
  const handleOpenAddTechnician = () => {
    setTechnicianToEdit(null);
    setIsTechnicianModalOpen(true);
  };

  const handleOpenEditTechnician = (tech: any) => {
    setTechnicianToEdit(tech);
    setIsTechnicianModalOpen(true);
  };

  const handleSaveTechnician = async (technicianData: any) => {
    const selectedRole = roles.find((r) => r.name === technicianData.role);
    if (!selectedRole) {
      addNotification('Role user tidak valid. Silakan refresh halaman.', 'error');
      return;
    }

    if (technicianToEdit) {
      const updatedUsers = allUsers.map((u) =>
        u.id === technicianToEdit.id
          ? {
              ...u,
              ...technicianData,
              password: technicianData.password || u.password,
            }
          : u,
      );
      setAllUsers(updatedUsers);
      setIsTechnicianModalOpen(false);
      addNotification(`User "${technicianData.name}" berhasil diperbarui.`, 'success');
    } else {
      try {
        const res = await fetch('http://localhost:4222/api/v1/admin/user-management-store', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            fullname: technicianData.name,
            username: technicianData.username,
            password: technicianData.password,
            role_id: selectedRole.id,
          }),
        });

        if (!res.ok) {
          throw new Error(`Gagal menyimpan user: ${res.status}`);
        }

        const json = await res.json();

        const newIdFromApi =
          (json?.data && json.data.id) ||
          json.id ||
          (allUsers.length > 0 ? Math.max(...allUsers.map((u) => u.id)) + 1 : 1);

        const newUser: any = {
          id: newIdFromApi,
          name: technicianData.name,
          username: technicianData.username,
          role: technicianData.role || selectedRole.name,
          created_at: json?.data?.created_at,
        };

        setAllUsers((prev) => [...prev, newUser]);
        setIsTechnicianModalOpen(false);
        addNotification(`User "${newUser.name}" berhasil disimpan ke server.`, 'success');
      } catch (error) {
        console.error('Error saat menyimpan user baru:', error);
        addNotification(
          'Gagal menyimpan user ke server. Silakan cek koneksi atau coba lagi.',
          'error',
        );
      }
    }
  };

  const handleDeleteTechnician = () => {
    if (!technicianToDelete) return;
    const updatedUsers = allUsers.filter((u) => u.id !== technicianToDelete.id);
    setAllUsers(updatedUsers);
    setTechnicianToDelete(null);
    addNotification(`User "${technicianToDelete.name}" telah dihapus.`, 'success');
  };

  // ==== HANDLER BOOKING BARU ====
  const handleSaveNewBooking = (
    newBookingData: Omit<AdminBooking, 'id' | 'formId' | 'applyId'>,
  ) => {
    const allBookings = getBookings() as AdminBooking[];
    const newBooking: AdminBooking = {
      ...newBookingData,
      id: allBookings.length > 0 ? Math.max(...allBookings.map((b) => b.id)) + 1 : 1,
    };

    const updatedBookings = [...allBookings, newBooking];
    saveBookings(updatedBookings);
    setBookings(updatedBookings);

    const service = servicesMap.get(newBooking.service);
    const durationDays = service?.durationDays || 1;

    const currentAvailability = getAvailability();
    const newBookedSlots = [
      ...(currentAvailability.bookedSlots || []),
      `${formatDateToKey(new Date(newBooking.startDate))}-${newBooking.time}`,
    ];
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

    setOriginalFullyBooked(new Set(newFullyBookedDates));
    setDraftFullyBooked(new Set(newFullyBookedDates));
    setOriginalBookedSlots(new Set(newBookedSlots));
    setDraftBookedSlots(new Set(newBookedSlots));

    addNotification(`Booking baru untuk ${newBooking.name} berhasil ditambahkan.`, 'success');
    setIsAddBookingModalOpen(false);
  };

  // ==== KPI DATA ====
  const kpiData = useMemo(() => {
    const techKpis: {
      [key: string]: { completed: number; totalMinutes: number };
    } = {};
    technicians.forEach((tech) => {
      techKpis[tech.name] = { completed: 0, totalMinutes: 0 };
    });
    bookings.forEach((booking) => {
      if (booking.technician !== 'Belum Ditugaskan' && booking.status === 'Completed') {
        if (!techKpis[booking.technician]) {
          techKpis[booking.technician] = {
            completed: 0,
            totalMinutes: 0,
          };
        }
        techKpis[booking.technician].completed += 1;
        techKpis[booking.technician].totalMinutes += booking.workDurationMinutes || 0;
      }
    });
    const technicianPerformance = Object.entries(techKpis).map(([name, data]) => ({
      name,
      ...data,
    }));

    const serviceCounts = bookings.reduce((acc, booking) => {
      if (booking.status === 'Completed') {
        acc[booking.service] = (acc[booking.service] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const popularServices = Object.entries(serviceCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([label, value]) => ({ label, value: value as number }));

    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<BookingStatus, number>);
    const statusDistribution = Object.entries(statusCounts).map(([label, value]) => ({
      label,
      value,
    }));

    return { technicianPerformance, popularServices, statusDistribution };
  }, [bookings, technicians]);

  // Jadwal teknisi dari API
  const scheduleBookings: AdminBooking[] = useMemo(() => {
    const result: AdminBooking[] = [];

    techSchedules.forEach((tech) => {
      tech.schedules.forEach((s) => {
        const startDate = s.schedule_date;
        const endDate = s.schedule_date;

        result.push({
          id: s.apply_id,
          formId: s.form_id,
          applyId: s.apply_id,
          name: s.fullname,
          whatsapp: s.wa,
          service: s.service,
          address: s.address,
          startDate,
          endDate,
          time: s.schedule_time,
          technician: tech.fullname,
          technicianUserId: tech.user_id,
          status: mapApiStatusToBookingStatus(s.status),
          lat: 0,
          lng: 0,
          arrivalTime: null,
          startTime: null,
          endTime: null,
          workDurationMinutes: 60,
          additionalCosts: 0,
          note: '',
          photos: {
            arrival: undefined,
            before: undefined,
            after: undefined,
          },
        });
      });
    });

    return result;
  }, [techSchedules]);

  const scheduleTechnicians = useMemo(() => {
    if (techSchedules.length > 0) {
      return techSchedules.map((t) => ({
        id: t.user_id,
        name: t.fullname,
        username: '',
        role: 'technician',
      }));
    }
    return technicians;
  }, [techSchedules, technicians]);

  const allCategoryNames = useMemo(() => {
    const fromApi = serviceCategories.map((c) => c.name);
    if (fromApi.length > 0) return fromApi;
    const fromServices = services.map((c) => c.category);
    return Array.from(new Set(fromServices));
  }, [serviceCategories, services]);

  const sectionTitles: Record<AdminSection, string> = {
    kpi: 'Dashboard KPI',
    bookings: 'Daftar Booking',
    schedule: 'Jadwal Teknisi',
    map: 'Peta Lokasi Tugas',
    technicians: 'Manajemen Tim/User',
    services: 'Manajemen Layanan',
    availability: 'Atur Ketersediaan Jadwal',
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'bookings':
        return (
          <AdminBookingsSection
            paginatedBookings={paginatedBookings}
            currentPage={currentPage}
            totalPages={totalPages}
            goToPage={goToPage}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            technicianFilter={technicianFilter}
            setTechnicianFilter={setTechnicianFilter}
            technicians={technicians}
            statuses={statuses}
            expandedBookingId={expandedBookingId}
            setExpandedBookingId={setExpandedBookingId}
            statusDraft={statusDraft}
            setStatusDraft={setStatusDraft}
            onStatusSubmit={handleStatusSubmit}
            onTechnicianChange={handleBookingUpdate}
          />
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
                <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">
                  Pilih Tanggal
                </h2>
                <p className="text-sm text-secondary dark:text-slate-300 mb-4">
                  Pilih tanggal untuk melihat jadwal teknisi dari sistem backend.
                </p>
                <Calendar
                  selectedDate={scheduleDate}
                  onDateSelect={setScheduleDate}
                  fullyBookedDates={new Set<string>()}
                />
              </div>
              <div className="lg:col-span-2 space-y-3">
                {isLoadingTechSchedule && (
                  <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-3 text-sm text-gray-500 dark:text-gray-300">
                    Memuat jadwal teknisi untuk{' '}
                    {scheduleDate.toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    ...
                  </div>
                )}

                {techScheduleError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                    {techScheduleError}
                  </div>
                )}

                <TechnicianSchedule
                  bookings={scheduleBookings}
                  selectedDate={scheduleDate}
                  technicians={scheduleTechnicians}
                />
              </div>
            </div>
          </div>
        );

      case 'map':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            <div className="lg:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-4 space-y-3 h-full overflow-y-auto">
              <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white p-2 sticky top-0 bg-white dark:bg-slate-800 z-10">
                Pekerjaan Akan Datang
              </h2>
              {upcomingJobs.length > 0 ? (
                upcomingJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() =>
                      setSelectedLocation({
                        lat: job.lat,
                        lng: job.lng,
                        title: job.name,
                      })
                    }
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 border-l-4 ${
                      selectedLocation?.title === job.name
                        ? 'bg-primary-light dark:bg-slate-700 border-primary'
                        : 'bg-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50 border-transparent'
                    }`}
                  >
                    <p className="font-bold text-gray-800 dark:text-white">{job.name}</p>
                    <p className="text-sm text-secondary dark:text-slate-300">{job.service}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{job.address}</p>
                    <div className="text-sm font-semibold text-primary mt-2">
                      {new Date(job.startDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                      })}{' '}
                      - {job.time}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center py-10 text-gray-500 dark:text-gray-400">
                  Tidak ada pekerjaan akan datang.
                </p>
              )}
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden h-full flex flex-col">
              {selectedLocation ? (
                <>
                  <div className="p-4 border-b dark:border-slate-700 flex-shrink-0">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                      Lokasi: {selectedLocation.title}
                    </h3>
                    <a
                      href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
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
                  <MapPin className="mb-4 text-gray-300 dark:text-gray-600" size={48} />
                  <h3 className="font-bold text-xl">Peta Lokasi Pekerjaan</h3>
                  <p>Pilih pekerjaan dari daftar untuk melihat lokasinya di peta.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'technicians':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">
                Manajemen Tim/User
              </h2>
              <button
                onClick={handleOpenAddTechnician}
                className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                <UserPlus size={20} />
                Tambah User Baru
              </button>
            </div>
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl">
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {allUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-light dark:bg-slate-700 flex items-center justify-center text-primary font-bold text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username} • {user.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditTechnician(user)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full"
                        title="Edit User"
                      >
                        <Settings size={18} />
                      </button>
                      <button
                        onClick={() => setTechnicianToDelete(user)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full"
                        title="Hapus User"
                      >
                        <Settings size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {allUsers.length === 0 && (
                <p className="text-center py-10 text-gray-500">Belum ada data user.</p>
              )}
            </div>
          </div>
        );

      case 'services':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">
                Manajemen Layanan
              </h2>
              <button
                onClick={handleOpenAddService}
                className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                <PlusCircle size={20} />
                Tambah Layanan
              </button>
            </div>
            <div className="space-y-8">
              {services.map((category) => (
                <div
                  key={category.category}
                  className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6"
                >
                  <h3 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-4">
                    {category.category}
                  </h3>
                  <div className="divide-y divide-gray-200 dark:divide-slate-700">
                    {category.services.map((service) => (
                      <div key={service.name} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-4">
                          <div className="text-primary hidden sm:block">
                            {serviceIcons[service.icon] || serviceIcons['Wrench']}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {service.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Rp{service.price.toLocaleString('id-ID')} / {service.priceUnit}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditService(service, category.category)}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full"
                            title="Edit Layanan"
                          >
                            <Settings size={18} />
                          </button>
                          <button
                            onClick={() =>
                              setServiceToDelete({
                                serviceName: service.name,
                                categoryName: category.category,
                              })
                            }
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full"
                            title="Hapus Layanan"
                          >
                            <Settings size={18} />
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

      case 'availability':
        return (
          <div>
            <div className="sticky top-4 lg:top-20 z-10 flex justify-end items-center mb-4 p-3 bg-light-bg/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg">
              {showSaveSuccess && (
                <span className="text-green-600 font-semibold mr-4">
                  Perubahan berhasil disimpan!
                </span>
              )}
              <button
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges}
                className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary-dark transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Simpan Perubahan
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
              <div className="col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
                <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">
                  Pilih Tanggal
                </h2>
                <p className="text-sm text-secondary dark:text-slate-300 mb-4">
                  Pilih tanggal untuk mengatur slot waktu atau memblokir sepanjang hari.
                </p>
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={(date) => setSelectedDate(date)}
                  fullyBookedDates={draftFullyBooked}
                />
              </div>
              <div className="col-span-1 lg:col-span-1 xl:col-span-2 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
                <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">
                  Atur Slot Waktu
                </h2>
                {!selectedDate ? (
                  <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                    Pilih tanggal dari kalender untuk memulai.
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="font-semibold text-lg text-secondary dark:text-slate-300">
                        {selectedDate.toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                      <button
                        onClick={handleToggleFullDay}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                          draftFullyBooked.has(formatDateToKey(selectedDate))
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {draftFullyBooked.has(formatDateToKey(selectedDate))
                          ? 'Buka Blokir Hari Ini'
                          : 'Blokir Seharian'}
                      </button>
                    </div>
                    <div
                      className={`grid grid-cols-3 sm:grid-cols-4 gap-3 ${
                        draftFullyBooked.has(formatDateToKey(selectedDate))
                          ? 'opacity-40 pointer-events-none'
                          : ''
                      }`}
                    >
                      {availableTimes.map((time) => {
                        const slotKey = `${formatDateToKey(selectedDate)}-${time}`;
                        const isBooked = draftBookedSlots.has(slotKey);
                        return (
                          <button
                            key={time}
                            onClick={() => handleToggleSlot(time)}
                            className={`text-center font-semibold px-4 py-2.5 rounded-lg border-2 transition-colors duration-200 ${
                              isBooked
                                ? 'bg-red-500 border-red-500 text-white'
                                : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-gray-600 hover:border-primary'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                    {draftFullyBooked.has(formatDateToKey(selectedDate)) && (
                      <p className="text-center mt-4 text-sm text-red-500 font-medium">
                        Semua slot tidak tersedia karena hari ini diblokir.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="col-span-1 lg:col-span-2 xl:col-span-3 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
                <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">
                  Daftar Tanggal yang Diblokir Penuh
                </h2>
                <p className="text-sm text-secondary dark:text-slate-300 mb-4">
                  Berikut adalah daftar tanggal yang telah Anda tandai sebagai penuh (tidak termasuk
                  slot individual).
                </p>
                {Array.from(draftFullyBooked).length > 0 ? (
                  <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {Array.from<string>(draftFullyBooked)
                      .sort((a, b) => parseKeyToDate(a).getTime() - parseKeyToDate(b).getTime())
                      .map((dateKey) => (
                        <li
                          key={dateKey}
                          className="flex justify-between items-center bg-light-bg dark:bg-slate-700 p-3 rounded-lg"
                        >
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            {parseKeyToDate(dateKey).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          <button
                            onClick={() => handleRemoveBlockedDate(dateKey)}
                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                          >
                            Hapus
                          </button>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Tidak ada tanggal yang diblokir penuh.
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'kpi':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart data={kpiData.popularServices} title="5 Layanan Terlaris (Selesai)" />
              <PieChart data={kpiData.statusDistribution} title="Distribusi Status Pesanan" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white mb-4">
                Performa Teknisi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpiData.technicianPerformance.length > 0 ? (
                  kpiData.technicianPerformance.map((tech) => (
                    <div
                      key={tech.name}
                      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg"
                    >
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                        {tech.name}
                      </h3>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Pekerjaan Selesai
                          </p>
                          <p className="text-2xl font-bold text-primary">{tech.completed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Total Waktu Kerja
                          </p>
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

      default:
        return null;
    }
  };

  return (
    <div className="bg-light-bg dark:bg-slate-900 min-h-screen">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:relative lg:translate-x-0 inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 shadow-lg transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-center p-6 border-b dark:border-slate-700 h-20">
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-poppins">
              Admin Viniela
            </span>
          </div>
          <nav className="flex-grow p-4 space-y-2">
            {[
              { name: 'Dashboard KPI', icon: BarChart2, section: 'kpi' },
              { name: 'Daftar Booking', icon: LayoutDashboard, section: 'bookings' },
              { name: 'Jadwal Teknisi', icon: CalendarIcon, section: 'schedule' },
              { name: 'Peta Lokasi', icon: MapIcon, section: 'map' },
              { name: 'Manajemen Tim/User', icon: Users, section: 'technicians' },
              { name: 'Manajemen Layanan', icon: Settings, section: 'services' },
              { name: 'Atur Ketersediaan', icon: Settings, section: 'availability' },
            ].map((item) => (
              <button
                key={item.section}
                onClick={() => {
                  setActiveSection(item.section as AdminSection);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
                  activeSection === item.section
                    ? 'bg-primary-light text-primary dark:bg-slate-700'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t dark:border-slate-700">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 w-full lg:w-auto">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm h-20 flex items-center justify-between lg:justify-end px-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Hello, {currentUser?.name}
              </span>
              <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-slate-700 flex items-center justify-center text-primary font-bold text-lg">
                {currentUser?.name?.charAt(0)}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold font-poppins text-gray-800 dark:text-white">
                {sectionTitles[activeSection]}
              </h1>
              {activeSection === 'bookings' && (
                <button
                  onClick={() => setIsAddBookingModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <PlusCircle size={20} />
                  Tambah Booking
                </button>
              )}
            </div>
            {renderSection()}
          </main>
        </div>
      </div>

      {/* overlay sidebar mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        ></div>
      )}

      {/* Modals */}
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
        allCategories={allCategoryNames}
      />

      <TechnicianFormModal
        isOpen={isTechnicianModalOpen}
        onClose={() => setIsTechnicianModalOpen(false)}
        onSave={handleSaveTechnician}
        technicianToEdit={technicianToEdit}
        existingUsernames={allUsers.map((u) => u.username)}
        roles={roles}
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
        <p>
          Apakah Anda yakin ingin menghapus layanan{' '}
          <span className="font-bold">"{serviceToDelete?.serviceName}"</span>? Tindakan ini tidak
          dapat diurungkan.
        </p>
      </GenericConfirmationModal>

      <GenericConfirmationModal
        isOpen={!!technicianToDelete}
        onClose={() => setTechnicianToDelete(null)}
        onConfirm={handleDeleteTechnician}
        title="Hapus User?"
        confirmText="Ya, Hapus"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      >
        <p>
          Apakah Anda yakin ingin menghapus user{' '}
          <span className="font-bold">"{technicianToDelete?.name}"</span>? Tindakan ini tidak dapat
          diurungkan.
        </p>
      </GenericConfirmationModal>
    </div>
  );
};

export default AdminPage;
