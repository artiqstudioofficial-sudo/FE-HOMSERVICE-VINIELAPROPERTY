import {
  BedDouble,
  Droplets,
  FilterX,
  Home,
  Layers,
  PaintRoller,
  Scale,
  Settings2,
  Shirt,
  Sofa,
  Sparkles,
  Split,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import React from 'react';

export interface Service {
  name: string;
  icon: string; // Changed from React.ReactNode to string
  description: string;
  duration: number; // in minutes
  durationDays?: number; // total duration in days
  price: number;
  priceUnit: 'unit' | 'jam' | 'kg' | 'm²';
  includes: string[];
  excludes: string[];
  guarantee?: boolean;
}

export interface ServiceCategory {
  category: string;
  services: Service[];
}

const iconProps = { size: 40, strokeWidth: 1.5, className: 'w-10 h-10' };

export const serviceIcons: { [key: string]: React.ReactNode } = {
  Wrench: <Wrench {...iconProps} />,
  Sparkles: <Sparkles {...iconProps} />,
  Settings2: <Settings2 {...iconProps} />,
  Droplets: <Droplets {...iconProps} />,
  Split: <Split {...iconProps} />,
  FilterX: <FilterX {...iconProps} />,
  PaintRoller: <PaintRoller {...iconProps} />,
  Zap: <Zap {...iconProps} />,
  Home: <Home {...iconProps} />,
  Layers: <Layers {...iconProps} />,
  Trash2: <Trash2 {...iconProps} />,
  Scale: <Scale {...iconProps} />,
  BedDouble: <BedDouble {...iconProps} />,
  Sofa: <Sofa {...iconProps} />,
  Shirt: <Shirt {...iconProps} />,
};

export const allServicesData: ServiceCategory[] = [
  {
    category: 'Perawatan & Perbaikan Rumah',
    services: [
      {
        name: 'Pasang AC Baru',
        icon: 'Wrench',
        duration: 180,
        price: 350000,
        priceUnit: 'unit',
        description:
          'Instalasi AC split baru dengan standar pabrikan untuk memastikan kinerja optimal dan daya tahan unit. Dikerjakan oleh teknisi bersertifikat.',
        includes: [
          'Pemasangan unit indoor & outdoor',
          'Pipa AC standar 3 meter',
          'Kabel listrik 5 meter',
          'Vakum instalasi untuk performa maksimal',
        ],
        excludes: [
          'Bongkar AC lama',
          'Penambahan material (pipa, kabel)',
          'Pekerjaan sipil (bobok tembok, tanam pipa)',
        ],
        guarantee: true,
        durationDays: 1,
      },
      {
        name: 'Cuci AC Rutin',
        icon: 'Sparkles',
        duration: 60,
        price: 75000,
        priceUnit: 'unit',
        description:
          'Pembersihan rutin untuk menjaga performa AC tetap dingin, hemat energi, dan menghasilkan udara yang lebih sehat.',
        includes: [
          'Pembersihan unit indoor & outdoor',
          'Pembersihan filter udara',
          'Pengecekan tekanan freon (tanpa penambahan)',
        ],
        excludes: [
          'Penambahan atau isi ulang freon',
          'Perbaikan kerusakan spare part',
          'Pembongkaran unit',
        ],
        guarantee: false,
      },
      {
        name: 'Perbaikan AC',
        icon: 'Settings2',
        duration: 90,
        price: 150000,
        priceUnit: 'unit',
        description:
          'Diagnosa dan perbaikan berbagai masalah AC seperti tidak dingin, bocor, atau mati total. Harga belum termasuk penggantian spare part.',
        includes: [
          'Pengecekan & diagnosa masalah',
          'Biaya jasa perbaikan ringan',
          'Pembersihan ringan area kerja',
        ],
        excludes: [
          'Harga spare part (jika ada penggantian)',
          'Isi ulang freon',
          'Pengelasan atau perbaikan besar',
        ],
        guarantee: true,
      },
      {
        name: 'Perbaikan Keran Bocor',
        icon: 'Droplets',
        duration: 45,
        price: 85000,
        priceUnit: 'unit',
        description:
          'Mengatasi masalah keran air yang bocor, menetes, atau rusak untuk mencegah pemborosan air dan kerusakan lebih lanjut.',
        includes: [
          'Pemeriksaan sumber kebocoran',
          'Penggantian seal/klep standar',
          'Biaya jasa perbaikan',
        ],
        excludes: [
          'Harga keran baru (jika perlu diganti)',
          'Perbaikan instalasi pipa dalam dinding',
        ],
        guarantee: true,
      },
      {
        name: 'Instalasi Pipa Air',
        icon: 'Split',
        duration: 120,
        price: 250000,
        priceUnit: 'unit',
        description:
          'Pemasangan jalur pipa air bersih baru atau penggantian jalur lama untuk kamar mandi, dapur, atau taman.',
        includes: [
          'Instalasi pipa hingga 5 meter',
          'Penyambungan ke sumber air & keran',
          'Pengecekan kebocoran pasca instalasi',
        ],
        excludes: ['Material pipa dan sambungan', 'Pekerjaan sipil (bobok, gali tanah)'],
        guarantee: true,
        durationDays: 3,
      },
      {
        name: 'Servis Saluran Mampet',
        icon: 'FilterX',
        duration: 75,
        price: 200000,
        priceUnit: 'unit',
        description:
          'Membersihkan sumbatan pada saluran pembuangan air di wastafel, floor drain, atau kamar mandi menggunakan peralatan khusus.',
        includes: ['Pembersihan sumbatan ringan-sedang', 'Pengecekan kelancaran aliran air'],
        excludes: [
          'Bongkar pasang toilet atau wastafel',
          'Penggunaan mesin jetting bertekanan tinggi',
        ],
        guarantee: true,
      },
      {
        name: 'Pengecatan Dinding',
        icon: 'PaintRoller',
        duration: 240,
        price: 50000,
        priceUnit: 'm²',
        description:
          'Jasa pengecatan dinding interior untuk memberikan suasana baru pada ruangan Anda. Harga per meter persegi, minimal 20 m².',
        includes: ['Jasa pengecatan 2 lapis', 'Pembersihan area kerja setelah selesai'],
        excludes: [
          'Cat dan perlengkapan (kuas, roller)',
          'Perbaikan dinding (retak, lubang)',
          'Pengecatan plafon',
        ],
        guarantee: true,
      },
      {
        name: 'Perbaikan Listrik',
        icon: 'Zap',
        duration: 60,
        price: 125000,
        priceUnit: 'unit',
        description:
          'Mengatasi masalah kelistrikan ringan seperti stop kontak tidak berfungsi, saklar rusak, atau pemasangan lampu.',
        includes: [
          'Diagnosa masalah kelistrikan',
          'Perbaikan atau penggantian 1 titik (saklar/stop kontak)',
        ],
        excludes: [
          'Material (kabel, stop kontak, dll.)',
          'Perbaikan korsleting pada instalasi utama/MCB',
        ],
        guarantee: true,
      },
    ],
  },
  {
    category: 'Kebersihan & Laundry',
    services: [
      {
        name: 'General Cleaning',
        icon: 'Home',
        duration: 120,
        price: 150000,
        priceUnit: 'jam',
        description:
          'Layanan kebersihan umum untuk menjaga rumah tetap rapi dan nyaman. Cocok untuk perawatan rutin mingguan.',
        includes: [
          'Menyapu & mengepel lantai',
          'Membersihkan debu perabotan',
          'Merapikan tempat tidur',
          'Membersihkan kamar mandi',
        ],
        excludes: [
          'Membersihkan bagian dalam lemari/kulkas',
          'Cuci piring numpuk',
          'Memindahkan perabotan berat',
        ],
        guarantee: false,
      },
      {
        name: 'Deep Cleaning',
        icon: 'Layers',
        duration: 240,
        price: 400000,
        priceUnit: 'unit',
        description:
          'Pembersihan menyeluruh dan detail untuk area yang sulit dijangkau. Ideal untuk pembersihan bulanan atau saat pindah rumah.',
        includes: [
          'Semua layanan General Cleaning',
          'Membersihkan kerak kamar mandi',
          'Membersihkan noda di dapur',
          'Vakum sofa & gorden',
        ],
        excludes: [
          'Pembersihan pasca renovasi',
          'Menghilangkan noda permanen',
          'Cuci sofa/karpet basah',
        ],
        guarantee: false,
      },
      {
        name: 'Cleaning Pasca Renovasi',
        icon: 'Trash2',
        duration: 300,
        price: 550000,
        priceUnit: 'unit',
        description:
          'Membersihkan debu, sisa cat, dan kotoran konstruksi setelah proses renovasi selesai, membuat rumah siap huni.',
        includes: [
          'Menghilangkan debu konstruksi',
          'Membersihkan sisa cat & semen',
          'Pembersihan detail jendela & lantai',
        ],
        excludes: ['Pembuangan puing-puing bangunan', 'Pengangkatan material sisa renovasi'],
        guarantee: false,
        durationDays: 2,
      },
      {
        name: 'Laundry Kiloan',
        icon: 'Scale',
        duration: 60,
        price: 8000,
        priceUnit: 'kg',
        description:
          'Layanan cuci, kering, dan setrika untuk pakaian harian Anda. Praktis dan efisien. Proses pengerjaan 2-3 hari.',
        includes: ['Cuci, kering, setrika', 'Pewangi pakaian', 'Plastik packing'],
        excludes: ['Layanan kilat (express)', 'Pakaian berbahan khusus (sutra, wol, jas)'],
        guarantee: false,
      },
      {
        name: 'Laundry Bed Cover',
        icon: 'BedDouble',
        duration: 60,
        price: 25000,
        priceUnit: 'unit',
        description:
          'Pencucian khusus untuk bed cover, selimut, atau sprei agar kembali bersih, wangi, dan higienis.',
        includes: ['Cuci, kering, lipat', 'Pewangi khusus anti-bakteri'],
        excludes: ['Menghilangkan noda membandel', 'Perbaikan sobek atau kerusakan kain'],
        guarantee: false,
      },
      {
        name: 'Cuci Sofa & Karpet',
        icon: 'Sofa',
        duration: 180,
        price: 180000,
        priceUnit: 'unit',
        description:
          'Menggunakan metode wet & dry cleaning untuk mengangkat debu, tungau, dan noda pada sofa atau karpet Anda.',
        includes: [
          'Vakum tungau & debu',
          'Pembersihan noda ringan',
          'Pengeringan dengan blower khusus',
        ],
        excludes: [
          'Menghilangkan noda permanen (tinta, darah)',
          'Perbaikan kerusakan pada sofa/karpet',
        ],
        guarantee: false,
      },
      {
        name: 'Jasa Setrika',
        icon: 'Shirt',
        duration: 90,
        price: 50000,
        priceUnit: 'jam',
        description:
          'Jika Anda sudah mencuci namun tak sempat menyetrika, kami siap membantu agar pakaian Anda rapi dan siap pakai.',
        includes: ['Jasa setrika uap', 'Melipat pakaian', 'Pewangi saat menyetrika'],
        excludes: ['Proses cuci dan jemur', 'Penyediaan hanger (gantungan baju)'],
        guarantee: false,
      },
    ],
  },
];
