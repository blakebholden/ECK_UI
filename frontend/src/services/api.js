import { mockClusters, mockKibana, USE_MOCK_DATA } from '../utils/mockData';

const API_BASE_URL = '/api/v1';

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, error.message || 'An error occurred');
  }
  return response.json();
}

export const clustersApi = {
  list: async (namespace) => {
    if (USE_MOCK_DATA) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return namespace
        ? mockClusters.filter(c => c.metadata.namespace === namespace)
        : mockClusters;
    }

    const url = namespace
      ? `${API_BASE_URL}/clusters?namespace=${namespace}`
      : `${API_BASE_URL}/clusters`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  get: async (namespace, name) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const cluster = mockClusters.find(
        c => c.metadata.namespace === namespace && c.metadata.name === name
      );
      if (!cluster) {
        throw new ApiError(404, 'Cluster not found');
      }
      return cluster;
    }

    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}`);
    return handleResponse(response);
  },

  create: async (namespace, cluster) => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cluster),
    });
    return handleResponse(response);
  },

  update: async (namespace, name, cluster) => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cluster),
    });
    return handleResponse(response);
  },

  delete: async (namespace, name) => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to delete cluster');
    }
  },

  getHealth: async (namespace, name) => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}/health`);
    return handleResponse(response);
  },

  getStats: async (namespace, name) => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}/stats`);
    return handleResponse(response);
  },

  getDetails: async (namespace, name) => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}/details`);
    return handleResponse(response);
  },

  getKibanaUrl: async (namespace, name) => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}/kibana-url`);
    return handleResponse(response);
  },

  getCredentials: async (namespace, name) => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}/credentials`);
    return handleResponse(response);
  },
};

export const kibanaApi = {
  list: async (namespace) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return namespace
        ? mockKibana.filter(k => k.metadata.namespace === namespace)
        : mockKibana;
    }

    const url = namespace
      ? `${API_BASE_URL}/kibana?namespace=${namespace}`
      : `${API_BASE_URL}/kibana`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  get: async (namespace, name) => {
    const response = await fetch(`${API_BASE_URL}/kibana/${namespace}/${name}`);
    return handleResponse(response);
  },
};

export const namespacesApi = {
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/namespaces`);
    return handleResponse(response);
  },
};

export const capacityApi = {
  get: async () => {
    const response = await fetch(`${API_BASE_URL}/capacity`);
    return handleResponse(response);
  },
};

export const storageApi = {
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/storage`);
    return handleResponse(response);
  },
};
