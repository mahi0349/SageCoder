const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
    } catch(e) {}
    throw new Error(errorMsg);
  }
  
  // if response empty or 204
  if(response.status === 204) return null;

  return response.json();
};
