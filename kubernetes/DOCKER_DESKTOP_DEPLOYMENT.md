# Docker Desktop Kubernetes Deployment Guide

This guide walks you through deploying the ECK UI to Docker Desktop's built-in Kubernetes cluster.

## Prerequisites

- Docker Desktop (v4.0 or later)
- Kubernetes enabled in Docker Desktop
- kubectl (usually comes with Docker Desktop)

## Step 1: Enable Kubernetes in Docker Desktop

1. Open **Docker Desktop**
2. Click the **gear icon** (Settings/Preferences)
3. Navigate to **Kubernetes** in the left sidebar
4. Check **Enable Kubernetes**
5. Click **Apply & Restart**
6. Wait for Kubernetes to start (green indicator)

Verify Kubernetes is running:
```bash
kubectl cluster-info
kubectl get nodes
```

You should see output showing `docker-desktop` node.

## Step 2: Switch to Docker Desktop Context

```bash
# View available contexts
kubectl config get-contexts

# Switch to docker-desktop
kubectl config use-context docker-desktop

# Verify
kubectl config current-context
# Should output: docker-desktop
```

## Step 3: Automated Deployment

### Quick Start (Recommended)

```bash
cd "/Users/bholden/Desktop/ECK UI/kubernetes"
./deploy-docker-desktop.sh
```

This script will:
- ✅ Check if Kubernetes is enabled
- ✅ Build Docker images
- ✅ Install ECK operator
- ✅ Deploy backend and frontend
- ✅ Optionally install Nginx Ingress
- ✅ Show access instructions

## Step 4: Manual Deployment (Alternative)

If you prefer manual steps:

### 4.1 Build Images

```bash
cd "/Users/bholden/Desktop/ECK UI"
docker-compose build
```

Docker Desktop automatically makes local images available to Kubernetes!

### 4.2 Install ECK Operator

```bash
# Install CRDs
kubectl create -f https://download.elastic.co/downloads/eck/2.10.0/crds.yaml

# Install Operator
kubectl apply -f https://download.elastic.co/downloads/eck/2.10.0/operator.yaml

# Wait for operator to be ready
kubectl wait --for=condition=ready pod -l control-plane=elastic-operator -n elastic-system --timeout=120s
```

### 4.3 Deploy ECK UI

```bash
cd kubernetes

# Apply all manifests
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-rbac.yaml
kubectl apply -f 02-backend-deployment.yaml
kubectl apply -f 03-backend-service.yaml
kubectl apply -f 04-frontend-deployment.yaml
kubectl apply -f 05-frontend-service.yaml
```

### 4.4 Verify Deployment

```bash
# Check pods
kubectl get pods -n eck-ui

# Expected output:
# NAME                              READY   STATUS    RESTARTS   AGE
# eck-ui-backend-xxxx-yyyy          1/1     Running   0          1m
# eck-ui-backend-xxxx-zzzz          1/1     Running   0          1m
# eck-ui-frontend-xxxx-aaaa         1/1     Running   0          1m
# eck-ui-frontend-xxxx-bbbb         1/1     Running   0          1m

# Check services
kubectl get svc -n eck-ui
```

## Step 5: Access the Application

### Option A: Port Forward (Easiest)

```bash
kubectl port-forward -n eck-ui svc/eck-ui-frontend 3000:80
```

Open browser: **http://localhost:3000**

To access backend API directly:
```bash
kubectl port-forward -n eck-ui svc/eck-ui-backend 4000:4000
```

### Option B: NodePort

Change service type to NodePort:
```bash
kubectl patch svc eck-ui-frontend -n eck-ui -p '{"spec":{"type":"NodePort"}}'

# Get the NodePort
kubectl get svc eck-ui-frontend -n eck-ui
```

Access at: **http://localhost:&lt;NodePort&gt;**

### Option C: Ingress (Advanced)

#### Install Nginx Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for it to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

#### Apply Ingress

```bash
kubectl apply -f 06-ingress.yaml
```

#### Add to /etc/hosts

```bash
echo "127.0.0.1 eck-ui.local" | sudo tee -a /etc/hosts
```

Access at: **http://eck-ui.local**

## Step 6: Create Elasticsearch Clusters

Once the UI is accessible:

1. Navigate to **Create Cluster** page
2. Fill in:
   - Cluster name (e.g., "my-cluster")
   - Select region (namespace)
   - Choose Elasticsearch version
   - Set node count and memory
3. Click **Create Cluster**

The cluster will be created in the selected namespace (region).

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod to see errors
kubectl describe pod -n eck-ui <pod-name>

# View logs
kubectl logs -n eck-ui <pod-name>
```

**Common Issues:**

**Image Pull Error:**
- Make sure images are built: `docker images | grep eck-ui`
- Rebuild if needed: `docker-compose build`

**CrashLoopBackOff:**
- Check logs: `kubectl logs -n eck-ui <pod-name>`
- Verify ECK operator is running: `kubectl get pods -n elastic-system`

### Backend Can't Access Kubernetes API

```bash
# Check ServiceAccount
kubectl get sa eck-ui-backend -n eck-ui

