import { Client } from '@elastic/elasticsearch';
import { k8sService } from './kubernetes.service.js';
import { logger } from '../utils/logger.js';

class ElasticsearchService {
  private getClient(url: string, username: string, password: string): Client {
    return new Client({
      node: url,
      auth: { username, password },
      tls: { rejectUnauthorized: false }, // For self-signed certs
    });
  }

  async getClusterCredentials(namespace: string, clusterName: string) {
    try {
      const secretName = `${clusterName}-es-elastic-user`;
      const secret = await k8sService.getSecret(namespace, secretName);

      if (!secret.data) {
        throw new Error('Secret data not found');
      }

      const password = Buffer.from(secret.data['elastic'], 'base64').toString('utf-8');
      return { username: 'elastic', password };
    } catch (error: any) {
      logger.error('Error getting cluster credentials', {
        namespace,
        clusterName,
        error: error.message
      });
      throw new Error(`Failed to get cluster credentials: ${error.message}`);
    }
  }

  async getClusterHealth(namespace: string, clusterName: string) {
    try {
      const credentials = await this.getClusterCredentials(namespace, clusterName);
      const url = `https://${clusterName}-es-http.${namespace}.svc:9200`;
      const client = this.getClient(url, credentials.username, credentials.password);

      const health = await client.cluster.health();
      return health;
    } catch (error: any) {
      logger.error('Error getting cluster health', {
        namespace,
        clusterName,
        error: error.message
      });
      throw new Error(`Failed to get cluster health: ${error.message}`);
    }
  }

  async getClusterStats(namespace: string, clusterName: string) {
    try {
      const credentials = await this.getClusterCredentials(namespace, clusterName);
      const url = `https://${clusterName}-es-http.${namespace}.svc:9200`;
      const client = this.getClient(url, credentials.username, credentials.password);

      const stats = await client.cluster.stats();
      return stats;
    } catch (error: any) {
      logger.error('Error getting cluster stats', {
        namespace,
        clusterName,
        error: error.message
      });
      throw new Error(`Failed to get cluster stats: ${error.message}`);
    }
  }
}

export const esService = new ElasticsearchService();
