import * as k8s from '@kubernetes/client-node';
import { logger } from '../utils/logger.js';

class KubernetesService {
  private kc: k8s.KubeConfig;
  private customApi: k8s.CustomObjectsApi;
  private coreApi: k8s.CoreV1Api;

  constructor() {
    this.kc = new k8s.KubeConfig();

    // Try to load config (in-cluster or from kubeconfig file)
    try {
      this.kc.loadFromCluster();
      logger.info('Loaded in-cluster Kubernetes configuration');
    } catch (error) {
      this.kc.loadFromDefault();
      logger.info('Loaded Kubernetes configuration from kubeconfig file');
    }

    this.customApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
    this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
  }

  async listElasticsearchClusters(namespace?: string) {
    try {
      if (namespace) {
        const response = await this.customApi.listNamespacedCustomObject(
          'elasticsearch.k8s.elastic.co',
          'v1',
          namespace,
          'elasticsearches'
        );
        return (response.body as any).items;
      } else {
        const response = await this.customApi.listClusterCustomObject(
          'elasticsearch.k8s.elastic.co',
          'v1',
          'elasticsearches'
        );
        return (response.body as any).items;
      }
    } catch (error: any) {
      logger.error('Error listing Elasticsearch clusters', { error: error.message });
      throw new Error(`Failed to list Elasticsearch clusters: ${error.message}`);
    }
  }

  async getElasticsearchCluster(namespace: string, name: string) {
    try {
      const response = await this.customApi.getNamespacedCustomObject(
        'elasticsearch.k8s.elastic.co',
        'v1',
        namespace,
        'elasticsearches',
        name
      );
      return response.body;
    } catch (error: any) {
      logger.error('Error getting Elasticsearch cluster', {
        namespace,
        name,
        error: error.message
      });
      throw new Error(`Failed to get Elasticsearch cluster: ${error.message}`);
    }
  }

  async createElasticsearchCluster(namespace: string, spec: any) {
    try {
      const response = await this.customApi.createNamespacedCustomObject(
        'elasticsearch.k8s.elastic.co',
        'v1',
        namespace,
        'elasticsearches',
        spec
      );
      return response.body;
    } catch (error: any) {
      logger.error('Error creating Elasticsearch cluster', {
        namespace,
        error: error.message
      });
      throw new Error(`Failed to create Elasticsearch cluster: ${error.message}`);
    }
  }

  async updateElasticsearchCluster(namespace: string, name: string, spec: any) {
    try {
      const response = await this.customApi.patchNamespacedCustomObject(
        'elasticsearch.k8s.elastic.co',
        'v1',
        namespace,
        'elasticsearches',
        name,
        spec,
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
      return response.body;
    } catch (error: any) {
      logger.error('Error updating Elasticsearch cluster', {
        namespace,
        name,
        error: error.message
      });
      throw new Error(`Failed to update Elasticsearch cluster: ${error.message}`);
    }
  }

  async deleteElasticsearchCluster(namespace: string, name: string) {
    try {
      await this.customApi.deleteNamespacedCustomObject(
        'elasticsearch.k8s.elastic.co',
        'v1',
        namespace,
        'elasticsearches',
        name
      );
    } catch (error: any) {
      logger.error('Error deleting Elasticsearch cluster', {
        namespace,
        name,
        error: error.message
      });
      throw new Error(`Failed to delete Elasticsearch cluster: ${error.message}`);
    }
  }

  async listKibanaInstances(namespace?: string) {
    try {
      if (namespace) {
        const response = await this.customApi.listNamespacedCustomObject(
          'kibana.k8s.elastic.co',
          'v1',
          namespace,
          'kibanas'
        );
        return (response.body as any).items;
      } else {
        const response = await this.customApi.listClusterCustomObject(
          'kibana.k8s.elastic.co',
          'v1',
          'kibanas'
        );
        return (response.body as any).items;
      }
    } catch (error: any) {
      logger.error('Error listing Kibana instances', { error: error.message });
      throw new Error(`Failed to list Kibana instances: ${error.message}`);
    }
  }

  async getKibanaInstance(namespace: string, name: string) {
    try {
      const response = await this.customApi.getNamespacedCustomObject(
        'kibana.k8s.elastic.co',
        'v1',
        namespace,
        'kibanas',
        name
      );
      return response.body;
    } catch (error: any) {
      logger.error('Error getting Kibana instance', {
        namespace,
        name,
        error: error.message
      });
      throw new Error(`Failed to get Kibana instance: ${error.message}`);
    }
  }

  async listNamespaces() {
    try {
      const response = await this.coreApi.listNamespace();
      return response.body.items.map(ns => ns.metadata?.name).filter(Boolean);
    } catch (error: any) {
      logger.error('Error listing namespaces', { error: error.message });
      throw new Error(`Failed to list namespaces: ${error.message}`);
    }
  }

  async getSecret(namespace: string, name: string) {
    try {
      const response = await this.coreApi.readNamespacedSecret(name, namespace);
      return response.body;
    } catch (error: any) {
      logger.error('Error getting secret', { namespace, name, error: error.message });
      throw new Error(`Failed to get secret: ${error.message}`);
    }
  }
}

export const k8sService = new KubernetesService();