# Test permissions
kubectl auth can-i list elasticsearches.elasticsearch.k8s.elastic.co \
  --as=system:serviceaccount:eck-ui:eck-ui-backend
```

### Port Already in Use

If port 3000 is already in use:
```bash
kubectl port-forward -n eck-ui svc/eck-ui-frontend 8080:80
```

Then access at: http://localhost:8080

### Ingress Not Working

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl describe ingress eck-ui-ingress -n eck-ui

# Check /etc/hosts
cat /etc/hosts | grep eck-ui.local
```

## Monitoring

### View Logs

```bash
# Backend logs
kubectl logs -f -n eck-ui -l app=eck-ui,component=backend

# Frontend logs  
kubectl logs -f -n eck-ui -l app=eck-ui,component=frontend

# All ECK UI logs
kubectl logs -f -n eck-ui -l app=eck-ui
```

### Resource Usage

```bash
# Pod resource usage
kubectl top pods -n eck-ui

# Node resource usage
kubectl top nodes
```

### Deployment Status

```bash
kubectl get deployments -n eck-ui
kubectl rollout status deployment/eck-ui-backend -n eck-ui
kubectl rollout status deployment/eck-ui-frontend -n eck-ui
```

## Scaling

### Scale Manually

```bash
# Scale backend to 3 replicas
kubectl scale deployment eck-ui-backend --replicas=3 -n eck-ui

# Scale frontend to 3 replicas
kubectl scale deployment eck-ui-frontend --replicas=3 -n eck-ui
```

### Auto-scaling (HPA)

First, ensure metrics-server is installed:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

For Docker Desktop, patch metrics-server:
```bash
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[
  {"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}
]'
```

Create HPA:
```bash
# Backend autoscaling
kubectl autoscale deployment eck-ui-backend -n eck-ui \
  --cpu-percent=70 \
  --min=2 \
  --max=5

# Frontend autoscaling
kubectl autoscale deployment eck-ui-frontend -n eck-ui \
  --cpu-percent=70 \
  --min=2 \
  --max=5
```

## Updating

### Update Images

After making code changes:

```bash
# Rebuild images
cd "/Users/bholden/Desktop/ECK UI"
docker-compose build

# Restart deployments (will pull new images)
kubectl rollout restart deployment/eck-ui-backend -n eck-ui
kubectl rollout restart deployment/eck-ui-frontend -n eck-ui

# Watch rollout
kubectl rollout status deployment/eck-ui-backend -n eck-ui
kubectl rollout status deployment/eck-ui-frontend -n eck-ui
```

### Update Configuration

```bash
# Edit deployment
kubectl edit deployment eck-ui-backend -n eck-ui

# Or update via manifest
kubectl apply -f kubernetes/02-backend-deployment.yaml
```

## Cleanup

### Delete ECK UI Only

```bash
kubectl delete namespace eck-ui
```

### Delete Everything (Including ECK Operator)

```bash
# Delete ECK UI
kubectl delete namespace eck-ui

# Delete ECK operator
kubectl delete namespace elastic-system
kubectl delete -f https://download.elastic.co/downloads/eck/2.10.0/operator.yaml
kubectl delete -f https://download.elastic.co/downloads/eck/2.10.0/crds.yaml
```

## Docker Desktop Specific Tips

### Resource Limits

Docker Desktop has resource limits. Increase them if needed:
1. Open Docker Desktop Settings
2. Go to **Resources**
3. Increase:
   - CPUs: 4+
   - Memory: 8GB+
   - Disk: 60GB+

### Reset Kubernetes

If things go wrong:
1. Docker Desktop → Settings → Kubernetes
2. Click **Reset Kubernetes Cluster**
3. Wait for reset to complete
4. Redeploy

### Context Switching

```bash
# List contexts
kubectl config get-contexts

# Switch context
kubectl config use-context docker-desktop

# Set default namespace
kubectl config set-context --current --namespace=eck-ui
```

## Differences from Minikube

| Feature | Docker Desktop | Minikube |
|---------|---------------|----------|
| Image Loading | Automatic | `minikube image load` |
| IP Address | localhost | `minikube ip` |
| Ingress | localhost | Requires /etc/hosts |
| Service Access | Port forward / NodePort | `minikube service` |
| Dashboard | Not included | `minikube dashboard` |

## Next Steps

1. ✅ Deploy to Docker Desktop
2. Create sample Elasticsearch clusters
3. Test cluster management features
4. Try scaling and updates
5. Consider production deployment to EKS/GKE/AKS

## Advantages of Docker Desktop K8s

✅ **No VM overhead** - Runs natively on your machine
✅ **Integrated with Docker** - No image loading needed
✅ **Simple setup** - One checkbox to enable
✅ **Local development** - Perfect for testing
✅ **Resource efficient** - Lower overhead than Minikube

## Support

For issues:
- Check Docker Desktop logs: `~/Library/Containers/com.docker.docker/Data/log/`
- View Kubernetes events: `kubectl get events -n eck-ui --sort-by='.lastTimestamp'`
- ECK documentation: https://www.elastic.co/guide/en/cloud-on-k8s/current/
