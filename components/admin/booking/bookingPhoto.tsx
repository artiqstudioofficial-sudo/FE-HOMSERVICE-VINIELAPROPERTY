// components/admin/bookings/BookingPhoto.tsx
import React, { useEffect, useState } from 'react';
import { getPhoto } from '../../../lib/storage';

type Props = {
  photoKey?: string;
  alt: string;
  label: string;
};

const BookingPhoto: React.FC<Props> = ({ photoKey, alt, label }) => {
  const [photoData, setPhotoData] = useState<string | null>(null);

  useEffect(() => {
    if (!photoKey) {
      setPhotoData(null);
      return;
    }

    if (photoKey.startsWith('http://') || photoKey.startsWith('https://')) {
      setPhotoData(photoKey);
      return;
    }

    setPhotoData(getPhoto(photoKey));
  }, [photoKey]);

  if (!photoData) return null;

  return (
    <a href={photoData} target="_blank" rel="noopener noreferrer" className="block">
      <img src={photoData} className="w-20 h-20 object-cover rounded-md" alt={alt} />
      <span className="text-center block text-gray-500 text-[10px]">{label}</span>
    </a>
  );
};

export default BookingPhoto;
