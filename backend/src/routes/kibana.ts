import { Router } from 'express';
import { k8sService } from '../services/kubernetes.service.js';

const router = Router();

// List all Kibana instances or instances in a specific namespace
router.get('/', async (req, res, next) => {
  try {
    const namespace = req.query.namespace as string | undefined;
    const instances = await k8sService.listKibanaInstances(namespace);
    res.json(instances);
  } catch (error) {
    next(error);
  }
});

// Get specific Kibana instance
router.get('/:namespace/:name', async (req, res, next) => {
  try {
    const { namespace, name } = req.params;
    const instance = await k8sService.getKibanaInstance(namespace, name);
    res.json(instance);
  } catch (error) {
    next(error);
  }
});

export default router;
