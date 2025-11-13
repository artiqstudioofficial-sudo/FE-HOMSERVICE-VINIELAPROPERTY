import React, { useState, useEffect } from 'react';
import { Service, serviceIcons } from '../config/services';
import { X, PlusCircle, XCircle } from 'lucide-react';

interface ServiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (service: Service, category: string) => void;
    serviceToEdit: Service | null;
    categoryToEdit: string | null;
    allCategories: string[];
}

const defaultService: Omit<Service, 'name'> = {
    icon: 'Wrench',
    description: '',
    duration: 60,
    price: 0,
    priceUnit: 'unit',
    includes: [],
    excludes: [],
    guarantee: false,
    durationDays: 1,
};

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ isOpen, onClose, onSave, serviceToEdit, categoryToEdit, allCategories }) => {
    const [formData, setFormData] = useState<Service>(serviceToEdit || { name: '', ...defaultService });
    const [category, setCategory] = useState(categoryToEdit || (allCategories.length > 0 ? allCategories[0] : ''));
    const [newCategory, setNewCategory] = useState('');
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [includeInput, setIncludeInput] = useState('');
    const [excludeInput, setExcludeInput] = useState('');
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [displayPrice, setDisplayPrice] = useState('0');


    useEffect(() => {
        if (isOpen) {
            if (serviceToEdit) {
                setFormData(serviceToEdit);
                setCategory(categoryToEdit || '');
                setDisplayPrice(new Intl.NumberFormat('id-ID').format(serviceToEdit.price));
                setIsNewCategory(false);
                setNewCategory('');
            } else {
                setFormData({ name: '', ...defaultService });
                setDisplayPrice('0');
                setCategory(allCategories.length > 0 ? allCategories[0] : '');
            }
            setIncludeInput('');
            setExcludeInput('');
            setErrors({});
        }
    }, [serviceToEdit, categoryToEdit, isOpen, allCategories]);
    
     useEffect(() => {
        if (category === '__NEW__') {
            setIsNewCategory(true);
        } else {
            setIsNewCategory(false);
            setNewCategory('');
        }
    }, [category]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);

        if (!isNaN(numericValue)) {
            setFormData(prev => ({ ...prev, price: numericValue }));
            setDisplayPrice(new Intl.NumberFormat('id-ID').format(numericValue));
        } else {
            setFormData(prev => ({ ...prev, price: 0 }));
            setDisplayPrice('0');
        }
    };
    
    const handleAddItem = (field: 'includes' | 'excludes') => {
        const input = field === 'includes' ? includeInput : excludeInput;
        if (input.trim()) {
            setFormData(prev => ({
                ...prev,
                [field]: [...prev[field], input.trim()]
            }));
            if (field === 'includes') {
                setIncludeInput('');
            } else {
                setExcludeInput('');
            }
        }
    };

    const handleRemoveItem = (field: 'includes' | 'excludes', index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'includes' | 'excludes') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem(field);
        }
    };

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};
        const finalCategory = isNewCategory ? newCategory.trim() : category;

        if (!formData.name.trim()) {
            newErrors.name = 'Nama layanan wajib diisi.';
        }
        if (!finalCategory || finalCategory === '__NEW__') {
            newErrors.category = 'Kategori wajib diisi.';
        }
        if (formData.price <= 0) {
            newErrors.price = 'Harga harus lebih dari 0.';
        }
        if (formData.duration <= 0) {
            newErrors.duration = 'Durasi (menit) harus lebih dari 0.';
        }
        if ((formData.durationDays || 0) <= 0) {
            newErrors.durationDays = 'Durasi (hari) harus lebih dari 0.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            const finalCategory = isNewCategory ? newCategory.trim() : category;
            onSave(formData, finalCategory);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">
                            {serviceToEdit ? 'Edit Layanan' : 'Tambah Layanan Baru'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="Tutup">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Name and Category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Layanan</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange}
                                    readOnly={!!serviceToEdit}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary read-only:bg-gray-100 dark:read-only:bg-slate-600" />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                {!!serviceToEdit && <p className="text-xs text-gray-400 mt-1">Nama layanan tidak dapat diubah.</p>}
                            </div>
                            <div>
                                 <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
                                 <select name="category" id="category" value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary">
                                    {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    <option value="__NEW__">-- Buat Kategori Baru --</option>
                                 </select>
                            </div>
                        </div>
                        {isNewCategory && (
                            <div>
                                <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Kategori Baru</label>
                                <input type="text" name="newCategory" id="newCategory" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary" />
                            </div>
                        )}
                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                        
                        {/* Description */}
                        <div>
                             <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi</label>
                             <textarea name="description" id="description" rows={3} value={formData.description} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary" />
                        </div>

                        {/* Price, Duration, Icon */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Harga</label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">Rp</span>
                                    <input type="text" name="price" id="price" value={displayPrice} onChange={handlePriceChange} inputMode="numeric" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary pl-9" />
                                </div>
                                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                            </div>
                            <div>
                                 <label htmlFor="priceUnit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Satuan Harga</label>
                                 <select name="priceUnit" id="priceUnit" value={formData.priceUnit} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary">
                                     <option value="unit">unit</option>
                                     <option value="jam">jam</option>
                                     <option value="kg">kg</option>
                                     <option value="m²">m²</option>
                                 </select>
                            </div>
                            <div>
                                 <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ikon</label>
                                 <select name="icon" id="icon" value={formData.icon} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary">
                                     {Object.keys(serviceIcons).map(iconKey => <option key={iconKey} value={iconKey}>{iconKey}</option>)}
                                 </select>
                            </div>
                        </div>

                        {/* Duration & Guarantee */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Durasi (menit)</label>
                                <input type="number" name="duration" id="duration" value={formData.duration} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary" />
                                {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
                            </div>
                            <div>
                                <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Durasi (hari)</label>
                                <input type="number" name="durationDays" id="durationDays" value={formData.durationDays || 1} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary" />
                                {errors.durationDays && <p className="text-red-500 text-xs mt-1">{errors.durationDays}</p>}
                            </div>
                             <div className="flex items-center pt-6">
                                <input type="checkbox" name="guarantee" id="guarantee" checked={formData.guarantee || false} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                <label htmlFor="guarantee" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Bergaransi</label>
                            </div>
                        </div>

                        {/* Includes & Excludes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="includes-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Termasuk</label>
                                <div className="flex gap-2 mt-1">
                                    <input
                                        id="includes-input"
                                        type="text"
                                        value={includeInput}
                                        onChange={(e) => setIncludeInput(e.target.value)}
                                        onKeyDown={(e) => handleInputKeyDown(e, 'includes')}
                                        className="block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                                        placeholder="Tambahkan poin..."
                                    />
                                    <button type="button" onClick={() => handleAddItem('includes')} className="flex-shrink-0 bg-primary text-white p-2.5 rounded-lg hover:bg-primary-dark transition-colors" aria-label="Tambah item Termasuk">
                                        <PlusCircle size={20} />
                                    </button>
                                </div>
                                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-2">
                                    {formData.includes.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center bg-light-bg dark:bg-slate-700 p-2 rounded-md text-sm animate-fade-in">
                                            <span className="text-gray-800 dark:text-gray-200">{item}</span>
                                            <button type="button" onClick={() => handleRemoveItem('includes', index)} className="text-red-500 hover:text-red-700" aria-label={`Hapus item ${item}`}>
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label htmlFor="excludes-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tidak Termasuk</label>
                                <div className="flex gap-2 mt-1">
                                    <input
                                        id="excludes-input"
                                        type="text"
                                        value={excludeInput}
                                        onChange={(e) => setExcludeInput(e.target.value)}
                                        onKeyDown={(e) => handleInputKeyDown(e, 'excludes')}
                                        className="block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                                        placeholder="Tambahkan poin..."
                                    />
                                    <button type="button" onClick={() => handleAddItem('excludes')} className="flex-shrink-0 bg-primary text-white p-2.5 rounded-lg hover:bg-primary-dark transition-colors" aria-label="Tambah item Tidak Termasuk">
                                        <PlusCircle size={20} />
                                    </button>
                                </div>
                                 <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-2">
                                    {formData.excludes.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center bg-light-bg dark:bg-slate-700 p-2 rounded-md text-sm animate-fade-in">
                                            <span className="text-gray-800 dark:text-gray-200">{item}</span>
                                            <button type="button" onClick={() => handleRemoveItem('excludes', index)} className="text-red-500 hover:text-red-700" aria-label={`Hapus item ${item}`}>
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-light-bg dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 rounded-b-2xl flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-gray-200 font-bold px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors">
                            Batal
                        </button>
                        <button type="submit" className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                            Simpan Layanan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServiceFormModal;