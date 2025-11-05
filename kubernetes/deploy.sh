#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}ECK UI Kubernetes Deployment Script${NC}"
echo "========================================"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl not found. Please install kubectl.${NC}"
    exit 1
fi

# Check if minikube is being used
if kubectl config current-context | grep -q "minikube"; then
    echo -e "${YELLOW}Detected minikube context${NC}"
    USING_MINIKUBE=true
else
    USING_MINIKUBE=false
fi

# Build and load images for minikube
if [ "$USING_MINIKUBE" = true ]; then
    echo -e "${GREEN}Building Docker images...${NC}"
    cd ..
    docker-compose build
    
    echo -e "${GREEN}Loading images into minikube...${NC}"
    minikube image load eck-ui-backend:latest
    minikube image load eck-ui-frontend:latest
    cd kubernetes
fi

# Apply Kubernetes manifests
echo -e "${GREEN}Applying Kubernetes manifests...${NC}"

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

echo "  - Setting up ingress (optional)..."
kubectl apply -f 06-ingress.yaml || echo -e "${YELLOW}Ingress setup skipped (ingress controller may not be installed)${NC}"

# Wait for deployments
echo -e "${GREEN}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available --timeout=120s deployment/eck-ui-backend -n eck-ui
kubectl wait --for=condition=available --timeout=120s deployment/eck-ui-frontend -n eck-ui

# Show deployment status
echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "Deployment Status:"
kubectl get pods -n eck-ui
echo ""
kubectl get svc -n eck-ui
echo ""

# Show access instructions
echo -e "${GREEN}Access Instructions:${NC}"
echo ""

if [ "$USING_MINIKUBE" = true ]; then
    echo "Option 1 - Port Forward:"
    echo "  kubectl port-forward -n eck-ui svc/eck-ui-frontend 3000:80"
    echo "  Then visit: http://localhost:3000"
    echo ""
    echo "Option 2 - Minikube Service:"
    echo "  minikube service eck-ui-frontend -n eck-ui"
    echo ""
    echo "Option 3 - Ingress (if configured):"
    echo "  echo \"$(minikube ip) eck-ui.local\" | sudo tee -a /etc/hosts"
    echo "  Then visit: http://eck-ui.local"
else
    echo "Port Forward:"
    echo "  kubectl port-forward -n eck-ui svc/eck-ui-frontend 3000:80"
    echo "  Then visit: http://localhost:3000"
    echo ""
    echo "Or use the ingress if configured."
fi

echo ""
echo -e "${GREEN}Done!${NC}"
