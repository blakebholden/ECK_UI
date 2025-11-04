import type { ElasticsearchCluster, KibanaInstance, ClusterHealth, ClusterStats } from '@types/index';

const API_BASE_URL = '/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, error.message || 'An error occurred');
  }
  return response.json();
}

export const clustersApi = {
  list: async (namespace?: string): Promise<ElasticsearchCluster[]> => {
    const url = namespace
      ? `${API_BASE_URL}/clusters?namespace=${namespace}`
      : `${API_BASE_URL}/clusters`;
    const response = await fetch(url);
    return handleResponse<ElasticsearchCluster[]>(response);
  },

  get: async (namespace: string, name: string): Promise<ElasticsearchCluster> => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}`);
    return handleResponse<ElasticsearchCluster>(response);
  },

  create: async (namespace: string, cluster: Partial<ElasticsearchCluster>): Promise<ElasticsearchCluster> => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cluster),
    });
    return handleResponse<ElasticsearchCluster>(response);
  },

  update: async (namespace: string, name: string, cluster: Partial<ElasticsearchCluster>): Promise<ElasticsearchCluster> => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cluster),
    });
    return handleResponse<ElasticsearchCluster>(response);
  },

  delete: async (namespace: string, name: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to delete cluster');
    }
  },

  getHealth: async (namespace: string, name: string): Promise<ClusterHealth> => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}/health`);
    return handleResponse<ClusterHealth>(response);
  },

  getStats: async (namespace: string, name: string): Promise<ClusterStats> => {
    const response = await fetch(`${API_BASE_URL}/clusters/${namespace}/${name}/stats`);
    return handleResponse<ClusterStats>(response);
  },
};

export const kibanaApi = {
  list: async (namespace?: string): Promise<KibanaInstance[]> => {
    const url = namespace
      ? `${API_BASE_URL}/kibana?namespace=${namespace}`
      : `${API_BASE_URL}/kibana`;
    const response = await fetch(url);
    return handleResponse<KibanaInstance[]>(response);
  },

  get: async (namespace: string, name: string): Promise<KibanaInstance> => {
    const response = await fetch(`${API_BASE_URL}/kibana/${namespace}/${name}`);
    return handleResponse<KibanaInstance>(response);
  },
};

export const namespacesApi = {
  list: async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/namespaces`);
    return handleResponse<string[]>(response);
  },
};
