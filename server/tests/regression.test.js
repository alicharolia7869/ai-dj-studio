import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Track } from '../src/models/Track.js';
import { DJLounge } from '../src/models/DJLounge.js';
import { evaluateSegueCandidate, rankSegueCandidates } from '../src/utils/camelot.js';
import { resolveLoungeQuery } from '../src/controllers/loungeController.js';
import { aiDjEngine } from '../src/services/aiEngine.js';

let authToken = '';
let testLoungeId = '';
let testInviteCode = 'REG777';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB();

  // Create test user and obtain auth token
  const user = await User.create({
    displayName: 'Regression Tester',
    email: 'regression@aidjstudio.io',
    password: 'Password123!',
    role: 'host'
  });

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'regression@aidjstudio.io', password: 'Password123!' });
  authToken = res.body.data.accessToken;

  // Create track and lounge
  const track = await Track.create({
    title: 'Regression Anthem',
    artist: 'QA Specialist',
    genre: 'Tech House',
    duration: 210,
    acousticProfile: { bpm: 125, camelotKey: '8A', energy: 0.8, valence: 0.7 }
  });

  const lounge = await DJLounge.create({
    name: 'Regression Lounge',
    host: user._id,
    inviteCode: testInviteCode,
    vibeProfile: 'Deep House',
    currentTrack: { track: track._id, isPlaying: true, playbackPosition: 0 }
  });
  testLoungeId = lounge._id.toString();
});

afterAll(async () => {
  await DJLounge.deleteMany({ inviteCode: testInviteCode });
  await User.deleteMany({ email: 'regression@aidjstudio.io' });
  await Track.deleteMany({ title: 'Regression Anthem' });
  await disconnectDB();
});

describe('Targeted Regression Tests for Bug Fixes', () => {
  describe('Bug 7: Custom Invite Code Resolution & CastError Prevention', () => {
    test('resolveLoungeQuery correctly differentiates MongoDB ObjectId and custom invite code', () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      expect(resolveLoungeQuery(validObjectId)).toEqual({ _id: validObjectId });

      expect(resolveLoungeQuery('MYCODE')).toEqual({ inviteCode: 'MYCODE' });
      expect(resolveLoungeQuery('room_99')).toEqual({ inviteCode: 'ROOM_99' });
      expect(resolveLoungeQuery(null)).toEqual({ _id: null });
    });

    test('GET /api/v1/lounges/:code retrieves lounge by custom invite code without CastError', async () => {
      const res = await request(app)
        .get(`/api/v1/lounges/${testInviteCode}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lounge.inviteCode).toBe(testInviteCode);
    });

    test('POST /api/v1/lounges/:code/join joins lounge by custom invite code in URL path without CastError', async () => {
      const res = await request(app)
        .post(`/api/v1/lounges/${testInviteCode}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect([200, 403]).toContain(res.status); // 200 joined, or 403 already in / max
      expect(res.body.success).toBe(true);
    });
  });

  describe('Bug 9: Null Track Safety in Camelot Harmonic Engine', () => {
    test('evaluateSegueCandidate safely handles null or undefined currentTrack without throwing', () => {
      const dummyCandidate = {
        _id: 'c1',
        title: 'Candidate',
        acousticProfile: { bpm: 126, camelotKey: '8A', energy: 0.8 }
      };

      const resultNullCurrent = evaluateSegueCandidate(null, dummyCandidate);
      expect(resultNullCurrent.compatible).toBe(false);
      expect(resultNullCurrent.score).toBe(0);
      expect(resultNullCurrent.reason).toBeDefined();

      const resultNullBoth = evaluateSegueCandidate(null, null);
      expect(resultNullBoth.compatible).toBe(false);
    });

    test('rankSegueCandidates safely handles null currentTrack or empty candidate arrays', () => {
      const resultNull = rankSegueCandidates(null, []);
      expect(resultNull).toEqual({ validCandidates: [], rejectedCandidates: [], bestCandidate: null });

      const resultEmpty = rankSegueCandidates({ acousticProfile: { bpm: 124, camelotKey: '8A' } }, []);
      expect(resultEmpty).toEqual({ validCandidates: [], rejectedCandidates: [], bestCandidate: null });
    });
  });

  describe('AI DJ Engine Transition Commentary Null Safety', () => {
    test('_generateDeterministicTransition gracefully handles null currentTrack or nextTrack', () => {
      const commentary = aiDjEngine._generateDeterministicTransition(null, null, {
        harmonic: { relation: 'Exact' },
        bpmEval: { relation: 'Matched' },
        crowdSentiment: { category: 'Hyped' },
        roomVibe: 'Festival',
        nextEnergy: 0.85
      });
      expect(commentary).toBeDefined();
      expect(typeof commentary).toBe('string');
      expect(commentary.length).toBeGreaterThan(10);
    });
  });
});
