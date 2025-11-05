import { Router } from 'express';
import { k8sService } from '../services/kubernetes.service.js';

const router = Router();

// Get cluster capacity and node metrics
router.get('/', async (_req, res, next) => {
  try {
    const nodeMetrics = await k8sService.getNodeMetrics();

    // Calculate cluster-wide totals
    const clusterCapacity = nodeMetrics.reduce((acc, node) => ({
      cpu: acc.cpu + node.allocatable.cpu,
      memory: acc.memory + node.allocatable.memory,
      pods: acc.pods + node.allocatable.pods,
    }), { cpu: 0, memory: 0, pods: 0 });

    const clusterUsed = nodeMetrics.reduce((acc, node) => ({
      cpu: acc.cpu + node.used.cpu,
      memory: acc.memory + node.used.memory,
      pods: acc.pods + node.used.pods,
    }), { cpu: 0, memory: 0, pods: 0 });

    const clusterAvailable = {
      cpu: clusterCapacity.cpu - clusterUsed.cpu,
      memory: clusterCapacity.memory - clusterUsed.memory,
      pods: clusterCapacity.pods - clusterUsed.pods,
    };

    res.json({
      nodes: nodeMetrics,
      cluster: {
        totalNodes: nodeMetrics.length,
        readyNodes: nodeMetrics.filter(n => n.ready).length,
        capacity: clusterCapacity,
        used: clusterUsed,
        available: clusterAvailable,
        utilization: {
          cpu: clusterCapacity.cpu > 0 ? (clusterUsed.cpu / clusterCapacity.cpu) * 100 : 0,
          memory: clusterCapacity.memory > 0 ? (clusterUsed.memory / clusterCapacity.memory) * 100 : 0,
          pods: clusterCapacity.pods > 0 ? (clusterUsed.pods / clusterCapacity.pods) * 100 : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
