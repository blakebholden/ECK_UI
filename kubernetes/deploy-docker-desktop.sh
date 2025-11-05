#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}ECK UI - Docker Desktop Kubernetes Deployment${NC}"
echo "================================================"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl not found. Please install kubectl.${NC}"
    exit 1
fi

# Check if Docker Desktop Kubernetes is running
if ! kubectl config current-context | grep -q "docker-desktop"; then
    echo -e "${YELLOW}Warning: Not using docker-desktop context${NC}"
    echo "Current context: $(kubectl config current-context)"
    echo ""
    read -p "Do you want to switch to docker-desktop context? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl config use-context docker-desktop
    else
        echo -e "${RED}Aborted. Please switch to docker-desktop context manually.${NC}"
        exit 1
    fi
fi

# Check if Kubernetes is enabled in Docker Desktop
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Kubernetes is not running in Docker Desktop${NC}"
    echo ""
    echo "To enable Kubernetes in Docker Desktop:"
    echo "1. Open Docker Desktop"
    echo "2. Go to Settings/Preferences"
    echo "3. Click on 'Kubernetes'"
    echo "4. Check 'Enable Kubernetes'"
    echo "5. Click 'Apply & Restart'"
    echo ""
    exit 1
fi

echo -e "${GREEN}Docker Desktop Kubernetes detected and running${NC}"
echo ""

# Build Docker images
echo -e "${GREEN}Building Docker images...${NC}"
cd ..
docker-compose build

echo -e "${GREEN}Images built successfully!${NC}"
echo "Since we're using Docker Desktop, images are automatically available to Kubernetes."
echo ""

# Go back to kubernetes directory
cd kubernetes

# Install ECK operator if not already installed
echo -e "${GREEN}Checking ECK operator installation...${NC}"
if ! kubectl get namespace elastic-system &> /dev/null; then
    echo "Installing ECK operator..."
    kubectl create -f https://download.elastic.co/downloads/eck/2.10.0/crds.yaml
    kubectl apply -f https://download.elastic.co/downloads/eck/2.10.0/operator.yaml
    
    echo "Waiting for ECK operator to be ready..."
    kubectl wait --for=condition=ready pod -l control-plane=elastic-operator -n elastic-system --timeout=120s
    echo -e "${GREEN}ECK operator installed successfully!${NC}"
else
    echo -e "${GREEN}ECK operator already installed${NC}"
fi

echo ""

# Apply Kubernetes manifests
echo -e "${GREEN}Deploying ECK UI...${NC}"

echo "  - Creating namespace..."
kubectl apply -f 00-namespace.yaml

echo "  - Setting up RBAC..."
kubectl apply -f 01-rbac.yaml

echo "  - Deploying backend..."
kubectl apply -f 02-backend-deployment.yaml
kubectl apply -f 03-backend-service.yaml

echo "  - Deploying frontend..."
kubectl apply -f 04-frontend-deployment.yaml
kubectl apply -f 05-frontend-service.yaml

# Ask about ingress
echo ""
read -p "Do you want to install Nginx Ingress Controller? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installing Nginx Ingress Controller for Docker Desktop..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
    
    echo "Waiting for ingress controller to be ready..."
    kubectl wait --namespace ingress-nginx \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/component=controller \
      --timeout=120s
    
    echo "Applying ingress..."
    kubectl apply -f 06-ingress.yaml
    
    echo ""
    echo -e "${YELLOW}To use the ingress, add this to your /etc/hosts:${NC}"
    echo "127.0.0.1 eck-ui.local"
fi

# Wait for deployments
echo ""
echo -e "${GREEN}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available --timeout=120s deployment/eck-ui-backend -n eck-ui
kubectl wait --for=condition=available --timeout=120s deployment/eck-ui-frontend -n eck-ui

# Show deployment status
echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "Deployment Status:"
kubectl get pods -n eck-ui
echo ""
kubectl get svc -n eck-ui
echo ""

# Show access instructions
echo -e "${GREEN}=== Access Instructions ===${NC}"
echo ""
echo "Option 1 - Port Forward (Recommended):"
echo -e "${YELLOW}  kubectl port-forward -n eck-ui svc/eck-ui-frontend 3000:80${NC}"
echo "  Then visit: http://localhost:3000"
echo ""

echo "Option 2 - Ingress (if installed):"
echo "  Add to /etc/hosts:"
echo -e "${YELLOW}    echo '127.0.0.1 eck-ui.local' | sudo tee -a /etc/hosts${NC}"
echo "  Then visit: http://eck-ui.local"
echo ""

echo "Option 3 - NodePort:"
echo -e "${YELLOW}  kubectl patch svc eck-ui-frontend -n eck-ui -p '{\"spec\":{\"type\":\"NodePort\"}}'${NC}"
echo "  kubectl get svc eck-ui-frontend -n eck-ui"
echo "  Then visit: http://localhost:<NodePort>"
echo ""

echo -e "${GREEN}To view logs:${NC}"
echo "  kubectl logs -f -n eck-ui -l app=eck-ui,component=backend"
echo "  kubectl logs -f -n eck-ui -l app=eck-ui,component=frontend"
echo ""

echo -e "${GREEN}To delete everything:${NC}"
echo "  kubectl delete namespace eck-ui"
echo ""

echo -e "${GREEN}Done! 🚀${NC}"
