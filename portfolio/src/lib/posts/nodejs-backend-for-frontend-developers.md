---
title: "Node.js Backend Essentials for Frontend Developers"
slug: "nodejs-backend-for-frontend-developers"
description: "A frontend developer's guide to building backend services with Node.js. Covers Express, REST APIs, middleware, database basics, authentication, and deployment — with the mindset shift from frontend to backend."
publishDate: "2026-02-10"
author: "Umesh Malik"
category: "Node.js"
tags: ["Node.js", "Backend", "JavaScript", "TypeScript", "API"]
keywords: "Node.js for frontend developers, Express.js tutorial, REST API Node.js, backend basics, fullstack JavaScript, Node.js TypeScript, API development"
image: "/blog/nodejs-backend-cover.svg"
imageAlt: "Node.js backend architecture showing Express server, middleware chain, REST API endpoints, and database layer"
featured: false
published: true
readingTime: "14 min read"
---

As a frontend engineer who has built backend services at BYJU'S and for personal projects, I know the mental shift from frontend to backend isn't trivial. Here's what you need to know to build your first production-quality Node.js backend.

## The Mindset Shift

Frontend and backend engineering have different concerns:

| Frontend | Backend |
|----------|---------|
| User experience | Data integrity |
| Render performance | Throughput and latency |
| Client state | Database state |
| Browser APIs | OS and network APIs |
| Graceful degradation | Error handling and retries |

The biggest adjustment: **on the backend, data is the product**. A UI bug is annoying; a data corruption bug can be catastrophic.

## Project Setup with TypeScript

```bash
mkdir my-api && cd my-api
pnpm init
pnpm add express cors helmet
pnpm add -D typescript @types/express @types/node @types/cors tsx
```

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

## Basic Express Server

```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());           // Security headers
app.use(cors());             // CORS for frontend
app.use(express.json());     // Parse JSON bodies

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Run with: `pnpm tsx watch src/index.ts`

## Building REST Endpoints

Structure your routes by resource:

```typescript
// src/routes/users.ts
import { Router } from 'express';

const router = Router();

interface User {
  id: string;
  name: string;
  email: string;
}

// In-memory store (replace with database)
const users: User[] = [];

// GET /api/users
router.get('/', (req, res) => {
  res.json(users);
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST /api/users
router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
  };

  users.push(user);
  res.status(201).json(user);
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const index = users.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });

  users.splice(index, 1);
  res.status(204).send();
});

export default router;
```

Register routes in your main file:

```typescript
// src/index.ts
import userRoutes from './routes/users';

app.use('/api/users', userRoutes);
```

## Middleware: The Backend Equivalent of HOCs

Middleware in Express is like higher-order components in React — they wrap your handlers with additional behavior.

### Error Handling Middleware

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

export { AppError, errorHandler };
```

### Request Logging Middleware

```typescript
// src/middleware/logger.ts
import { Request, Response, NextFunction } from 'express';

function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}

export { logger };
```

## Database Basics with MongoDB

```typescript
// src/db.ts
import { MongoClient, Db } from 'mongodb';

let db: Db;

async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  await client.connect();
  db = client.db('myapp');
  console.log('Connected to MongoDB');
}

function getDB(): Db {
  if (!db) throw new Error('Database not connected');
  return db;
}

export { connectDB, getDB };
```

Update your user route to use the database:

```typescript
// GET /api/users
router.get('/', async (req, res) => {
  const users = await getDB().collection('users').find().toArray();
  res.json(users);
});
```

## Authentication: JWT Basics

```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';

interface AuthRequest extends Request {
  userId?: string;
}

function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export { authenticate, generateToken, AuthRequest };
```

## Environment Variables

```typescript
// src/config.ts
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

export const config = envSchema.parse(process.env);
```

Using Zod for environment validation catches missing variables at startup instead of at runtime when a request hits the missing value.

## Error Handling Patterns

```typescript
// Wrap async route handlers to catch promise rejections
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await getDB().collection('users').findOne({ _id: req.params.id });
  if (!user) throw new AppError(404, 'User not found');
  res.json(user);
}));
```

## Project Structure

```
src/
├── index.ts          # Entry point, server setup
├── config.ts         # Environment variables
├── db.ts             # Database connection
├── routes/
│   ├── users.ts      # User endpoints
│   └── auth.ts       # Auth endpoints
├── middleware/
│   ├── auth.ts       # JWT authentication
│   ├── logger.ts     # Request logging
│   └── errorHandler.ts
└── types/
    └── index.ts      # Shared TypeScript types
```

## Key Takeaways

- Start with Express + TypeScript — it's the most transferable backend skill
- Think about data integrity first, then performance
- Middleware is your primary tool for cross-cutting concerns (auth, logging, errors)
- Validate everything at the boundary (request body, env vars, query params)
- Use async/await with proper error handling — unhandled rejections crash Node processes
- Keep your project structure flat and organized by feature, not by type
- Learn SQL basics even if you start with MongoDB — most companies use relational databases
