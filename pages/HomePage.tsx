import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, FilterX, Home } from 'lucide-react';

const HeroSection: React.FC = () => (
    <div className="relative bg-dark-bg">
        <div className="absolute inset-0">
            <img loading="lazy" src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2070&auto=format&fit=crop" alt="Teknisi memperbaiki AC di rumah modern" className="w-full h-full object-cover opacity-30 dark:opacity-40"/>
        </div>
        <div className="relative container mx-auto px-6 py-32 md:py-48 text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold font-poppins leading-tight mb-4" data-aos="fade-up">Solusi Lengkap Perawatan & Perbaikan Rumah Anda</h1>
            <p className="text-lg max-w-3xl mx-auto text-gray-300 mb-8" data-aos="fade-up" data-aos-delay="100">Dari AC, plumbing, kebersihan, hingga laundry — semua ditangani tim profesional Viniela Home & Service.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center" data-aos="fade-up" data-aos-delay="200">
                <Link to="/contact" className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary-dark transition-all duration-300 transform hover:scale-105">
                    Pesan Layanan Sekarang
                </Link>
                <Link to="/services" className="bg-transparent text-white border-2 border-white font-bold px-8 py-3 rounded-full hover:bg-white hover:text-dark-bg transition-all duration-300 transform hover:scale-105">
                    Lihat Layanan Kami
                </Link>
            </div>
        </div>
    </div>
);

