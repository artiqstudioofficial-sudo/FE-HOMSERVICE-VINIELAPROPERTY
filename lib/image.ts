// lib/image.ts

const MAX_WIDTH = 1024;
const MAX_HEIGHT = 1024;
const JPEG_QUALITY = 0.8; // 80% quality

/**
 * Compresses an image represented by a base64 string.
 * @param base64Str The original base64 string of the image.
 * @returns A promise that resolves with the compressed base64 string (JPEG format).
 */
export const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;

        img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get 2D context from canvas'));
            }

            // Draw the image onto the canvas with the new dimensions
            ctx.drawImage(img, 0, 0, width, height);

            // Get the data URL for the resized image in JPEG format
            const compressedBase64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
            
            resolve(compressedBase64);
        };

        img.onerror = (error) => {
            console.error("Failed to load image for compression", error);
            reject(new Error('Image could not be loaded for compression.'));
        };
    });
};