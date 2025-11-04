# Development Guide

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Kubernetes cluster with ECK operator
- kubectl configured

### Initial Setup

1. Clone and install dependencies:
   ```bash
   git clone https://github.com/blakebholden/ECK_UI.git
   cd ECK_UI

   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

2. Configure backend:
   ```bash
   cd backend
   cp .env.example .env
   ```

3. Start development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Development Workflow

### Frontend Development

#### Running the Dev Server

```bash
cd frontend
npm run dev
```

- Dev server runs on http://localhost:3000
- Hot module replacement enabled
- API proxied to backend at http://localhost:4000

#### Building for Production

```bash
npm run build
npm run preview  # Preview production build
```

#### Type Checking

```bash
npm run type-check
```

#### Linting

```bash
npm run lint
```

### Backend Development

#### Running the Dev Server

```bash
cd backend
npm run dev
```

- Server runs on http://localhost:4000
- Auto-restarts on file changes (using tsx watch)
- Logs to console with winston

#### Building for Production

```bash
npm run build
npm start
```

#### Type Checking

```bash
npm run type-check
```

#### Linting

```bash
npm run lint
```

## Project Structure

### Frontend

```
frontend/src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (buttons, cards, etc)
│   ├── clusters/       # Cluster-specific components
│   └── layout/         # Layout components (Header, Sidebar)
├── pages/              # Page components (routes)
│   ├── Dashboard.tsx
│   ├── ClusterList.tsx
│   ├── ClusterDetail.tsx
│   └── ClusterCreate.tsx
├── services/           # API client
│   └── api.ts
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

### Backend

```
backend/src/
├── routes/             # Express route handlers
│   ├── clusters.ts
│   ├── kibana.ts
│   └── namespaces.ts
├── services/           # Business logic
│   ├── kubernetes.service.ts
│   └── elasticsearch.service.ts
├── middleware/         # Express middleware
│   └── errorHandler.ts
├── utils/              # Utilities
│   └── logger.ts
└── server.ts           # Entry point
```

## Adding New Features

### Adding a New Page (Frontend)

1. Create page component:
   ```tsx
   // frontend/src/pages/NewPage.tsx
   import React from 'react';
   import { EuiPageHeader, EuiPanel } from '@elastic/eui';

   const NewPage: React.FC = () => {
     return (
       <>
         <EuiPageHeader pageTitle="New Page" />
         <EuiPanel>Content here</EuiPanel>
       </>
     );
   };

   export default NewPage;
   ```

2. Add route in App.tsx:
   ```tsx
   import NewPage from '@pages/NewPage';

   <Route path="/new" element={<NewPage />} />
   ```

3. Add navigation link in Header:
   ```tsx
   <EuiHeaderLink onClick={() => navigate('/new')}>
     New Page
   </EuiHeaderLink>
   ```

### Adding a New API Endpoint (Backend)

1. Add route handler:
   ```typescript
   // backend/src/routes/newResource.ts
   import { Router } from 'express';

   const router = Router();

   router.get('/', async (req, res, next) => {
     try {
       // Your logic here
       res.json({ data: [] });
     } catch (error) {
       next(error);
     }
   });

   export default router;
   ```

2. Register route in server.ts:
   ```typescript
   import newResourceRouter from './routes/newResource.js';

   app.use('/api/v1/new-resource', newResourceRouter);
   ```

3. Add API client method:
   ```typescript
   // frontend/src/services/api.ts
   export const newResourceApi = {
     list: async (): Promise<NewResource[]> => {
       const response = await fetch(`${API_BASE_URL}/new-resource`);
       return handleResponse<NewResource[]>(response);
     },
   };
   ```

### Adding a New Component

1. Create component file:
   ```tsx
   // frontend/src/components/common/MyComponent.tsx
   import React from 'react';
   import { EuiPanel } from '@elastic/eui';

   interface MyComponentProps {
     title: string;
   }

   const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
     return <EuiPanel>{title}</EuiPanel>;
   };

   export default MyComponent;
   ```

2. Use in pages or other components:
   ```tsx
   import MyComponent from '@components/common/MyComponent';

   <MyComponent title="Hello" />
   ```

## Working with Kubernetes

### Testing Locally with Minikube

1. Start minikube:
   ```bash
   minikube start
   ```

2. Install ECK operator:
   ```bash
   kubectl create -f https://download.elastic.co/downloads/eck/2.12.0/crds.yaml
   kubectl apply -f https://download.elastic.co/downloads/eck/2.12.0/operator.yaml
   ```

3. Create a test cluster:
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: elasticsearch.k8s.elastic.co/v1
   kind: Elasticsearch
   metadata:
     name: quickstart
   spec:
     version: 8.13.0
     nodeSets:
     - name: default
       count: 1
       config:
         node.store.allow_mmap: false
   EOF
   ```

4. Your backend will now see this cluster!

### Debugging Kubernetes Issues

Check operator logs:
```bash
kubectl logs -n elastic-system statefulset.apps/elastic-operator
```

List CRDs:
```bash
kubectl get elasticsearch --all-namespaces
kubectl get kibana --all-namespaces
```

Describe a cluster:
```bash
kubectl describe elasticsearch quickstart
```

## Testing

### Manual Testing

1. Start both frontend and backend
2. Navigate to http://localhost:3000
3. Test features:
   - View cluster list
   - Click on cluster details
   - Check health status
   - Test navigation

### API Testing with curl

```bash
# Health check
curl http://localhost:4000/health

# List clusters
curl http://localhost:4000/api/v1/clusters

# Get specific cluster
curl http://localhost:4000/api/v1/clusters/default/quickstart

# Create cluster
curl -X POST http://localhost:4000/api/v1/clusters/default \
  -H "Content-Type: application/json" \
  -d @cluster-spec.json
```

## Common Issues

### Backend can't connect to Kubernetes

**Problem**: `Error listing Elasticsearch clusters`

**Solution**:
- Ensure kubectl is working: `kubectl cluster-info`
- Check kubeconfig: `echo $KUBECONFIG`
- Verify ECK operator is running:
  ```bash
  kubectl get pods -n elastic-system
  ```

### Frontend shows CORS errors

**Problem**: Browser console shows CORS policy errors

**Solution**:
- Check backend CORS_ORIGIN environment variable
- Ensure backend is running on port 4000
- Verify proxy config in vite.config.ts

### TypeScript errors

**Problem**: Type errors in IDE

**Solution**:
```bash
# Frontend
cd frontend
npm run type-check

# Backend
cd backend
npm run type-check
```

### Port already in use

**Problem**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3000  # or :4000

# Kill process
kill -9 <PID>
```

## Code Style

### TypeScript

- Use interfaces for object shapes
- Prefer `const` over `let`
- Use async/await instead of promises
- Add JSDoc comments for public APIs

### React

- Use functional components
- Prefer hooks over classes
- Extract complex logic into custom hooks
- Keep components small and focused

### File Naming

- Components: PascalCase (`ClusterList.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Types: PascalCase (`types/index.ts`)

## Git Workflow

1. Create feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push and create PR:
   ```bash
   git push origin feature/my-feature
   ```

### Commit Message Format

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

## Resources

- [Elastic UI Framework Docs](https://elastic.github.io/eui/)
- [ECK Documentation](https://www.elastic.co/guide/en/cloud-on-k8s/current/index.html)
- [Kubernetes API Docs](https://kubernetes.io/docs/reference/kubernetes-api/)
- [React Query Docs](https://tanstack.com/query/latest)
