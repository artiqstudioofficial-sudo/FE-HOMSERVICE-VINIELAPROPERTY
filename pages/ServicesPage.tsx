import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Service, ServiceCategory, serviceIcons } from '../config/services';
import { getServices } from '../lib/storage';
import { Clock, ShieldCheck } from 'lucide-react';
import ServiceDetailModal from '../components/ServiceDetailModal';

const ServicesHero: React.FC = () => (
    <div className="relative bg-primary-dark">
        <div className="absolute inset-0">
            <img loading="lazy" src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop" alt="Layanan Lengkap" className="w-full h-full object-cover opacity-30 dark:opacity-40"/>
        </div>
        <div className="relative container mx-auto px-6 py-32 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold font-poppins leading-tight" data-aos="fade-up">Layanan Lengkap Untuk Semua Kebutuhan Rumah Anda</h1>
        </div>
    </div>
);

const formatDuration = (minutes: number): string => {
    if (!minutes || minutes <= 0) return 'N/A';
    if (minutes < 60) return `${minutes} mnt`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} jam`;
    return `${hours}j ${remainingMinutes}m`;
};

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

const AllServicesSection: React.FC = () => {
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [allServicesData, setAllServicesData] = useState<ServiceCategory[]>([]);

    useEffect(() => {
        setAllServicesData(getServices());
    }, []);

    return (
        <section className="py-24 bg-light-bg dark:bg-slate-900">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16" data-aos="fade-up">
                    <h2 className="text-3xl md:text-4xl font-bold font-poppins text-gray-800 dark:text-white">Semua Layanan Kami</h2>
                    <p className="max-w-2xl mx-auto text-lg text-secondary dark:text-slate-300 mt-4">
                        Temukan solusi yang tepat untuk setiap kebutuhan perawatan dan perbaikan rumah Anda. Klik layanan untuk detail.
                    </p>
                </div>
                {allServicesData.map((categoryData, index) => (
                    <div key={categoryData.category} className={index > 0 ? 'mt-16' : ''}>
                        <h3 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white mb-8" data-aos="fade-up">{categoryData.category}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {categoryData.services.map((service, serviceIndex) => (
                                <button 
                                    onClick={() => setSelectedService(service)}
                                    key={service.name} 
                                    className="group relative bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-primary/20 hover:-translate-y-2 border border-transparent hover:border-primary/50 transition-all duration-300 flex flex-col text-center"
                                    data-aos="fade-up" 
                                    data-aos-delay={50 * serviceIndex}
                                    aria-label={`Lihat detail untuk ${service.name}`}
                                >
                                    {service.guarantee && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold z-10">
                                            <ShieldCheck size={14} />
                                            <span>Garansi</span>
                                        </div>
                                    )}
                                    <div className="flex-grow flex flex-col items-center">
                                        <div className="text-primary mb-4 transition-transform duration-300 group-hover:scale-110">
                                            {serviceIcons[service.icon] || serviceIcons['Wrench']}
                                        </div>
                                        <h4 className="font-semibold text-gray-800 dark:text-white mb-2 min-h-[48px] flex items-center justify-center">{service.name}</h4>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                                            <Clock size={14} className="flex-shrink-0" />
                                            <span>Estimasi {formatDuration(service.duration)}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 w-full">
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Mulai dari</p>
                                        <p className="text-xl font-bold text-primary">
                                            {formatPrice(service.price)}
                                            <span className="text-sm font-normal text-secondary dark:text-slate-300">/{service.priceUnit}</span>
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <ServiceDetailModal service={selectedService} onClose={() => setSelectedService(null)} />
        </section>
    );
};

const PricingInfoSection: React.FC = () => {
    const principles = [
        {
            title: 'Harga Sesuai Layanan',
            description: 'Setiap pekerjaan memiliki standar harga yang jelas sesuai dengan jenis dan tingkat kesulitannya.'
        },
        {
            title: 'Estimasi Biaya di Awal',
            description: 'Untuk pekerjaan kompleks, tim kami akan melakukan survei dan memberikan estimasi biaya transparan sebelum pengerjaan.'
        },
        {
            title: 'Tanpa Biaya Tersembunyi',
            description: 'Total yang Anda bayar adalah total yang telah kita setujui bersama. Tidak ada biaya siluman.'
        }
    ];

    return (
        <section className="py-24 bg-white dark:bg-dark-bg">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-4 text-gray-800 dark:text-white" data-aos="fade-up">
                    Harga Transparan & Terjangkau
                </h2>
                <p className="max-w-3xl mx-auto text-lg text-secondary dark:text-slate-300 mb-16" data-aos="fade-up" data-aos-delay="100">
                    Kami percaya pada transparansi penuh. Harga untuk setiap layanan akan diinformasikan di awal, disesuaikan dengan kebutuhan dan kompleksitas pekerjaan Anda.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {principles.map((principle, index) => (
                        <div key={principle.title} className="bg-light-bg dark:bg-slate-800 p-8 rounded-xl shadow-lg border-t-4 border-primary" data-aos="fade-up" data-aos-delay={100 * (index + 1)}>
                            <div className="inline-block bg-primary-light dark:bg-slate-700 p-3 rounded-full mb-6">
                                <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-xl font-bold font-poppins mb-2 text-gray-800 dark:text-white">{principle.title}</h3>
                            <p className="text-secondary dark:text-slate-300">{principle.description}</p>
                        </div>
                    ))}
                </div>
                 <div className="mt-16" data-aos="fade-up" data-aos-delay="400">
                    <Link to="/contact" className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary-dark transition-all duration-300 text-lg">
                        Dapatkan Estimasi Biaya
                    </Link>
                </div>
            </div>
        </section>
    );
};


const FaqItem: React.FC<{ question: string; answer: string; }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 dark:border-gray-700 py-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left flex justify-between items-center focus:outline-none group" aria-expanded={isOpen}>
                <span className="text-lg font-semibold text-secondary dark:text-slate-200 group-hover:text-primary transition-colors">{question}</span>
                <div className="p-1 rounded-full bg-primary-light dark:bg-slate-700">
                    <svg className={`w-5 h-5 text-primary transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 mt-4' : 'max-h-0'}`}>
                <p className="text-gray-600 dark:text-slate-300 pr-6">{answer}</p>
            </div>
        </div>
    );
}

