import { createApiClient } from './apiWrapper';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = createApiClient(API_BASE_URL);

export default api;