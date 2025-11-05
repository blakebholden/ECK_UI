import { Router } from 'express';
import { k8sService } from '../services/kubernetes.service.js';
import { esService } from '../services/elasticsearch.service.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// List all clusters or clusters in a specific namespace
router.get('/', async (req, res, next) => {
  try {
    const namespace = req.query.namespace as string | undefined;
    const clusters = await k8sService.listElasticsearchClusters(namespace);
    res.json(clusters);
  } catch (error) {
    next(error);
  }
});

// Get specific cluster
router.get('/:namespace/:name', async (req, res, next) => {
  try {
    const { namespace, name } = req.params;
    const cluster = await k8sService.getElasticsearchCluster(namespace, name);
    res.json(cluster);
  } catch (error) {
    next(error);
  }
});

// Get cluster details (comprehensive info including pods, services, events)
router.get('/:namespace/:name/details', async (req, res, next) => {
  try {
    const { namespace, name } = req.params;

    // Fetch all data in parallel
    const [cluster, pods, services, events, kibana] = await Promise.allSettled([
      k8sService.getElasticsearchCluster(namespace, name),
      k8sService.getClusterPods(namespace, name),
      k8sService.getClusterServices(namespace, name),
      k8sService.getClusterEvents(namespace, name),
      k8sService.getKibanaInstance(namespace, `${name}-kb`).catch(() => null)
    ]);

    const result: any = {
      cluster: cluster.status === 'fulfilled' ? cluster.value : null,
      pods: pods.status === 'fulfilled' ? pods.value : [],
      services: services.status === 'fulfilled' ? services.value : [],
      events: events.status === 'fulfilled' ? events.value : [],
      kibana: kibana.status === 'fulfilled' ? kibana.value : null
    };

    // If Kibana exists, get its pods and service
    if (result.kibana) {
      const [kibanaPods, kibanaService] = await Promise.allSettled([
        k8sService.getKibanaPods(namespace, `${name}-kb`),
        k8sService.getKibanaService(namespace, `${name}-kb`)
      ]);

      result.kibanaPods = kibanaPods.status === 'fulfilled' ? kibanaPods.value : [];
      result.kibanaService = kibanaService.status === 'fulfilled' ? kibanaService.value : null;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Create cluster
router.post('/:namespace', async (req, res, next) => {
  try {
    const { namespace } = req.params;
    const spec = req.body;

    if (!spec || !spec.metadata || !spec.spec) {
      throw new ApiError(400, 'Invalid cluster specification');
    }

    // Ensure namespace exists, create if it doesn't
    const exists = await k8sService.namespaceExists(namespace);
    if (!exists) {
      await k8sService.createNamespace(namespace);
    }

    const cluster = await k8sService.createElasticsearchCluster(namespace, spec);

    // Automatically create Kibana instance for streamlined onboarding
    try {
      const clusterName = spec.metadata.name;
      const version = spec.spec.version;
      await k8sService.createKibanaInstance(namespace, clusterName, version);
    } catch (kibanaError: any) {
      // Log but don't fail the cluster creation if Kibana fails
      console.error('Failed to create Kibana:', kibanaError.message);
    }

    res.status(201).json(cluster);
  } catch (error) {
    next(error);
  }
});

// Update cluster
router.put('/:namespace/:name', async (req, res, next) => {
  try {
    const { namespace, name } = req.params;
    const spec = req.body;
    const cluster = await k8sService.updateElasticsearchCluster(namespace, name, spec);
    res.json(cluster);
  } catch (error) {
    next(error);
  }
});

// Delete cluster
router.delete('/:namespace/:name', async (req, res, next) => {
  try {
    const { namespace, name } = req.params;
    await k8sService.deleteElasticsearchCluster(namespace, name);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get Kibana URL for cluster
router.get('/:namespace/:name/kibana-url', async (req, res, next) => {
  try {
    const { namespace, name } = req.params;

    // Try to get Kibana instance and service
    try {
      const kibana = await k8sService.getKibanaInstance(namespace, `${name}-kb`);
      const kibanaService = await k8sService.getKibanaService(namespace, `${name}-kb`);

      if (kibanaService && kibanaService.spec) {
        // Check if it's a NodePort service
        if (kibanaService.spec.type === 'NodePort') {
          // For NodePort, use localhost with the NodePort
          const nodePort = kibanaService.spec.ports?.find((p: any) => p.name === 'https')?.nodePort;
          if (nodePort) {
            const url = `https://localhost:${nodePort}`;
            res.json({ url, available: true });
          } else {
            res.json({ url: null, available: false });
          }
        } else {
          // For ClusterIP, return the cluster IP (requires port-forward)
          const url = `https://${kibanaService.spec.clusterIP}:5601`;
          res.json({ url, available: true });
        }
      } else {
        res.json({ url: null, available: false });
      }
    } catch (error) {
      // Kibana not found
      res.json({ url: null, available: false });
    }
  } catch (error) {
    next(error);
  }
});

// Get cluster credentials
router.get('/:namespace/:name/credentials', async (req, res, next) => {
  try {
    const { namespace, name } = req.params;

    try {
      // Get the elastic user secret
      const secret = await k8sService.getSecret(namespace, `${name}-es-elastic-user`);

      if (secret.data && secret.data.elastic) {
        // Decode the base64 password
        const password = Buffer.from(secret.data.elastic, 'base64').toString('utf-8');
        res.json({
          username: 'elastic',
          password: password
        });
      } else {
        res.status(404).json({ error: 'Credentials not found' });
      }
    } catch (error) {
      res.status(404).json({ error: 'Credentials not found' });
    }
  } catch (error) {
    next(error);
  }
});

// Get cluster health
router.get('/:namespace/:name/health', async (req, res, next) => {
  try {
    const { namespace, name } = req.params;
    const health = await esService.getClusterHealth(namespace, name);
    res.json(health);
  } catch (error) {
    next(error);
  }
});

// Get cluster stats
router.get('/:namespace/:name/stats', async (req, res, next) => {
  try {
    const { namespace, name } = req.params;
    const stats = await esService.getClusterStats(namespace, name);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
