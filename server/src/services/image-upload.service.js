import axios from 'axios';

/**
 * Upload an image to ImgBB
 * @param {string} base64Image - Base64 encoded image data (without data URL prefix)
 * @param {string} apiKey - ImgBB API key
 * @returns {Promise<Object>} - Response from ImgBB API containing image URL and metadata
 */
export const uploadImageToImgbb = async (base64Image, apiKey) => {
  try {
    // Create FormData to match ImgBB's expected format
    const params = new URLSearchParams();
    params.append('image', base64Image);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error('Failed to upload image to ImgBB');
    }
  } catch (error) {
    console.error('Error uploading image to ImgBB:', error);
    throw error;
  }
};

/**
 * Convert a File object to base64 string
 * @param {File} file - File object to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data URL prefix (e.g., 'data:image/jpeg;base64,')
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};