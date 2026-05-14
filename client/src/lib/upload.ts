import { apiFetch, apiUrl } from './api';

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const res = await apiFetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Error al subir la imagen');
  }

  return apiUrl(json.data.url);
};
