import TechnicianDashboardSection from "@/pages/Technician/TechnicianDashboardSection";
import TechnicianHeader from "@/pages/Technician/TechnicianHeader";
import TechnicianJobsSection from "@/pages/Technician/TechnicianJobSection";
import TechnicianMapSection from "@/pages/Technician/TechnicianMapSection";
import TechnicianSidebar, {
  TechnicianSection,
} from "@/pages/Technician/TechnicianSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Booking, getBookings } from "@/lib/storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const TechnicianPage: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [activeSection, setActiveSection] =
    useState<TechnicianSection>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    title: string;
  } | null>(null);
  const [jobFilter, setJobFilter] = useState<"upcoming" | "completed">(
    "upcoming"
  );
  const [isLoading, setIsLoading] = useState(false);

  const refreshBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getBookings();
      setAllBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleFocus = () => refreshBookings();
    window.addEventListener("focus", handleFocus);
    handleFocus();
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshBookings]);

  if (!currentUser) return <div className="text-center py-20">Loading...</div>;

  const currentTechnicianId = Number((currentUser as any)?.id);
  if (!currentTechnicianId) {
    return (
      <div className="text-center py-20">
        currentUser.id tidak ada. Pastikan endpoint auth/me mengembalikan id
        user.
      </div>
    );
  }

  // ✅ filter by technicianId dari API
  const technicianJobs = useMemo(() => {
    return allBookings
      .filter((job) => Number(job.technicianId) === currentTechnicianId)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
  }, [allBookings, currentTechnicianId]);

  const { completedJobs, upcomingJobsCategorized, upcomingJobsFlat } =
    useMemo(() => {
      const upcoming = technicianJobs.filter(
        (job) => job.status !== "Completed" && job.status !== "Cancelled"
      );
      const completed = technicianJobs.filter(
        (job) => job.status === "Completed" || job.status === "Cancelled"
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const categorized = {
        today: [] as Booking[],
        tomorrow: [] as Booking[],
        upcoming: [] as Booking[],
      };

      upcoming.forEach((job) => {
        const jobStartDate = new Date(job.startDate);
        jobStartDate.setHours(0, 0, 0, 0);

        const jobEndDate = new Date(job.endDate);
        jobEndDate.setHours(0, 0, 0, 0);

        if (
          jobStartDate.getTime() === today.getTime() ||
          (today > jobStartDate && today <= jobEndDate)
        ) {
          categorized.today.push(job);
        } else if (jobStartDate.getTime() === tomorrow.getTime()) {
          categorized.tomorrow.push(job);
        } else if (jobStartDate.getTime() > tomorrow.getTime()) {
          categorized.upcoming.push(job);
        }
      });

      return {
        completedJobs: completed,
        upcomingJobsCategorized: categorized,
        upcomingJobsFlat: upcoming,
      };
    }, [technicianJobs]);

  useEffect(() => {
    if (
      activeSection === "map" &&
      upcomingJobsFlat.length > 0 &&
      !selectedLocation
    ) {
      setSelectedLocation({
        lat: upcomingJobsFlat[0].lat,
        lng: upcomingJobsFlat[0].lng,
        title: upcomingJobsFlat[0].name,
      });
    }
  }, [activeSection, upcomingJobsFlat, selectedLocation]);

  const handleBookingUpdateLocal = (updatedBooking: Booking) => {
    setAllBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
  };

  const dashboardStats = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const jobsThisWeek = upcomingJobsFlat.filter((job) => {
      const jobDate = new Date(job.startDate);
      return jobDate >= startOfWeek && jobDate <= endOfWeek;
    });

    return {
      today: upcomingJobsCategorized.today.length,
      thisWeek: jobsThisWeek.length,
      completed: completedJobs.length,
    };
  }, [upcomingJobsCategorized.today, upcomingJobsFlat, completedJobs]);

  const sectionTitles: Record<TechnicianSection, string> = {
    dashboard: "Dashboard",
    jobs: "Tugas Saya",
    map: "Peta Tugas",
  };

  return (
    <div className="bg-light-bg dark:bg-slate-900 min-h-screen">
      <div className="flex">
        <TechnicianSidebar
          isOpen={isSidebarOpen}
          activeSection={activeSection}
          onSelect={(s) => {
            setActiveSection(s);
            setIsSidebarOpen(false);
          }}
          onLogout={logout}
        />

        <div className="flex-1 w-full lg:w-auto">
          <TechnicianHeader
            currentUserName={(currentUser as any)?.name || ""}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />

          <main className="p-6">
            <h1 className="text-3xl font-bold font-poppins text-gray-800 dark:text-white mb-6">
              {sectionTitles[activeSection]}
            </h1>

            {activeSection === "dashboard" && (
              <TechnicianDashboardSection
                stats={dashboardStats}
                todayJobs={upcomingJobsCategorized.today}
                isLoading={isLoading}
              />
            )}

            {activeSection === "jobs" && (
              <TechnicianJobsSection
                jobFilter={jobFilter}
                setJobFilter={setJobFilter}
                refreshBookings={refreshBookings}
                categories={{
                  "Hari Ini": upcomingJobsCategorized.today,
                  Besok: upcomingJobsCategorized.tomorrow,
                  "Akan Datang": upcomingJobsCategorized.upcoming,
                }}
                completedJobs={completedJobs}
                currentTechnicianId={currentTechnicianId}
                onBookingUpdateLocal={handleBookingUpdateLocal}
                onRefresh={refreshBookings}
              />
            )}

            {activeSection === "map" && (
              <TechnicianMapSection
                upcomingJobsFlat={upcomingJobsFlat}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
              />
            )}
          </main>
        </div>
      </div>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}
    </div>
  );
};

export default TechnicianPage;