const FaqSection: React.FC = () => {
    const faqs = [
        { q: 'Apakah ada garansi pekerjaan?', a: 'Ya, kami memberikan garansi 30 hari untuk layanan perbaikan tertentu seperti perbaikan AC dan plumbing. Garansi mencakup pengerjaan ulang jika masalah yang sama timbul kembali. Syarat dan ketentuan berlaku.' },
        { q: 'Apakah teknisi datang ke rumah?', a: 'Tentu saja. Semua layanan kami dirancang untuk dikerjakan langsung di lokasi Anda untuk kenyamanan maksimal.' },
        { q: 'Apakah bisa jadwal rutin mingguan?', a: 'Ya, kami menyediakan layanan terjadwal baik mingguan, dua mingguan, maupun bulanan. Hubungi kami untuk penawaran khusus.' },
        { q: 'Pembayaran via apa saja?', a: 'Kami menerima berbagai metode pembayaran, termasuk transfer bank, kartu kredit/debit, dan dompet digital.' },
    ];
    return (
        <section className="py-24 bg-light-bg dark:bg-slate-900">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-12" data-aos="fade-up">
                    <h2 className="text-3xl font-bold font-poppins text-gray-800 dark:text-white">Pertanyaan Umum</h2>
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg" data-aos="fade-up" data-aos-delay="100">
                    {faqs.map(faq => <FaqItem key={faq.q} question={faq.q} answer={faq.a} />)}
                </div>
            </div>
        </section>
    );
};


const ServicesPage: React.FC = () => {
    return (
        <>
            <ServicesHero />
            <AllServicesSection />
            <PricingInfoSection />
            <FaqSection />
        </>
    );
};

export default ServicesPage;
