# ECK UI - Quick Start Guide

Choose your deployment method:

## 🐳 Docker Compose (Local Development)

**Fastest way to get started!**

```bash
cd "/Users/bholden/Desktop/ECK UI"
docker-compose up -d
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

**Stop:**
```bash
docker-compose down
```

---

## ☸️ Docker Desktop Kubernetes (Recommended)

**Best for local Kubernetes testing**

### Prerequisites:
1. Enable Kubernetes in Docker Desktop (Settings → Kubernetes → Enable)
2. Wait for Kubernetes to start (green indicator)

### Deploy:
```bash
cd "/Users/bholden/Desktop/ECK UI/kubernetes"
./deploy-docker-desktop.sh
```

### Access:
```bash
kubectl port-forward -n eck-ui svc/eck-ui-frontend 3000:80
```

Visit: http://localhost:3000

### Cleanup:
```bash
kubectl delete namespace eck-ui
```

---

## 🚀 Minikube (Alternative)

```bash
cd "/Users/bholden/Desktop/ECK UI/kubernetes"
./deploy.sh
```

---

## 📋 Quick Commands

### Docker Compose
```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

### Kubernetes (Docker Desktop)
```bash
# Deploy
./deploy-docker-desktop.sh

# Check status
kubectl get pods -n eck-ui

# View logs
kubectl logs -f -n eck-ui -l app=eck-ui

# Access UI
kubectl port-forward -n eck-ui svc/eck-ui-frontend 3000:80

# Delete
kubectl delete namespace eck-ui
```

---

## 🎯 What to Do After Deployment

1. **Access the UI** at http://localhost:3000
2. **Click "Create hosted deployment"** button
3. **Fill in cluster details:**
   - Name: my-first-cluster
   - Region: Denver, CO (production)
   - Version: 8.11.0
   - Nodes: 1
   - Memory: 1 GB
4. **Click "Create Cluster"**
5. **Watch it appear** on the dashboard and 3D map!

---

## 🐛 Troubleshooting

### Docker Compose

**Port already in use:**
```bash
# Stop conflicting services
lsof -ti:3000 | xargs kill
lsof -ti:4000 | xargs kill
```

**Can't connect to Kubernetes:**
```bash
# Check minikube/k8s is running
kubectl cluster-info
```

### Kubernetes

**Pods not starting:**
```bash
kubectl describe pod -n eck-ui <pod-name>
kubectl logs -n eck-ui <pod-name>
```

**Images not found:**
```bash
# Rebuild images
docker-compose build
```

**Backend can't access K8s API:**
```bash
# Check ECK operator
kubectl get pods -n elastic-system
```

---

## 📚 Documentation

- **Docker:** `DOCKER_DEPLOYMENT.md`
- **Kubernetes:** `kubernetes/README.md`
- **Docker Desktop K8s:** `kubernetes/DOCKER_DESKTOP_DEPLOYMENT.md`

---

## 🆘 Need Help?

1. Check logs first
2. Verify prerequisites
3. Read full documentation
4. Check GitHub issues

---

**Happy Deploying! 🎉**
