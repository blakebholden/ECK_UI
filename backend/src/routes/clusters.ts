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

// Create cluster
router.post('/:namespace', async (req, res, next) => {
  try {
    const { namespace } = req.params;
    const spec = req.body;

    if (!spec || !spec.metadata || !spec.spec) {
      throw new ApiError(400, 'Invalid cluster specification');
    }

    const cluster = await k8sService.createElasticsearchCluster(namespace, spec);
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