const WhyChooseUsSection: React.FC = () => {
    const features = [
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            title: 'Tenaga Profesional',
            description: 'Tim kami terdiri dari teknisi berpengalaman dan bersertifikat.'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
            title: 'Respon Cepat',
            description: 'Kami siap melayani Anda dengan cepat dan tanggap.'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
            title: 'Layanan Lengkap',
            description: 'Semua kebutuhan perawatan rumah dalam satu platform.'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
            title: 'Support 24 Jam',
            description: 'Layanan pelanggan kami siap membantu Anda kapan saja.'
        },
    ];
    return (
        <section className="py-24 bg-light-bg dark:bg-slate-900">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-4 text-gray-800 dark:text-white" data-aos="fade-up">Mengapa Memilih Viniela?</h2>
                <p className="max-w-2xl mx-auto text-lg text-secondary dark:text-slate-300 mb-16" data-aos="fade-up" data-aos-delay="100">
                    Kami tidak hanya memperbaiki, kami memberikan ketenangan pikiran.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div key={feature.title} className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg hover:shadow-primary/20 hover:-translate-y-2 border border-transparent hover:border-primary/50 transition-all duration-300" data-aos="fade-up" data-aos-delay={100 * (index + 1)}>
                            <div className="inline-block bg-primary-light dark:bg-slate-700 p-4 rounded-full mb-6">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">{feature.title}</h3>
                            <p className="text-secondary dark:text-slate-300">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ServicePreviewSection: React.FC = () => {
    const services = [
        { 
            name: 'Cuci AC Rutin', 
            image: 'https://images.unsplash.com/photo-1543369792-95154cf37e3d?q=80&w=2070&auto=format&fit=crop',
            icon: <Sparkles size={24} strokeWidth={2} />,
            description: 'Jaga performa AC tetap dingin, hemat energi, dan hasilkan udara yang lebih sehat dengan pembersihan rutin.'
        },
        { 
            name: 'Servis Saluran Mampet', 
            image: 'https://images.unsplash.com/photo-1616047006789-b7af545e0740?q=80&w=2070&auto=format&fit=crop',
            icon: <FilterX size={24} strokeWidth={2} />,
            description: 'Atasi sumbatan pada wastafel, floor drain, atau kamar mandi dengan peralatan khusus dari tim ahli kami.'
        },
        { 
            name: 'General Cleaning', 
            image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop',
            icon: <Home size={24} strokeWidth={2} />,
            description: 'Layanan kebersihan umum untuk menjaga rumah Anda tetap rapi, bersih, dan nyaman untuk ditinggali.'
        },
    ];
    return (
        <section className="py-24 bg-white dark:bg-dark-bg">
            <div className="container mx-auto px-6 text-center">
                 <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-16 text-gray-800 dark:text-white" data-aos="fade-up">Layanan Unggulan Kami</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <Link to="/services" key={service.name} className="group block bg-light-bg dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-primary/20 hover:-translate-y-2 border border-gray-200 dark:border-slate-700/50 hover:border-primary/30 transition-all duration-300 overflow-hidden text-left" data-aos="fade-up" data-aos-delay={100*index}>
                            <div className="relative h-48 overflow-hidden">
                                <img loading="lazy" src={service.image} alt={service.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 ease-out-expo"/>
                            </div>
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 text-primary bg-primary/10 dark:bg-slate-700 p-3 rounded-full mt-1 transition-colors duration-300 group-hover:bg-primary/20">
                                        {service.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white font-poppins group-hover:text-primary transition-colors duration-300">{service.name}</h3>
                                        <p className="text-secondary dark:text-slate-300 text-sm leading-relaxed mt-1">
                                            {service.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                <div className="mt-16" data-aos="fade-up">
                    <Link to="/services" className="bg-primary text-white font-bold px-10 py-4 rounded-full hover:bg-primary-dark transition-all duration-300 text-lg transform hover:scale-105">
                        Lihat Semua Layanan
                    </Link>
                </div>
            </div>
        </section>
    );
};

const HowItWorksSection: React.FC = () => {
    const steps = [
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
            title: 'Pesan Online',
            description: 'Pilih layanan pilihan Anda dengan mudah dan jadwalkan dengan nyaman pada waktu yang paling sesuai untuk Anda melalui pemesanan sederhana kami.',
            image: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=2070&auto=format&fit=crop'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
            title: 'Kustomisasi Rencana',
            description: 'Sesuaikan pembersihan Anda sesuai keinginan — pilih jenis layanan, jadwal, dan seberapa sering Anda membutuhkannya.',
            image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
            title: 'Temui Petugas Kami',
            description: 'Temui profesional yang akan merawat ruangan Anda — kami akan membagikan nama dan detail mereka sebelum janji temu.',
            image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
            title: 'Dapatkan Hasil Berkilau',
            description: 'Nikmati rumah bersih tanpa noda. Profesional kami menggunakan produk ramah lingkungan dan metode teruji untuk hasil mendalam.',
            image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=2071&auto=format&fit=crop'
        },
    ];

    const [activeStep, setActiveStep] = useState(0);

    return (
        <section className="py-24 bg-primary-light/40 dark:bg-slate-900">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16" data-aos="fade-up">
                    <span className="text-sm font-bold tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">CARA KERJA</span>
                    <h2 className="text-3xl md:text-4xl font-bold font-poppins mt-4 mb-4 text-gray-800 dark:text-white">Hanya 4 Langkah Mudah</h2>
                    <p className="max-w-2xl mx-auto text-lg text-secondary dark:text-slate-300">
                        Pembersihan simpel, lancar, dan bebas stres dalam 4 langkah mudah.
                    </p>
                </div>
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
                    <div className="relative" data-aos="fade-right">
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-primary/20 -z-10"></div>
                        <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-col lg:justify-between lg:h-full">
                            {steps.map((step, index) => (
                                <div key={index}>
                                    <button
                                        onClick={() => setActiveStep(index)}
                                        className="w-full text-left flex items-start gap-5 relative group"
                                        aria-expanded={activeStep === index}
                                        aria-controls={`step-content-${index}`}
                                    >
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10
                                            ${activeStep === index
                                                ? 'bg-primary border-primary text-white scale-110'
                                                : 'bg-white dark:bg-slate-800 border-primary/30 text-primary group-hover:border-primary group-hover:bg-primary/10'
                                            }`}
                                        >
                                            {step.icon}
                                        </div>
                                        <div>
                                            <h3 className={`text-xl font-bold font-poppins transition-colors duration-300 mb-1 ${activeStep === index ? 'text-primary' : 'text-gray-800 dark:text-white'}`}>{step.title}</h3>
                                            <p className="text-secondary dark:text-slate-300">{step.description}</p>
                                        </div>
                                    </button>
                                    <div 
                                        id={`step-content-${index}`}
                                        className={`lg:hidden transition-all duration-500 ease-out overflow-hidden pl-[calc(3rem+1.25rem)] pr-6 ${activeStep === index ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                                        <img
                                            loading="lazy"
                                            src={step.image}
                                            alt={step.title}
                                            className="rounded-xl shadow-lg w-full h-auto object-cover px-4"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div data-aos="fade-left" className="hidden lg:flex relative w-full h-96 lg:h-full items-center">
                         {steps.map((step, index) => (
                            <img
                                key={index}
                                loading="lazy"
                                src={step.image}
                                alt={step.title}
                                className={`rounded-2xl shadow-2xl w-full h-full object-cover absolute inset-0 transition-opacity duration-500 ease-in-out ${activeStep === index ? 'opacity-100' : 'opacity-0'}`}
                            />
                         ))}
                    </div>
                </div>
            </div>
        </section>
    );
};


const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const TestimonialSection: React.FC = () => {
    const testimonials = [
        { name: 'Andi S.', rating: 5, comment: 'Pelayanan AC sangat memuaskan! Teknisi datang tepat waktu, ramah, dan AC saya sekarang dingin lagi. Terima kasih Viniela!', image: 'https://i.pravatar.cc/100?u=man1' },
        { name: 'Citra W.', rating: 5, comment: 'Puas banget sama layanan deep cleaning-nya. Dapur jadi kinclong seperti baru. Pasti akan pesan lagi bulan depan.', image: 'https://i.pravatar.cc/100?u=woman1' },
        { name: 'Budi P.', rating: 5, comment: 'Respon cepat saat keran saya bocor tengah malam. Sangat profesional dan solutif. Highly recommended!', image: 'https://i.pravatar.cc/100?u=man2' },
        { name: 'Rina M.', rating: 5, comment: 'Laundry antar-jemputnya sangat membantu di tengah kesibukan. Pakaian kembali bersih, wangi, dan rapi. Layanan pelanggan juga ramah.', image: 'https://i.pravatar.cc/100?u=woman2' },
        { name: 'Doni H.', rating: 5, comment: 'Pengerjaan instalasi pipa air baru di rumah saya sangat rapi dan cepat. Timnya bekerja sangat profesional dan bersih. Hasilnya memuaskan!', image: 'https://i.pravatar.cc/100?u=man3' },
        { name: 'Maya L.', rating: 4, comment: 'General cleaning apartemennya oke banget. Cukup detail dan bersih. Mungkin bisa sedikit lebih cepat lain kali, tapi secara keseluruhan puas.', image: 'https://i.pravatar.cc/100?u=woman3' },
    ];
    
    const TestimonialCard: React.FC<typeof testimonials[0]> = ({ name, rating, comment, image }) => (
        <div className="relative bg-light-bg dark:bg-slate-800 p-8 rounded-xl shadow-lg h-full flex flex-col">
             <svg className="absolute top-6 right-6 w-16 h-16 text-primary/10 dark:text-primary/20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 10c-.22 0-.44-.03-.66-.09-1.01-.28-1.8-1.02-2.13-2.05-.33-1.03.08-2.14.9-2.82.82-.68 1.95-1.04 3.12-1.04.5 0 .91.41.91.91s-.41.91-.91.91c-.77 0-1.4.2-1.87.56-.47.36-.67.92-.53 1.45.13.53.59.93 1.13.93.5 0 .91.41.91.91s-.41.91-.91.91zm11 0c-.22 0-.44-.03-.66-.09-1.01-.28-1.8-1.02-2.13-2.05-.33-1.03.08-2.14.9-2.82.82-.68 1.95-1.04 3.12-1.04.5 0 .91.41.91.91s-.41.91-.91.91c-.77 0-1.4.2-1.87.56-.47.36-.67.92-.53 1.45.13.53.59.93 1.13.93.5 0 .91.41.91.91s-.41.91-.91.91z"/></svg>
            <div className="flex items-center mb-4">
                <img loading="lazy" src={image} alt={name} className="w-16 h-16 rounded-full mr-4 border-2 border-primary/50"/>
                <div>
                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">{name}</h4>
                    <StarRating rating={rating} />
                </div>
            </div>
            <p className="text-secondary dark:text-slate-300 italic flex-grow">"{comment}"</p>
        </div>
    );
    
    const [mobileIndex, setMobileIndex] = useState(0);
    const [desktopIndex, setDesktopIndex] = useState(0);
    const desktopSlides = Math.ceil(testimonials.length / 3);

    useEffect(() => {
        const mobileInterval = setInterval(() => {
            setMobileIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(mobileInterval);
    }, [testimonials.length]);

    useEffect(() => {
        const desktopInterval = setInterval(() => {
            setDesktopIndex((prevIndex) => (prevIndex + 1) % desktopSlides);
        }, 5000);
        return () => clearInterval(desktopInterval);
    }, [desktopSlides]);


    return (
        <section className="py-24 bg-white dark:bg-dark-bg">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl md:text-4xl font-bold font-poppins text-center mb-16 text-gray-800 dark:text-white" data-aos="fade-up">Apa Kata Pelanggan Kami</h2>
                
                {/* Carousel for Mobile */}
                <div className="md:hidden relative" data-aos="fade-up">
                    <div className="overflow-hidden">
                        <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${mobileIndex * 100}%)` }}>
                            {testimonials.map((testimonial) => (
                                <div key={testimonial.name} className="w-full flex-shrink-0 px-2">
                                    <TestimonialCard {...testimonial} />
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setMobileIndex(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${mobileIndex === index ? 'bg-primary scale-125' : 'bg-gray-300 dark:bg-slate-600'}`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Carousel for Tablet & Desktop */}
                <div className="hidden md:block relative" data-aos="fade-up">
                    <div className="overflow-hidden">
                        <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${desktopIndex * 100}%)` }}>
                            {[...Array(desktopSlides)].map((_, pageIndex) => (
                                <div key={pageIndex} className="w-full flex-shrink-0">
                                    <div className="grid grid-cols-3 gap-8">
                                        {testimonials.slice(pageIndex * 3, pageIndex * 3 + 3).map((testimonial) => (
                                            <TestimonialCard key={testimonial.name} {...testimonial} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
                        {[...Array(desktopSlides)].map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setDesktopIndex(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${desktopIndex === index ? 'bg-primary scale-125' : 'bg-gray-300 dark:bg-slate-600'}`}
                                aria-label={`Go to page ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const CtaSection: React.FC = () => (
    <section className="bg-white dark:bg-dark-bg py-24">
        <div className="container mx-auto px-6">
            <div className="bg-primary rounded-3xl text-white text-center py-16 px-6 md:py-20 md:px-12 shadow-2xl" data-aos="zoom-in-up">
                <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-4">Ingin Rumah Selalu Nyaman & Bersih?</h2>
                <p className="mb-8 text-lg text-teal-100 max-w-2xl mx-auto">Jangan tunda lagi, serahkan semua urusan perawatan rumah Anda kepada ahlinya.</p>
                <Link to="/contact" className="bg-white text-primary font-bold px-8 py-3 rounded-full hover:bg-teal-100 transition-all duration-300 transform hover:scale-105 shadow-xl">
                    Pesan Sekarang
                </Link>
            </div>
        </div>
    </section>
);


const HomePage: React.FC = () => {
    return (
        <>
            <HeroSection />
            <WhyChooseUsSection />
            <ServicePreviewSection />
            <HowItWorksSection />
            <TestimonialSection />
            <CtaSection />
        </>
    );
};

export default HomePage;