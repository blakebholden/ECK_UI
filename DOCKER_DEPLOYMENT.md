# Docker Deployment Guide

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Kubernetes cluster (minikube, EKS, GKE, AKS, etc.)
- kubectl configured with access to your cluster

## Quick Start

### 1. Build and Run with Docker Compose

```bash
# From the ECK UI root directory
docker-compose up -d
```

This will:
- Build both frontend and backend images
- Start the services
- Frontend available at: http://localhost:3000
- Backend API at: http://localhost:4000

### 2. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

### 3. Stop Services

```bash
docker-compose down
```

## Manual Docker Build

### Build Images

```bash
# Build backend
cd backend
docker build -t eck-ui-backend:latest .

# Build frontend
cd frontend
docker build -t eck-ui-frontend:latest .
```

### Run Containers

```bash
# Run backend
docker run -d \
  --name eck-ui-backend \
  -p 4000:4000 \
  -v ${HOME}/.kube:/root/.kube:ro \
  -v ${HOME}/.minikube:${HOME}/.minikube:ro \
  eck-ui-backend:latest

# Run frontend
docker run -d \
  --name eck-ui-frontend \
  -p 3000:80 \
  eck-ui-frontend:latest
```

## Kubernetes Access

The backend container needs access to your Kubernetes cluster. The docker-compose.yml mounts:
- `~/.kube/config` - Kubernetes configuration
- `~/.minikube` - Minikube certificates (if using minikube)

### For Different K8s Setups:

**EKS/GKE/AKS:**
```yaml
volumes:
  - ${HOME}/.kube:/root/.kube:ro
```

**In-Cluster Deployment:**
Remove volume mounts and use ServiceAccount authentication (see Kubernetes deployment section).

## Environment Variables

### Backend
- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (default: 4000)
- `KUBECONFIG` - Path to kubeconfig file

### Frontend
- `VITE_API_URL` - Backend API URL (default: http://localhost:4000)

## Production Deployment

### Push to Registry

```bash
# Tag images
docker tag eck-ui-backend:latest your-registry/eck-ui-backend:v1.0.0
docker tag eck-ui-frontend:latest your-registry/eck-ui-frontend:v1.0.0

# Push to registry
docker push your-registry/eck-ui-backend:v1.0.0
docker push your-registry/eck-ui-frontend:v1.0.0
```

### Deploy to Kubernetes

See `kubernetes/` directory for Kubernetes manifests and Helm charts.

## Troubleshooting

### Backend Can't Connect to Kubernetes

**Check kubeconfig:**
```bash
docker exec -it eck-ui-backend cat /root/.kube/config
```

**Test kubectl access:**
```bash
docker exec -it eck-ui-backend kubectl get nodes
```

### Frontend Can't Connect to Backend

**Check network:**
```bash
docker network inspect eck-ui-network
```

**Test backend health:**
```bash
curl http://localhost:4000/health
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose up -d --build

# Or rebuild specific service
docker-compose up -d --build frontend
```

## Health Checks

Both containers include health checks:

**Backend:** `http://localhost:4000/health`
**Frontend:** `http://localhost:3000/health`

Check health status:
```bash
docker-compose ps
```

## Security Notes

- Backend runs as non-root user (nodejs:1001)
- Frontend uses Alpine Linux for minimal attack surface
- Kubeconfig mounted read-only
- Health checks enabled for automatic restart on failure

## Next Steps

1. Deploy to Kubernetes cluster (see kubernetes/ directory)
2. Set up CI/CD pipeline
3. Configure ingress for external access
4. Add monitoring and logging
