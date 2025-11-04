import { Router } from 'express';
import { k8sService } from '../services/kubernetes.service.js';

const router = Router();

// List all namespaces
router.get('/', async (req, res, next) => {
  try {
    const namespaces = await k8sService.listNamespaces();
    res.json(namespaces);
  } catch (error) {
    next(error);
  }
});

export default router;
