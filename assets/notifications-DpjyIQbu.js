import{c as r}from"./index-CPs0z4DD.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=r("Navigation",[["polygon",{points:"3 11 22 2 13 21 11 13 3 11",key:"1ltx0t"}]]),m=e=>e.startsWith("0")?`62${e.substring(1)}`:e.startsWith("+62")?e.substring(1):e,l=(e,a)=>{const s=m(a.whatsapp);let i="",n="";const t=new Date(a.startDate).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"});switch(e){case"order_created":i=`Halo ${a.name}, pesanan Anda untuk layanan "${a.service}" pada ${t} pukul ${a.time} telah kami terima. ID Pesanan: #${a.id}. Kami akan segera menghubungi Anda untuk konfirmasi. Terima kasih! - Viniela Service`,n=`Notifikasi "Pesanan Diterima" telah dikirim ke ${a.name}.`;break;case"technician_assigned":i=`Update Pesanan #${a.id}: Teknisi ${a.technician} telah ditugaskan untuk layanan "${a.service}" Anda pada ${t}. Teknisi akan menghubungi Anda sebelum kedatangan. - Viniela Service`,n=`Notifikasi "Teknisi Ditugaskan" telah dikirim ke ${a.name}.`;break;case"technician_on_the_way":i=`Halo ${a.name}, teknisi kami, ${a.technician}, sedang dalam perjalanan ke lokasi Anda untuk layanan "${a.service}". Mohon bersiap. Terima kasih. - Viniela Service`,n=`Notifikasi "Teknisi OTW" telah dikirim ke ${a.name}.`;break;case"job_completed":i=`Pekerjaan untuk layanan "${a.service}" (Pesanan #${a.id}) telah selesai. Terima kasih telah menggunakan jasa Viniela Home & Service. Kami tunggu pesanan Anda berikutnya!`,n=`Notifikasi "Pekerjaan Selesai" telah dikirim ke ${a.name}.`;break}return console.log(`[WHATSAPP NOTIFICATION SIMULATION]
    -----------------------------------------
    Recipient: ${s}
    Message: ${i}
    -----------------------------------------`),n};export{u as N,l as s};
