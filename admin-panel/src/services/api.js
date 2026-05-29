import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-ef1c.up.railway.app/api';

const createApiClient = (token) => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/admin/login`, {
    username,
    password
  });
  return response.data;
};

export const uploadSalesFile = async (token, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_URL}/admin/upload-sales`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const processPoints = async (token) => {
  const api = createApiClient(token);
  const response = await api.post('/admin/process-points');
  return response.data;
};

export const getSalesRecords = async (token, startDate, endDate) => {
  const api = createApiClient(token);
  const response = await api.get('/admin/sales', {
    params: { startDate, endDate }
  });
  return response.data;
};

export const getRewards = async (token) => {
  const api = createApiClient(token);
  const response = await api.get('/admin/rewards');
  return response.data;
};

export const createReward = async (token, rewardData) => {
  const api = createApiClient(token);
  const response = await api.post('/admin/rewards', rewardData);
  return response.data;
};

export const updateReward = async (token, rewardId, updates) => {
  const api = createApiClient(token);
  const response = await api.put(`/admin/rewards/${rewardId}`, updates);
  return response.data;
};

export const getPendingSalesPreview = async (token) => {
  const api = createApiClient(token);
  const response = await api.get('/admin/sales/pending-preview');
  return response.data;
};

export const deleteSalesBatch = async (token, batchId) => {
  const api = createApiClient(token);
  const response = await api.delete(`/admin/sales/batch/${batchId}`);
  return response.data;
};

export const getAllUsers = async (token) => {
  const api = createApiClient(token);
  const response = await api.get('/admin/users');
  return response.data;
};

export const deleteReward = async (token, rewardId) => {
  const api = createApiClient(token);
  const response = await api.delete(`/admin/rewards/${rewardId}`);
  return response.data;
};

export const getRedemptions = async (token, status = null) => {
  const api = createApiClient(token);
  const response = await api.get('/admin/redemptions', {
    params: { status }
  });
  return response.data;
};

export const updateRedemptionStatus = async (token, redemptionId, status, notes) => {
  const api = createApiClient(token);
  const response = await api.put(`/admin/redemptions/${redemptionId}`, {
    status,
    notes
  });
  return response.data;
};
