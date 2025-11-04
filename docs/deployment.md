# Deployment Guide

## Prerequisites

- Kubernetes cluster (1.30+)
- ECK operator installed
- kubectl configured
- Docker (for building images)
- Container registry access

## Deployment Options

### Option 1: Docker Compose (Development)

Easiest way to run locally for development:

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access at http://localhost:3000

**Pros:**
- Quick setup
- Good for local development
- Automatic reload

**Cons:**
- Not production-ready
- Single machine only

### Option 2: Kubernetes (Production)

#### Step 1: Install ECK Operator

```bash
# Install CRDs
kubectl create -f https://download.elastic.co/downloads/eck/2.12.0/crds.yaml

# Install operator
kubectl apply -f https://download.elastic.co/downloads/eck/2.12.0/operator.yaml

# Verify installation
kubectl get pods -n elastic-system
```

#### Step 2: Build Docker Images

```bash
# Frontend
cd frontend
docker build -f ../deploy/docker/Dockerfile.frontend -t your-registry/eck-ui-frontend:v0.1.0 .
docker push your-registry/eck-ui-frontend:v0.1.0

# Backend
cd ../backend
docker build -f ../deploy/docker/Dockerfile.backend -t your-registry/eck-ui-backend:v0.1.0 .
docker push your-registry/eck-ui-backend:v0.1.0
```

**Using Docker Hub:**
```bash
docker login
docker build -t username/eck-ui-frontend:v0.1.0 -f ../deploy/docker/Dockerfile.frontend .
docker push username/eck-ui-frontend:v0.1.0
```

**Using GitHub Container Registry:**
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker build -t ghcr.io/username/eck-ui-frontend:v0.1.0 -f ../deploy/docker/Dockerfile.frontend .
docker push ghcr.io/username/eck-ui-frontend:v0.1.0
```

#### Step 3: Update Deployment Manifests

Edit `deploy/kubernetes/deployment.yaml`:

```yaml
# Change these lines:
image: eck-ui-backend:latest
# To:
image: your-registry/eck-ui-backend:v0.1.0

# And:
image: eck-ui-frontend:latest
# To:
image: your-registry/eck-ui-frontend:v0.1.0
```

#### Step 4: Apply RBAC

```bash
kubectl apply -f deploy/kubernetes/rbac.yaml
```

This creates:
- Namespace: `eck-ui`
- ServiceAccount: `eck-ui`
- ClusterRole with permissions to manage ECK resources
- ClusterRoleBinding

Verify:
```bash
kubectl get sa -n eck-ui
kubectl get clusterrole eck-ui
```

#### Step 5: Deploy Application

```bash
# Deploy backend and frontend
kubectl apply -f deploy/kubernetes/deployment.yaml

# Deploy services
kubectl apply -f deploy/kubernetes/service.yaml

# Watch deployment
kubectl get pods -n eck-ui -w
```

Verify:
```bash
kubectl get all -n eck-ui
```

#### Step 6: Access the Application

**Option A: LoadBalancer (Cloud)**
```bash
kubectl get svc -n eck-ui eck-ui-frontend
# Note the EXTERNAL-IP and access at http://<EXTERNAL-IP>
```

**Option B: NodePort (On-premise)**

Edit service.yaml:
```yaml
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080  # Choose port 30000-32767
```

Access at `http://<NODE-IP>:30080`

**Option C: Port Forward (Testing)**
```bash
kubectl port-forward -n eck-ui svc/eck-ui-frontend 8080:80
```
Access at http://localhost:8080

**Option D: Ingress (Recommended for Production)**

1. Install ingress controller:
   ```bash
   # Nginx ingress
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
   ```

2. Update ingress.yaml with your domain:
   ```yaml
   spec:
     rules:
     - host: eck-ui.yourdomain.com
   ```

3. Apply ingress:
   ```bash
   kubectl apply -f deploy/kubernetes/ingress.yaml
   ```

4. Configure DNS to point to ingress controller IP

## Configuration

### Backend Environment Variables

Configure in `deploy/kubernetes/deployment.yaml`:

```yaml
env:
- name: NODE_ENV
  value: "production"
- name: PORT
  value: "4000"
- name: LOG_LEVEL
  value: "info"  # debug, info, warn, error
- name: CORS_ORIGIN
  value: "http://localhost"  # Change to your domain
```

### Resource Limits

Adjust based on your cluster size:

```yaml
resources:
  requests:
    memory: "256Mi"  # Minimum required
    cpu: "100m"
  limits:
    memory: "512Mi"  # Maximum allowed
    cpu: "500m"
```

### Replicas

For high availability:

```yaml
spec:
  replicas: 2  # Run multiple instances
```

## Security

### TLS/HTTPS

