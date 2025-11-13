
import React from 'react';
import { Link } from 'react-router-dom';

const SocialIcon: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary bg-gray-700 hover:bg-gray-600 rounded-full p-2.5 transition-colors">
        {children}
    </a>
);


const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-bg text-white pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start">
                 <Link to="/" className="flex items-center space-x-2.5 mb-4">
                    <svg className="h-8 w-auto text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-3xl font-bold text-white font-poppins">Viniela</span>
                </Link>
                 <p className="text-gray-400 max-w-xs">Solusi modern untuk semua kebutuhan perawatan dan perbaikan rumah Anda.</p>
            </div>
             <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8">
                <div>
                    <h4 className="font-bold text-lg mb-4 text-white">Navigasi</h4>
                    <nav className="flex flex-col space-y-2">
                        <Link to="/" className="text-gray-300 hover:text-primary">Home</Link>
                        <Link to="/services" className="text-gray-300 hover:text-primary">Services</Link>
                        <Link to="/about" className="text-gray-300 hover:text-primary">About</Link>
                        <Link to="/faq" className="text-gray-300 hover:text-primary">FAQ</Link>
                        <Link to="/login" className="text-gray-300 hover:text-primary">Login Management</Link>
                    </nav>
                </div>
                 <div>
                    <h4 className="font-bold text-lg mb-4 text-white">Kontak</h4>
                    <div className="flex flex-col space-y-2 text-gray-300">
                        <a href="mailto:info@viniela.com" className="hover:text-primary">info@viniela.com</a>
                        <a href="tel:+628123456789" className="hover:text-primary">+62-812-3456-789</a>
                    </div>
                </div>
                 <div className="col-span-2 sm:col-span-1">
                    <h4 className="font-bold text-lg mb-4 text-white">Kantor Kami</h4>
                    <p className="text-gray-300 mb-4">Jl. Jend. Sudirman No.1, Jakarta Pusat, Indonesia</p>
                    <div className="rounded-lg overflow-hidden h-32 mb-4">
                         <iframe 
                            title="Viniela Location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.577174627993!2d106.8194423759972!3d-6.18721546061324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f42369073175%3A0x347081258000a49!2sJl.%20Jenderal%20Sudirman%2C%20RT.10%2FRW.11%2C%20Karet%20Tengsin%2C%20Kecamatan%20Tanah%20Abang%2C%20Kota%20Jakarta%20Pusat%2C%20Daerah%20Khusus%20Ibukota%20Jakarta!5e0!3m2!1sen!2sid!4v1690000000000!5m2!1sen!2sid" 
                            className="w-full h-full border-0" 
                            allowFullScreen={false} 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade">
                        </iframe>
                    </div>
                    <a
                        href="https://www.google.com/maps/dir/?api=1&destination=-6.18721546061324,106.8194423759972"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors w-full"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                        Arahkan ke Lokasi
                    </a>
                </div>
            </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Viniela Home & Service. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
            <Link to="/privacy-policy" className="hover:text-white">Privacy & Policy</Link>
            <Link to="/faq" className="hover:text-white">FAQ</Link>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;