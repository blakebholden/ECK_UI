import * as k8s from '@kubernetes/client-node';
import { logger } from '../utils/logger.js';

class KubernetesService {
  private kc: k8s.KubeConfig;
  private customApi: k8s.CustomObjectsApi;
  private coreApi: k8s.CoreV1Api;
  private storageApi: k8s.StorageV1Api;

  constructor() {
    this.kc = new k8s.KubeConfig();

    // In development, prefer kubeconfig file; in production (K8s pod), use in-cluster config
    if (process.env.NODE_ENV === 'production' && process.env.KUBERNETES_SERVICE_HOST) {
      try {
        this.kc.loadFromCluster();
        logger.info('Loaded in-cluster Kubernetes configuration');
      } catch (error) {
        logger.warn('Failed to load in-cluster config, falling back to kubeconfig');
        this.kc.loadFromDefault();
        logger.info('Loaded Kubernetes configuration from kubeconfig file');
      }
    } else {
      // Development mode - use local kubeconfig
      try {
        this.kc.loadFromDefault();
        logger.info('Loaded Kubernetes configuration from kubeconfig file');
      } catch (error) {
        logger.error('Failed to load kubeconfig', { error });
        throw new Error('Could not load Kubernetes configuration');
      }
    }

    this.customApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
    this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    this.storageApi = this.kc.makeApiClient(k8s.StorageV1Api);
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
      // Extract detailed error information
      const errorDetails = error.response?.body || error.body || {};
      const errorMessage = errorDetails.message || error.message;

      logger.error('Error creating Elasticsearch cluster', {
        namespace,
        error: errorMessage,
        details: errorDetails,
        statusCode: error.statusCode || error.response?.statusCode
      });
      throw new Error(`Failed to create Elasticsearch cluster: ${errorMessage}`);
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

  async createKibanaInstance(namespace: string, elasticsearchName: string, version: string) {
    try {
      const kibanaSpec = {
        apiVersion: 'kibana.k8s.elastic.co/v1',
        kind: 'Kibana',
        metadata: {
          name: `${elasticsearchName}-kb`,
          namespace
        },
        spec: {
          version,
          count: 1,
          elasticsearchRef: {
            name: elasticsearchName
          },
          http: {
            service: {
              spec: {
                type: 'NodePort' // Use NodePort for easy local access
              }
            },
            tls: {
              selfSignedCertificate: {
                disabled: false
              }
            }
          }
        }
      };

      const response = await this.customApi.createNamespacedCustomObject(
        'kibana.k8s.elastic.co',
        'v1',
        namespace,
        'kibanas',
        kibanaSpec
      );
      return response.body;
    } catch (error: any) {
      logger.error('Error creating Kibana instance', {
        namespace,
        elasticsearchName,
        error: error.message
      });
      throw new Error(`Failed to create Kibana instance: ${error.message}`);
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

  async createNamespace(name: string) {
    try {
      const response = await this.coreApi.createNamespace({
        metadata: {
          name,
        },
      });
      return response.body;
    } catch (error: any) {
      logger.error('Error creating namespace', { name, error: error.message });
      throw new Error(`Failed to create namespace: ${error.message}`);
    }
  }

  async namespaceExists(name: string): Promise<boolean> {
    try {
      await this.coreApi.readNamespace(name);
      return true;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async listNodes() {
    try {
      const response = await this.coreApi.listNode();
      return response.body.items;
    } catch (error: any) {
      logger.error('Error listing nodes', { error: error.message });
      throw new Error(`Failed to list nodes: ${error.message}`);
    }
  }

  async getNodeMetrics() {
    try {
      const nodes = await this.listNodes();

      // Get all pods to calculate pod count per node
      const podsResponse = await this.coreApi.listPodForAllNamespaces();
      const allPods = podsResponse.body.items;

      return nodes.map(node => {
        const nodeName = node.metadata?.name || 'unknown';
        const status = node.status;

        // Calculate capacity and allocatable resources
        const capacity = status?.capacity || {};
        const allocatable = status?.allocatable || {};

        // Get pods running on this node
        const podsOnNode = allPods.filter(pod => pod.spec?.nodeName === nodeName);

        // Calculate used resources from pod requests
        let cpuUsed = 0;
        let memoryUsed = 0;

        podsOnNode.forEach(pod => {
          pod.spec?.containers?.forEach(container => {
            const requests = container.resources?.requests;
            if (requests) {
              // Parse CPU (can be in cores like "0.5" or millicores like "500m")
              if (requests.cpu) {
                const cpuStr = requests.cpu;
                if (cpuStr.endsWith('m')) {
                  cpuUsed += parseInt(cpuStr) / 1000;
                } else {
                  cpuUsed += parseFloat(cpuStr);
                }
              }

              // Parse memory (can be in Ki, Mi, Gi)
              if (requests.memory) {
                const memStr = requests.memory;
                if (memStr.endsWith('Ki')) {
                  memoryUsed += parseInt(memStr) / 1024 / 1024;
                } else if (memStr.endsWith('Mi')) {
                  memoryUsed += parseInt(memStr) / 1024;
                } else if (memStr.endsWith('Gi')) {
                  memoryUsed += parseFloat(memStr);
                }
              }
            }
          });
        });

        // Parse allocatable resources
        const parseCPU = (cpu: string) => {
          if (cpu.endsWith('m')) return parseInt(cpu) / 1000;
          return parseFloat(cpu);
        };

        const parseMemory = (mem: string) => {
          if (mem.endsWith('Ki')) return parseInt(mem) / 1024 / 1024;
          if (mem.endsWith('Mi')) return parseInt(mem) / 1024;
          if (mem.endsWith('Gi')) return parseFloat(mem);
          return 0;
        };

        const cpuAllocatable = allocatable.cpu ? parseCPU(allocatable.cpu) : 0;
        const memoryAllocatable = allocatable.memory ? parseMemory(allocatable.memory) : 0;
        const cpuCapacity = capacity.cpu ? parseCPU(capacity.cpu) : 0;
        const memoryCapacity = capacity.memory ? parseMemory(capacity.memory) : 0;

        return {
          name: nodeName,
          ready: status?.conditions?.find((c: any) => c.type === 'Ready')?.status === 'True',
          capacity: {
            cpu: cpuCapacity,
            memory: memoryCapacity,
            pods: parseInt(capacity.pods || '0'),
          },
          allocatable: {
            cpu: cpuAllocatable,
            memory: memoryAllocatable,
            pods: parseInt(allocatable.pods || '0'),
          },
          used: {
            cpu: cpuUsed,
            memory: memoryUsed,
            pods: podsOnNode.length,
          },
          available: {
            cpu: cpuAllocatable - cpuUsed,
            memory: memoryAllocatable - memoryUsed,
            pods: parseInt(allocatable.pods || '0') - podsOnNode.length,
          },
          labels: node.metadata?.labels || {},
          taints: node.spec?.taints || [],
        };
      });
    } catch (error: any) {
      logger.error('Error getting node metrics', { error: error.message });
      throw new Error(`Failed to get node metrics: ${error.message}`);
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

  async getClusterPods(namespace: string, clusterName: string) {
    try {
      const response = await this.coreApi.listNamespacedPod(
        namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        `elasticsearch.k8s.elastic.co/cluster-name=${clusterName}`
      );
      return response.body.items;
    } catch (error: any) {
      logger.error('Error getting cluster pods', { namespace, clusterName, error: error.message });
      throw new Error(`Failed to get cluster pods: ${error.message}`);
    }
  }

  async getClusterServices(namespace: string, clusterName: string) {
    try {
      const response = await this.coreApi.listNamespacedService(
        namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        `elasticsearch.k8s.elastic.co/cluster-name=${clusterName}`
      );
      return response.body.items;
    } catch (error: any) {
      logger.error('Error getting cluster services', { namespace, clusterName, error: error.message });
      throw new Error(`Failed to get cluster services: ${error.message}`);
    }
  }

  async getClusterEvents(namespace: string, clusterName: string) {
    try {
      const response = await this.coreApi.listNamespacedEvent(namespace);
      // Filter events related to this cluster
      const clusterEvents = response.body.items.filter(event =>
        event.involvedObject?.name?.includes(clusterName)
      );
      return clusterEvents;
    } catch (error: any) {
      logger.error('Error getting cluster events', { namespace, clusterName, error: error.message });
      throw new Error(`Failed to get cluster events: ${error.message}`);
    }
  }

  async getKibanaPods(namespace: string, kibanaName: string) {
    try {
      const response = await this.coreApi.listNamespacedPod(
        namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        `kibana.k8s.elastic.co/name=${kibanaName}`
      );
      return response.body.items;
    } catch (error: any) {
      logger.error('Error getting Kibana pods', { namespace, kibanaName, error: error.message });
      throw new Error(`Failed to get Kibana pods: ${error.message}`);
    }
  }

  async getKibanaService(namespace: string, kibanaName: string) {
    try {
      const response = await this.coreApi.listNamespacedService(
        namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        `kibana.k8s.elastic.co/name=${kibanaName}`
      );
      return response.body.items[0];
    } catch (error: any) {
      logger.error('Error getting Kibana service', { namespace, kibanaName, error: error.message });
      throw new Error(`Failed to get Kibana service: ${error.message}`);
    }
  }

  async listStorageClasses() {
    try {
      const response = await this.storageApi.listStorageClass();
      return response.body.items.map(sc => ({
        name: sc.metadata?.name,
        provisioner: sc.provisioner,
        reclaimPolicy: sc.reclaimPolicy,
        volumeBindingMode: sc.volumeBindingMode,
        allowVolumeExpansion: sc.allowVolumeExpansion,
        isDefault: sc.metadata?.annotations?.['storageclass.kubernetes.io/is-default-class'] === 'true',
        parameters: sc.parameters
      }));
    } catch (error: any) {
      logger.error('Error listing storage classes', { error: error.message });
      throw new Error(`Failed to list storage classes: ${error.message}`);
    }
  }
}

export const k8sService = new KubernetesService();
