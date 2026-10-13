import request from 'supertest';
import { app } from '../src/server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Track } from '../src/models/Track.js';
import { DJLounge } from '../src/models/DJLounge.js';

let hostToken = '';
let listenerToken = '';
let demoTrackId = '';
let demoLoungeId = '';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB();
  await User.deleteMany({});
  await Track.deleteMany({});
  await DJLounge.deleteMany({});

  // Seed sample track
  const track = await Track.create({
    title: 'Pulse Dimension',
    artist: 'DJ Nexus',
    genre: 'Melodic Techno',
    duration: 220,
    acousticProfile: {
      bpm: 126,
      camelotKey: '8A',
      energy: 0.85,
      valence: 0.65
    }
  });
  demoTrackId = track._id.toString();
});

afterAll(async () => {
  await disconnectDB();
});

describe('AI DJ Studio API Integration Tests', () => {
  test('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('AI DJ Studio');
  });

  test('POST /api/v1/auth/register creates a new user account', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'host.test@aidjstudio.io',
        password: 'Password123!',
        displayName: 'Test Host',
        role: 'host'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('host.test@aidjstudio.io');
    expect(res.body.data.accessToken).toBeDefined();
    hostToken = res.body.data.accessToken;
  });

  test('POST /api/v1/auth/register rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'host.test@aidjstudio.io',
        password: 'Password123!',
        displayName: 'Duplicate User'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/login authenticates and issues JWT', async () => {
    // Create listener
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'listener.test@aidjstudio.io',
        password: 'Password123!',
        displayName: 'Test Listener',
        role: 'listener'
      });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'listener.test@aidjstudio.io',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    listenerToken = res.body.data.accessToken;
  });

  test('GET /api/v1/auth/me verifies authenticated session', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${hostToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.displayName).toBe('Test Host');
  });

  test('POST /api/v1/lounges creates a collaborative lounge', async () => {
    const res = await request(app)
      .post('/api/v1/lounges')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        name: 'Electric Skyline',
        vibeProfile: 'Deep House',
        startingTrackId: demoTrackId
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lounge.name).toBe('Electric Skyline');
    expect(res.body.data.lounge.inviteCode).toBeDefined();
    demoLoungeId = res.body.data.lounge._id;
  });

  test('POST /api/v1/lounges/:id/queue adds track with compatibility note', async () => {
    // Create second track
    const track2 = await Track.create({
      title: 'Neon Drift',
      artist: 'Kroma',
      genre: 'Deep House',
      duration: 210,
      acousticProfile: {
        bpm: 125,
        camelotKey: '8A',
        energy: 0.80,
        valence: 0.60
      }
    });

    const res = await request(app)
      .post(`/api/v1/lounges/${demoLoungeId}/queue`)
      .set('Authorization', `Bearer ${listenerToken}`)
      .send({ trackId: track2._id });

    expect(res.status).toBe(201);
    expect(res.body.data.queue.length).toBeGreaterThan(0);
  });

  test('POST /api/v1/lounges/:id/queue/:trackId/vote records upvote', async () => {
    const lounge = await DJLounge.findById(demoLoungeId);
    const queueItemId = lounge.queue[0]._id;

    const res = await request(app)
      .post(`/api/v1/lounges/${demoLoungeId}/queue/${queueItemId}/vote`)
      .set('Authorization', `Bearer ${hostToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/v1/lounges/:id/ai/ask returns grounded response', async () => {
    const res = await request(app)
      .post(`/api/v1/lounges/${demoLoungeId}/ai/ask`)
      .set('Authorization', `Bearer ${listenerToken}`)
      .send({ question: 'Why is this track next in queue?' });

    expect(res.status).toBe(200);
    expect(res.body.data.answer).toBeDefined();
  });

  test('Unauthorized access to protected track creation is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/tracks')
      .set('Authorization', `Bearer ${listenerToken}`)
      .send({
        title: 'Unauthorized Track',
        artist: 'Unknown',
        genre: 'Pop',
        duration: 180,
        bpm: 120,
        camelotKey: '8A'
      });

    expect(res.status).toBe(403);
  });
});
