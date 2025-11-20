// pages/AdminPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import BookingFormModal from '../components/BookingFormModal';
import GenericConfirmationModal from '../components/GenericConfirmationModal';
import ServiceFormModal from '../components/ServiceFormModal';

import { Service, ServiceCategory } from '../config/services';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  AdminBooking,
  ApiTechScheduleByUser,
  ServiceMasterCategory,
  createServiceOnServer,
  fetchBookingsFromApi,
  fetchRolesFromApi,
  fetchServiceCategoriesFromApi,
  fetchServicesFromApi,
  fetchTechScheduleFromApi,
  fetchUsersFromApi,
  mapApiStatusToBookingStatus,
  updateBookingStatusOnServer,
  updateServiceOnServer,
} from '../lib/api/admin';
import { simulateNotification } from '../lib/notifications';
import {
  BookingStatus,
  formatDateToKey,
  generateTimeSlots,
  getAvailability,
  getBookings,
  getServices,
  saveAvailability,
  saveBookings,
  saveServices,
} from '../lib/storage';

// komponen pecahan
import AdminBookingsSection from '@/components/admin/booking/AdminBookingSection';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import TechnicianFormModal from '@/components/admin/modals/TechnicianFormModal';
import AvailabilitySection from '@/components/admin/sections/AvailabilitySection';
import KpiSection from '@/components/admin/sections/KpiSection';
import MapSection from '@/components/admin/sections/MapSection';
import ScheduleSection from '@/components/admin/sections/ScheduleSection';
import ServicesSection from '@/components/admin/sections/ServicesSection';
import TechniciansSection from '@/components/admin/sections/TechniciansSection';

export type AdminSection =
  | 'kpi'
  | 'bookings'
  | 'schedule'
  | 'map'
  | 'technicians'
  | 'services'
  | 'availability';

const statuses: BookingStatus[] = ['Confirmed', 'On Site', 'In Progress', 'Completed', 'Cancelled'];

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
  const ITEMS_PER_PAGE = 5;

  // availability
  const [originalFullyBooked, setOriginalFullyBooked] = useState<Set<string>>(new Set<string>());
  const [originalBookedSlots, setOriginalBookedSlots] = useState<Set<string>>(new Set<string>());
  const [draftFullyBooked, setDraftFullyBooked] = useState<Set<string>>(new Set<string>());
  const [draftBookedSlots, setDraftBookedSlots] = useState<Set<string>>(new Set<string>());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // map
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    title: string;
  } | null>(null);

  // services
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<{
    serviceName: string;
    categoryName: string;
  } | null>(null);

  // technicians
  const [isTechnicianModalOpen, setIsTechnicianModalOpen] = useState(false);
  const [technicianToEdit, setTechnicianToEdit] = useState<any | null>(null);
  const [technicianToDelete, setTechnicianToDelete] = useState<any | null>(null);

  // add booking
  const [isAddBookingModalOpen, setIsAddBookingModalOpen] = useState(false);

  // confirmation modal
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

  // tech schedule
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());
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

  /* ------------------------------ LOAD DATA ------------------------------ */

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

  // detect perubahan availability
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

  /* ---------------------------- FILTER & PAGING --------------------------- */

  const filteredBookings = useMemo(
    () =>
      bookings
        .filter((booking) => {
          const searchTermMatch = booking.name.toLowerCase().includes(searchTerm.toLowerCase());
          const statusMatch = statusFilter === 'all' || booking.status === statusFilter;
          const technicianMatch =
            technicianFilter === 'all' || booking.technician === technicianFilter;
          return searchTermMatch && statusMatch && technicianMatch;
        })
        .sort((a, b) => b.id - a.id),
    [bookings, searchTerm, statusFilter, technicianFilter],
  );

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

  /* -------------------- HANDLER BOOKING / STATUS / TECH ------------------- */

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

  /* --------------------------- HANDLER AVAILABILITY --------------------------- */

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

  /* ----------------------------- HANDLER SERVICE ----------------------------- */

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
    const isEdit = !!serviceToEdit;

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

    (async () => {
      try {
        if (isEdit) {
          const idFromService = (serviceToEdit as any)?.id;
          if (!idFromService) {
            addNotification(
              'ID layanan tidak ditemukan. Pastikan API /admin/service-list mengirim field id dan disimpan di Service.',
              'error',
            );
            return;
          }

          await updateServiceOnServer(idFromService, serviceData, categoryName);
        } else {
          await createServiceOnServer(serviceData, categoryName, serviceCategories);
        }

        applyLocalUpdate();
        setIsServiceModalOpen(false);
        addNotification(
          `Layanan "${serviceData.name}" berhasil ${isEdit ? 'diperbarui' : 'disimpan ke server'}.`,
          'success',
        );
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

  /* --------------------------- HANDLER TECHNICIAN --------------------------- */

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

  /* --------------------------- HANDLER NEW BOOKING -------------------------- */

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

  /* --------------------------------- KPI DATA -------------------------------- */

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

  // Jadwal teknisi dari API → AdminBooking[]
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

  /* ---------------------------- RENDER SECTION ---------------------------- */

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
          <ScheduleSection
            scheduleDate={scheduleDate}
            onScheduleDateChange={setScheduleDate}
            isLoading={isLoadingTechSchedule}
            error={techScheduleError}
            bookings={scheduleBookings}
            technicians={scheduleTechnicians}
          />
        );

      case 'map':
        return (
          <MapSection
            upcomingJobs={upcomingJobs}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
          />
        );

      case 'technicians':
        return (
          <TechniciansSection
            users={allUsers}
            onAddTechnician={handleOpenAddTechnician}
            onEditTechnician={handleOpenEditTechnician}
            onRequestDelete={setTechnicianToDelete}
          />
        );

      case 'services':
        return (
          <ServicesSection
            services={services}
            onAddService={handleOpenAddService}
            onEditService={handleOpenEditService}
            onRequestDelete={setServiceToDelete}
          />
        );

      case 'availability':
        return (
          <AvailabilitySection
            availableTimes={availableTimes}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            draftFullyBooked={draftFullyBooked}
            draftBookedSlots={draftBookedSlots}
            onToggleFullDay={handleToggleFullDay}
            onToggleSlot={handleToggleSlot}
            onRemoveBlockedDate={handleRemoveBlockedDate}
            hasUnsavedChanges={hasUnsavedChanges}
            showSaveSuccess={showSaveSuccess}
            onSaveChanges={handleSaveChanges}
          />
        );

      case 'kpi':
        return <KpiSection kpiData={kpiData} />;

      default:
        return null;
    }
  };

  /* --------------------------------- JSX --------------------------------- */

  return (
    <div className="bg-light-bg dark:bg-slate-900 min-h-screen">
      <div className="flex">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={(section) => {
            setActiveSection(section);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={logout}
        />

        <div className="flex-1 w-full lg:w-auto">
          <AdminHeader
            currentUserName={currentUser?.name}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />

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
