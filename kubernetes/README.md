# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the ECK UI application to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl configured
- ECK operator installed in the cluster
- Docker images built and pushed to a registry (or loaded locally for minikube)
- Nginx Ingress Controller (optional, for ingress)

## Quick Start

### 1. Build and Load Images (for minikube)

```bash
# Build images
cd ../
docker-compose build

# Load images into minikube
minikube image load eck-ui-backend:latest
minikube image load eck-ui-frontend:latest
```

### 2. Deploy to Kubernetes

```bash
# Apply all manifests in order
kubectl apply -f kubernetes/
```

Or apply individually:

```bash
kubectl apply -f kubernetes/00-namespace.yaml
kubectl apply -f kubernetes/01-rbac.yaml
kubectl apply -f kubernetes/02-backend-deployment.yaml
kubectl apply -f kubernetes/03-backend-service.yaml
kubectl apply -f kubernetes/04-frontend-deployment.yaml
kubectl apply -f kubernetes/05-frontend-service.yaml
kubectl apply -f kubernetes/06-ingress.yaml  # Optional
```

### 3. Verify Deployment

```bash
# Check pods
kubectl get pods -n eck-ui

# Check services
kubectl get svc -n eck-ui

# View logs
kubectl logs -f -n eck-ui -l app=eck-ui,component=backend
kubectl logs -f -n eck-ui -l app=eck-ui,component=frontend
```

### 4. Access the Application

**Option A: Port Forward (Development)**

```bash
# Frontend
kubectl port-forward -n eck-ui svc/eck-ui-frontend 3000:80

# Backend (optional, for direct API access)
kubectl port-forward -n eck-ui svc/eck-ui-backend 4000:4000
```

Access at: http://localhost:3000

**Option B: Ingress (Production)**

```bash
# Install nginx ingress controller (if not already installed)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Get ingress IP
kubectl get ingress -n eck-ui

# Add to /etc/hosts
echo "$(minikube ip) eck-ui.local" | sudo tee -a /etc/hosts
```

Access at: http://eck-ui.local

**Option C: NodePort (Quick Access)**

```bash
# Change service type to NodePort
kubectl patch svc eck-ui-frontend -n eck-ui -p '{"spec":{"type":"NodePort"}}'

# Get NodePort
kubectl get svc eck-ui-frontend -n eck-ui

# For minikube
minikube service eck-ui-frontend -n eck-ui
```

## Manifest Files Explained

### 00-namespace.yaml
Creates the `eck-ui` namespace for all ECK UI resources.

### 01-rbac.yaml
- **ServiceAccount**: `eck-ui-backend` - Identity for backend pods
- **ClusterRole**: `eck-ui-manager` - Permissions to manage Elasticsearch clusters
- **ClusterRoleBinding**: Links ServiceAccount to ClusterRole

Permissions include:
- Full CRUD on Elasticsearch resources
- Read access to pods, services, namespaces
- Event viewing for troubleshooting

### 02-backend-deployment.yaml
Backend API deployment with:
- 2 replicas for high availability
- Resource limits (500m CPU, 512Mi memory)
- Health checks (liveness & readiness probes)
- Security context (non-root user, read-only filesystem)
- ServiceAccount for Kubernetes API access

### 03-backend-service.yaml
ClusterIP service exposing backend on port 4000

### 04-frontend-deployment.yaml
Frontend deployment with:
- 2 replicas
- Nginx serving React app
- Resource limits (200m CPU, 256Mi memory)
- Health checks
- Security hardening

### 05-frontend-service.yaml
ClusterIP service exposing frontend on port 80

### 06-ingress.yaml
Ingress for external access:
- Routes `/api` → backend
- Routes `/` → frontend
- Supports HTTPS with cert-manager

## Configuration

### Environment Variables

**Backend:**
- `NODE_ENV`: Set to "production"
- `PORT`: Server port (default: 4000)

**Frontend:**
- `VITE_API_URL`: Backend API URL (default: http://eck-ui-backend:4000)

### Image Registry

For production, push images to a registry:

```bash
# Tag images
docker tag eck-ui-backend:latest your-registry/eck-ui-backend:v1.0.0
docker tag eck-ui-frontend:latest your-registry/eck-ui-frontend:v1.0.0

# Push
docker push your-registry/eck-ui-backend:v1.0.0
docker push your-registry/eck-ui-frontend:v1.0.0

# Update image in deployments
kubectl set image deployment/eck-ui-backend backend=your-registry/eck-ui-backend:v1.0.0 -n eck-ui
kubectl set image deployment/eck-ui-frontend frontend=your-registry/eck-ui-frontend:v1.0.0 -n eck-ui
```

## Security Considerations

1. **RBAC**: Backend has minimal required permissions
2. **Non-root**: All containers run as non-root users
3. **Read-only filesystem**: Enabled where possible
4. **Security Context**: Drops all capabilities, adds only NET_BIND_SERVICE
5. **Network Policies**: Consider adding for production
6. **Secrets**: Use Kubernetes secrets for sensitive data

## Scaling

Scale replicas:

```bash
# Scale backend
kubectl scale deployment eck-ui-backend --replicas=3 -n eck-ui

# Scale frontend
kubectl scale deployment eck-ui-frontend --replicas=3 -n eck-ui
```

Auto-scaling (HPA):

```bash
# Create HPA for backend
kubectl autoscale deployment eck-ui-backend -n eck-ui \
  --cpu-percent=70 \
  --min=2 \
  --max=10

# Create HPA for frontend
kubectl autoscale deployment eck-ui-frontend -n eck-ui \
  --cpu-percent=70 \
  --min=2 \
  --max=10
```

## Monitoring

View metrics:

```bash
# Pod resource usage
kubectl top pods -n eck-ui

# Deployment status
kubectl rollout status deployment/eck-ui-backend -n eck-ui
kubectl rollout status deployment/eck-ui-frontend -n eck-ui
```

## Troubleshooting

### Pods not starting

```bash
# Describe pod
kubectl describe pod -n eck-ui <pod-name>

# View events
kubectl get events -n eck-ui --sort-by='.lastTimestamp'
```

### Backend can't connect to Kubernetes API

```bash
# Check ServiceAccount
kubectl get sa eck-ui-backend -n eck-ui

# Check RBAC
kubectl auth can-i list elasticsearches.elasticsearch.k8s.elastic.co \
  --as=system:serviceaccount:eck-ui:eck-ui-backend
```

### Image pull errors

```bash
# For minikube, ensure images are loaded
minikube image ls | grep eck-ui
```

## Cleanup

```bash
# Delete all ECK UI resources
kubectl delete namespace eck-ui

# Or delete individually
kubectl delete -f kubernetes/
```

## Production Checklist

- [ ] Images pushed to secure registry
- [ ] HTTPS enabled with cert-manager
- [ ] Resource limits tuned for workload
- [ ] Monitoring and logging configured
- [ ] Backup strategy for data
- [ ] Network policies in place
- [ ] Pod security policies enforced
- [ ] Regular security scans
- [ ] Disaster recovery plan
- [ ] CI/CD pipeline configured

## Next Steps

1. Set up Helm chart for easier deployment
2. Configure Prometheus monitoring
3. Add Grafana dashboards
4. Implement GitOps with ArgoCD/Flux
5. Set up multi-cluster management
