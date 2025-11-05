import { Router } from 'express';
import { k8sService } from '../services/kubernetes.service.js';

const router = Router();

// List all storage classes
router.get('/', async (_req, res, next) => {
  try {
    const storageClasses = await k8sService.listStorageClasses();
    res.json(storageClasses);
  } catch (error) {
    next(error);
  }
});

export default router;
