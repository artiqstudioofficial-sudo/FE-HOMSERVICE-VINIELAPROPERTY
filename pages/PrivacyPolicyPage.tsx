import React from 'react';

const PrivacyHero: React.FC = () => (
    <div className="relative bg-dark-bg">
        <div className="absolute inset-0">
            <img loading="lazy" src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop" alt="Privacy" className="w-full h-full object-cover opacity-30 dark:opacity-40"/>
        </div>
        <div className="relative container mx-auto px-6 py-32 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold font-poppins" data-aos="fade-up">Kebijakan Privasi</h1>
            <p className="text-lg max-w-2xl mx-auto text-gray-300 mt-4" data-aos="fade-up" data-aos-delay="100">
                Privasi Anda penting bagi kami. Dokumen ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.
            </p>
        </div>
    </div>
);

const PrivacyContent: React.FC = () => {
    const sections = [
        {
            title: "1. Informasi yang Kami Kumpulkan",
            content: [
                "Kami mengumpulkan informasi yang Anda berikan langsung kepada kami saat Anda memesan layanan, seperti nama, alamat email, nomor telepon, dan alamat properti.",
                "Kami juga dapat mengumpulkan informasi teknis secara otomatis saat Anda mengunjungi situs kami, seperti alamat IP, jenis browser, dan data penggunaan situs."
            ]
        },
        {
            title: "2. Bagaimana Kami Menggunakan Informasi Anda",
            content: [
                "Untuk memproses dan mengelola pesanan layanan Anda.",
                "Untuk berkomunikasi dengan Anda mengenai pesanan, penawaran, dan pembaruan layanan.",
                "Untuk mengirimkan konfirmasi dan notifikasi terkait jadwal layanan.",
                "Untuk meningkatkan kualitas layanan dan situs web kami."
            ]
        },
        {
            title: "3. Pembagian Informasi",
            content: [
                "Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga.",
                "Kami dapat membagikan informasi Anda kepada teknisi kami untuk tujuan penyelesaian pekerjaan.",
                "Kami dapat membagikan informasi kepada penyedia layanan pihak ketiga yang membantu kami dalam operasi bisnis (misalnya, gateway pembayaran), dengan syarat mereka setuju untuk menjaga kerahasiaan informasi tersebut.",
                "Kami dapat mengungkapkan informasi jika diwajibkan oleh hukum atau untuk melindungi hak dan keamanan kami."
            ]
        },
        {
            title: "4. Keamanan Data",
            content: [
                "Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah. Namun, tidak ada metode transmisi melalui internet atau penyimpanan elektronik yang 100% aman."
            ]
        },
        {
            title: "5. Hak Anda",
            content: [
                "Anda berhak untuk mengakses, memperbaiki, atau meminta penghapusan data pribadi Anda yang kami simpan. Silakan hubungi kami untuk membuat permintaan tersebut."
            ]
        },
        {
            title: "6. Perubahan pada Kebijakan Ini",
            content: [
                "Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Versi terbaru akan selalu diposting di halaman ini. Kami mendorong Anda untuk meninjau kebijakan ini secara berkala."
            ]
        },
        {
            title: "7. Hubungi Kami",
            content: [
                "Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui email di info@viniela.com."
            ]
        }
    ];

    return (
        <section className="py-24 bg-white dark:bg-dark-bg">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-secondary dark:text-slate-300" data-aos="fade-up">
                    <p className="lead">Terakhir diperbarui: 1 Agustus 2024</p>
                    {sections.map(section => (
                        <div key={section.title}>
                            <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">{section.title}</h2>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                {section.content.map((point, index) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const PrivacyPolicyPage: React.FC = () => {
    return (
        <>
            <PrivacyHero />
            <PrivacyContent />
        </>
    );
};

export default PrivacyPolicyPage;