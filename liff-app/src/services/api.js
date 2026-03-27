import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-ef1c.up.railway.app/api';

const createApiClient = (accessToken) => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
};

export const getProfile = async (accessToken) => {
  const api = createApiClient(accessToken);
  const response = await api.get('/user/profile');
  return response.data;
};

export const getPoints = async (accessToken) => {
  const api = createApiClient(accessToken);
  const response = await api.get('/user/points');
  return response.data;
};

export const getPointsHistory = async (accessToken, limit = 50, offset = 0) => {
  const api = createApiClient(accessToken);
  const response = await api.get('/user/points/history', {
    params: { limit, offset }
  });
  return response.data;
};

export const getSalesHistory = async (accessToken, limit = 50) => {
  const api = createApiClient(accessToken);
  const response = await api.get('/user/sales/history', {
    params: { limit }
  });
  return response.data;
};

export const getRewards = async (accessToken) => {
  const api = createApiClient(accessToken);
  const response = await api.get('/user/rewards');
  return response.data;
};

export const redeemReward = async (accessToken, rewardId) => {
  const api = createApiClient(accessToken);
  const response = await api.post('/user/redeem', { rewardId });
  return response.data;
};

export const getRedemptions = async (accessToken, limit = 50) => {
  const api = createApiClient(accessToken);
  const response = await api.get('/user/redemptions', {
    params: { limit }
  });
  return response.data;
};
