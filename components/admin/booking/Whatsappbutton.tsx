// components/admin/bookings/WhatsAppButton.tsx
import React from 'react';
import { AdminBooking } from '../../../lib/api';

type Props = {
  booking: AdminBooking;
};

const WhatsAppButton: React.FC<Props> = ({ booking }) => {
  const formatWhatsappNumber = (phone: string) => {
    if (phone.startsWith('0')) return `62${phone.substring(1)}`;
    return phone;
  };

  const generateWhatsappLink = () => {
    const number = formatWhatsappNumber(booking.whatsapp);
    const bookingDate = new Date(booking.startDate).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.459l-6.354 1.654zm.791-6.938c.323.517.76 1.002 1.251 1.431.987.842 2.197 1.298 3.51 1.298 5.421 0 9.811-4.39 9.811-9.811 0-2.651-1.04-5.14-2.9-7.001-1.859-1.86-4.35-2.901-7.001-2.901-5.42 0-9.81 4.39-9.81 9.81 0 2.05.61 3.992 1.698 5.688l-.299 1.093zM9.262 7.176c-.23-.487-.474-.487-.698-.487-.203 0-.428.02-.638.211-.23.19-.813.78-.813 1.901 0 1.12.831 2.201.946 2.36.116.161 1.638 2.542 4.004 3.53.585.24 1.045.38 1.41.496.535.169.97.143 1.324-.087.419-.27.813-.981.928-1.342.116-.361.116-.671.083-.758-.032-.087-.23-.142-.487-.27-.257-.128-1.515-.748-1.758-.831-.243-.083-.419-.083-.595.083-.176.166-.66.831-.813.981-.152.152-.291.178-.487.05-.196-.128-.831-.289-1.587-.961-.595-.541-.97-1.221-1.085-1.428-.116-.208-.017-.323.07-.43.087-.107.196-.178.291-.269.1-.096.143-.15.211-.243.068-.092.032-.178-.017-.258-.05-.082-.464-1.113-.638-1.515z" />
      </svg>
      Chat
    </a>
  );
};

export default WhatsAppButton;
