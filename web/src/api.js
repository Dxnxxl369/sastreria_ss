import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE,
});

// Interceptor para inyectar el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const login = (data) => api.post('/auth/login/', data);
export const getDashboardStats = () => api.get('/dashboard-stats/');
export const getSalesReport = () => api.get('/sales-report/');

// Clientes y Usuarios
export const getClients = () => api.get('/clients/');
export const createClient = (data) => api.post('/clients/', data);
export const updateClient = (id, data) => api.put(`/clients/${id}/`, data);
export const getClient = (id) => api.get(`/clients/${id}/`);

export const getUsers = () => api.get('/users/');
export const createUser = (data) => api.post('/users/', data);
export const deleteUser = (id) => api.delete(`/users/${id}/`);

// Medidas
export const getMeasurements = () => api.get('/measurements/');
export const updateMeasurement = (id, data) => api.put(`/measurements/${id}/`, data);

// Ventas
export const createSale = (data) => api.post('/sales/', data);
export const getSales = () => api.get('/sales/');

// Pedidos Web
export const createWebOrder = (data) => api.post('/web-orders/', data);
export const getWebOrders = () => api.get('/web-orders/');

// Notificaciones
export const getNotifications = () => api.get('/notifications/');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/`, { is_read: true });
export const markAllNotificationsRead = () => api.post('/notifications/mark_all_as_read/');

// Inventario (re-exportado para mantener compatibilidad)
export const getProducts = () => api.get('/products/');
export const getCategories = () => api.get('/categories/');
export const createCategory = (data) => api.post('/categories/', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}/`, data);
export const patchCategory = (id, data) => api.patch(`/categories/${id}/`, data);
export const createProduct = (data) => api.post('/products/', data);
export const updateProduct = (id, data) => api.put(`/products/${id}/`, data);
export const patchProduct = (id, data) => api.patch(`/products/${id}/`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}/`);

export default api;