#### Option 1: cert-manager (Automated)

1. Install cert-manager:
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml
   ```

2. Create ClusterIssuer:
   ```yaml
   apiVersion: cert-manager.io/v1
   kind: ClusterIssuer
   metadata:
     name: letsencrypt-prod
   spec:
     acme:
       server: https://acme-v02.api.letsencrypt.org/directory
       email: your-email@example.com
       privateKeySecretRef:
         name: letsencrypt-prod
       solvers:
       - http01:
           ingress:
             class: nginx
   ```

3. Update ingress annotations:
   ```yaml
   annotations:
     cert-manager.io/cluster-issuer: "letsencrypt-prod"
   tls:
   - hosts:
     - eck-ui.yourdomain.com
     secretName: eck-ui-tls
   ```

#### Option 2: Manual Certificate

```bash
# Create TLS secret
kubectl create secret tls eck-ui-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  -n eck-ui
```

### Network Policies

Restrict network access:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: eck-ui-backend
  namespace: eck-ui
spec:
  podSelector:
    matchLabels:
      app: eck-ui
      component: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: eck-ui
          component: frontend
    ports:
    - protocol: TCP
      port: 4000
```

## Monitoring

### Health Checks

Backend exposes `/health` endpoint:

```bash
kubectl exec -n eck-ui deployment/eck-ui-backend -- \
  curl http://localhost:4000/health
```

### Logs

```bash
# Backend logs
kubectl logs -n eck-ui deployment/eck-ui-backend -f

# Frontend logs
kubectl logs -n eck-ui deployment/eck-ui-frontend -f

# All pods
kubectl logs -n eck-ui -l app=eck-ui --all-containers -f
```

### Metrics

Add Prometheus annotations:

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "4000"
    prometheus.io/path: "/metrics"
```

## Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl get pods -n eck-ui

# Describe pod for events
kubectl describe pod -n eck-ui <pod-name>

# Check logs
kubectl logs -n eck-ui <pod-name>
```

Common issues:
- Image pull errors: Check image name and registry credentials
- CrashLoopBackOff: Check application logs
- Pending: Check resource requests vs cluster capacity

### Backend can't access Kubernetes API

```bash
# Check service account
kubectl get sa -n eck-ui eck-ui

# Check RBAC
kubectl auth can-i get elasticsearches --as=system:serviceaccount:eck-ui:eck-ui -A

# Check operator
kubectl get pods -n elastic-system
```

### Can't access frontend

```bash
# Check service
kubectl get svc -n eck-ui eck-ui-frontend

# Check ingress
kubectl get ingress -n eck-ui

# Test from inside cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  wget -O- http://eck-ui-frontend.eck-ui.svc
```

## Upgrading

### Rolling Update

```bash
# Build new images with new tag
docker build -t your-registry/eck-ui-backend:v0.2.0 ...

# Update deployment
kubectl set image deployment/eck-ui-backend \
  backend=your-registry/eck-ui-backend:v0.2.0 \
  -n eck-ui

# Check rollout
kubectl rollout status deployment/eck-ui-backend -n eck-ui

# Rollback if needed
kubectl rollout undo deployment/eck-ui-backend -n eck-ui
```

### Database Migrations

Currently stateless - no migrations needed. Future:
- Use init containers for migrations
- Version check on startup
- Backup before upgrade

## Scaling

### Horizontal Scaling

```bash
# Scale manually
kubectl scale deployment/eck-ui-backend --replicas=3 -n eck-ui

# Auto-scaling (HPA)
kubectl autoscale deployment/eck-ui-backend \
  --cpu-percent=80 \
  --min=2 \
  --max=10 \
  -n eck-ui
```

### Vertical Scaling

Update resource limits in deployment.yaml and apply:

```bash
kubectl apply -f deploy/kubernetes/deployment.yaml
```

## Backup & Disaster Recovery

### Configuration Backup

```bash
# Export all resources
kubectl get all -n eck-ui -o yaml > eck-ui-backup.yaml

# Export RBAC
kubectl get clusterrole eck-ui -o yaml > rbac-backup.yaml
kubectl get clusterrolebinding eck-ui -o yaml >> rbac-backup.yaml
```

### Restore

```bash
kubectl apply -f eck-ui-backup.yaml
kubectl apply -f rbac-backup.yaml
```

## Production Checklist

- [ ] TLS/HTTPS enabled
- [ ] Resource limits configured
- [ ] Multiple replicas for HA
- [ ] Ingress configured with proper domain
- [ ] Network policies applied
- [ ] Monitoring and logging set up
- [ ] Backup procedure documented
- [ ] Health checks configured
- [ ] RBAC permissions reviewed
- [ ] Container images scanned for vulnerabilities
