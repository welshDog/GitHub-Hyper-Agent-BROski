
import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';

// Mock Redis
const mockRedisInstance = {
    ping: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
    status: 'ready',
    // Add minimal methods for BullMQ if it tries to use this connection
    duplicate: jest.fn(() => mockRedisInstance),
    connect: jest.fn(),
    disconnect: jest.fn(),
} as any;

const mockRedisConstructor = jest.fn(() => mockRedisInstance);

// Mock BullMQ
const mockQueueInstance = {
    add: jest.fn().mockResolvedValue({ id: 'job-123' } as any),
    close: jest.fn(),
    on: jest.fn(),
} as any;

const mockQueueConstructor = jest.fn(() => mockQueueInstance);

// Mock ioredis and bullmq BEFORE importing anything else
jest.unstable_mockModule('ioredis', () => ({
    Redis: mockRedisConstructor,
    default: mockRedisConstructor,
}));

jest.unstable_mockModule('bullmq', () => ({
    Queue: mockQueueConstructor,
}));

describe('API Integration Tests', () => {
  let buildServer: any;
  let initDB: any;
  let request: any;
  let app: any;
  // We need to access the mocked Redis instance that was created
  // But since we created the mock instance outside, we can control it.
  
  beforeAll(async () => {
    // Dynamic imports
    const serverModule = await import('../src/server.js');
    buildServer = serverModule.buildServer;
    
    const dbModule = await import('../src/db/index.js');
    initDB = dbModule.initDB;
    
    const supertest = await import('supertest');
    request = supertest.default;

    initDB();
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /health should return 200 OK', async () => {
    const response = await request(app.server)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'ok');
  });

  it('GET /health/ready should return 200 OK when Redis is healthy', async () => {
    mockRedisInstance.ping.mockResolvedValue('PONG');
    const response = await request(app.server)
        .get('/health/ready')
        .expect(200);
    
    expect(response.body).toHaveProperty('status', 'ready');
    expect(response.body).toHaveProperty('redis', 'connected');
  });

  it('GET /health/ready should return 503 when Redis is down', async () => {
    mockRedisInstance.ping.mockRejectedValue(new Error('Connection lost'));
    const response = await request(app.server)
        .get('/health/ready')
        .expect(503);
    
    expect(response.body).toHaveProperty('status', 'not_ready');
  });
});
