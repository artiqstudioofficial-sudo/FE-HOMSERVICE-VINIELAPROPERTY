import { Booking } from './storage';

export type NotificationType = 
    | 'order_created'
    | 'technician_assigned'
    | 'technician_on_the_way'
    | 'job_completed';

const formatWhatsappNumber = (phone: string): string => {
    if (phone.startsWith('0')) {
        return `62${phone.substring(1)}`;
    }
    if (phone.startsWith('+62')) {
        return phone.substring(1);
    }
    return phone;
};

/**
 * Simulates sending a notification. In a real app, this would make an API call to a backend service.
 * For now, it logs to the console and returns a message for the UI.
 */
export const simulateNotification = (type: NotificationType, booking: Booking): string => {
    const customerNumber = formatWhatsappNumber(booking.whatsapp);
    let messageToCustomer = '';
    let uiMessage = '';
    const bookingDate = new Date(booking.startDate).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    switch (type) {
        case 'order_created':
            messageToCustomer = `Halo ${booking.name}, pesanan Anda untuk layanan "${booking.service}" pada ${bookingDate} pukul ${booking.time} telah kami terima. ID Pesanan: #${booking.id}. Kami akan segera menghubungi Anda untuk konfirmasi. Terima kasih! - Viniela Service`;
            uiMessage = `Notifikasi "Pesanan Diterima" telah dikirim ke ${booking.name}.`;
            break;

        case 'technician_assigned':
            messageToCustomer = `Update Pesanan #${booking.id}: Teknisi ${booking.technician} telah ditugaskan untuk layanan "${booking.service}" Anda pada ${bookingDate}. Teknisi akan menghubungi Anda sebelum kedatangan. - Viniela Service`;
            uiMessage = `Notifikasi "Teknisi Ditugaskan" telah dikirim ke ${booking.name}.`;
            break;

        case 'technician_on_the_way':
            messageToCustomer = `Halo ${booking.name}, teknisi kami, ${booking.technician}, sedang dalam perjalanan ke lokasi Anda untuk layanan "${booking.service}". Mohon bersiap. Terima kasih. - Viniela Service`;
            uiMessage = `Notifikasi "Teknisi OTW" telah dikirim ke ${booking.name}.`;
            break;
            
        case 'job_completed':
            messageToCustomer = `Pekerjaan untuk layanan "${booking.service}" (Pesanan #${booking.id}) telah selesai. Terima kasih telah menggunakan jasa Viniela Home & Service. Kami tunggu pesanan Anda berikutnya!`;
            uiMessage = `Notifikasi "Pekerjaan Selesai" telah dikirim ke ${booking.name}.`;
            break;
    }

    console.log(`[WHATSAPP NOTIFICATION SIMULATION]
    -----------------------------------------
    Recipient: ${customerNumber}
    Message: ${messageToCustomer}
    -----------------------------------------`);

    // In a real app, you would make an API call here:
    // await fetch('/api/send-notification', {
    //   method: 'POST',
    //   body: JSON.stringify({ to: customerNumber, message: messageToCustomer })
    // });

    return uiMessage;
};
