import React from 'react';

const AboutHero: React.FC = () => (
    <div className="relative bg-dark-bg">
        <div className="absolute inset-0">
            <img 
                loading="lazy" 
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2070&auto=format&fit=crop" 
                alt="Tim profesional Viniela Group sedang berdiskusi di kantor modern" 
                className="w-full h-full object-cover opacity-30 dark:opacity-40"
            />
        </div>
        <div className="relative container mx-auto px-6 py-32 md:py-40 text-center text-white">
            <h1 
                className="text-4xl md:text-6xl font-bold font-poppins leading-tight mb-4 text-white" 
                data-aos="fade-up"
            >
                Tentang Viniela Home & Service
            </h1>
            <p 
                className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300" 
                data-aos="fade-up" 
                data-aos-delay="100"
            >
                Sebagai bagian dari Viniela Group, kami membawa standar keunggulan korporat ke dalam setiap layanan perawatan rumah Anda.
            </p>
        </div>
    </div>
);

const OurStorySection: React.FC = () => (
    <section className="py-24 bg-white dark:bg-dark-bg">
        <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                <div data-aos="fade-right" className="order-2 lg:order-1">
                    <span className="text-sm font-bold tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">CERITA KAMI</span>
                    <h2 className="text-3xl md:text-4xl font-bold font-poppins mt-4 mb-6 text-gray-800 dark:text-white">Dari Grup Terpercaya, Lahirlah Layanan Terbaik.</h2>
                    <div className="space-y-4 text-secondary dark:text-slate-300 text-base leading-relaxed">
                        <p>Viniela Group telah lama dikenal sebagai pemain utama di industri properti dan desain, berkomitmen membangun ruang hidup yang berkualitas. Dari pengalaman kami, kami menyadari adanya satu kebutuhan krusial yang sering terlewatkan oleh para pemilik properti: perawatan purna jual yang profesional dan terpercaya.</p>
                        <p>Untuk itulah Viniela Home & Service didirikan. Kami adalah jawaban atas kebutuhan tersebut—sebuah divisi khusus yang didedikasikan untuk memastikan setiap properti, baik yang kami bangun maupun milik Anda, senantiasa dalam kondisi prima.</p>
                        <p>Dengan membawa DNA kualitas dan profesionalisme dari Viniela Group, kami menghadirkan layanan perawatan rumah yang terstandarisasi, efisien, dan dapat diandalkan, mulai dari perbaikan teknis hingga kebersihan menyeluruh.</p>
                    </div>
                </div>
                <div className="order-1 lg:order-2" data-aos="fade-left">
                     <img loading="lazy" src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" alt="Tim Viniela Group berdiskusi" className="rounded-2xl shadow-2xl w-full h-full object-cover"/>
                </div>
            </div>
        </div>
    </section>
);


const TeamSection: React.FC = () => {
     const team = [
        { name: 'Ahmad Yusuf', role: 'Teknisi Senior', image: 'https://i.pravatar.cc/200?u=man1' },
        { name: 'Siti Aminah', role: 'Customer Support', image: 'https://i.pravatar.cc/200?u=woman1' },
        { name: 'Bambang Wijoyo', role: 'Spesialis Plumbing', image: 'https://i.pravatar.cc/200?u=man2' },
        { name: 'Dewi Lestari', role: 'Kepala Tim Kebersihan', image: 'https://i.pravatar.cc/200?u=woman2' },
    ];
    return (
        <section className="py-24 bg-light-bg dark:bg-slate-900">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold font-poppins mb-12 text-gray-800 dark:text-white" data-aos="fade-up">Tim Profesional Kami</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {team.map((member, index) => (
                        <div key={member.name} className="group text-center" data-aos="fade-up" data-aos-delay={100 * index}>
                            <div className="relative inline-block">
                                <img loading="lazy" src={member.image} alt={member.name} className="w-40 h-40 rounded-full mx-auto mb-4 shadow-lg transition-transform duration-300 group-hover:scale-105"/>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent group-hover:border-primary transition-all duration-300 scale-110 group-hover:scale-100 opacity-0 group-hover:opacity-100"></div>
                            </div>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white mt-4">{member.name}</h4>
                            <p className="text-primary font-medium">{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ValuesSection: React.FC = () => {
    const values = [
        { 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            title: 'Kepercayaan',
            description: 'Kami membangun hubungan jangka panjang dengan pelanggan berdasarkan integritas dan transparansi.' 
        },
        { 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
            title: 'Profesionalisme', 
            description: 'Setiap pekerjaan ditangani oleh tenaga ahli yang kompeten dan berpengalaman di bidangnya.' 
        },
        { 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
            title: 'Kualitas Layanan', 
            description: 'Kami berkomitmen untuk memberikan hasil terbaik yang melebihi ekspektasi pelanggan.' 
        },
    ];
    return(
        <section className="py-24 bg-white dark:bg-dark-bg">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold font-poppins text-center mb-12 text-gray-800 dark:text-white" data-aos="fade-up">Nilai Inti Grup Viniela</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {values.map((value, index) => (
                         <div key={value.title} className="bg-light-bg dark:bg-slate-800 p-8 rounded-xl shadow-lg border-t-4 border-primary" data-aos="fade-up" data-aos-delay={100 * index}>
                            <div className="mb-4">
                                {value.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{value.title}</h3>
                            <p className="text-secondary dark:text-slate-300">{value.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const AboutPage: React.FC = () => {
    return (
        <>
            <AboutHero />
            <OurStorySection />
            <ValuesSection />
            <TeamSection />
        </>
    );
};

export default AboutPage;