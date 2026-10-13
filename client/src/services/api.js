/**
 * AI DJ Studio — API Service Client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('aidj_access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('aidj_refresh_token');
  }

  setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem('aidj_access_token', accessToken);
    if (refreshToken) localStorage.setItem('aidj_refresh_token', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('aidj_access_token');
    localStorage.removeItem('aidj_refresh_token');
    localStorage.removeItem('aidj_user');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers
    });

    // Check for expired token and attempt refresh
    if (response.status === 401 && this.getRefreshToken() && !endpoint.includes('/auth/')) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        response = await fetch(url, {
          ...options,
          headers
        });
      } else {
        this.clearTokens();
        window.dispatchEvent(new Event('auth:logout'));
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `API error: ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!res.ok) return false;
      const json = await res.json();
      if (json.data?.accessToken) {
        this.setTokens(json.data.accessToken, json.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.data?.accessToken) {
      this.setTokens(res.data.accessToken, res.data.refreshToken);
      localStorage.setItem('aidj_user', JSON.stringify(res.data.user));
    }
    return res.data;
  }

  async register(userData) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (res.data?.accessToken) {
      this.setTokens(res.data.accessToken, res.data.refreshToken);
      localStorage.setItem('aidj_user', JSON.stringify(res.data.user));
    }
    return res.data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (_) {}
    this.clearTokens();
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Lounges
  async getLounges(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/lounges${query ? `?${query}` : ''}`);
  }

  async getLounge(id) {
    return this.request(`/lounges/${id}`);
  }

  async createLounge(data) {
    return this.request('/lounges', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async joinLounge(id, inviteCode) {
    return this.request(`/lounges/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ inviteCode })
    });
  }

  async updateLoungeSettings(id, data) {
    return this.request(`/lounges/${id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async endLounge(id) {
    return this.request(`/lounges/${id}/end`, { method: 'POST' });
  }

  // Queue
  async getQueue(loungeId) {
    return this.request(`/lounges/${loungeId}/queue`);
  }

  async addToQueue(loungeId, trackId) {
    return this.request(`/lounges/${loungeId}/queue`, {
      method: 'POST',
      body: JSON.stringify({ trackId })
    });
  }

  async voteQueue(loungeId, trackId) {
    return this.request(`/lounges/${loungeId}/queue/${trackId}/vote`, {
      method: 'POST'
    });
  }

  async reorderQueue(loungeId, reorderedQueueIds) {
    return this.request(`/lounges/${loungeId}/queue/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ reorderedQueueIds })
    });
  }

  async getAiSegue(loungeId) {
    return this.request(`/lounges/${loungeId}/ai/segue`, { method: 'POST' });
  }

  // Soundclash
  async createBattle(loungeId, data) {
    return this.request(`/lounges/${loungeId}/soundclash`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async voteBattle(loungeId, battleId, candidateTrackId) {
    return this.request(`/lounges/${loungeId}/soundclash/${battleId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ candidateTrackId })
    });
  }

  async resolveBattle(loungeId, battleId, tieBreakerWinnerTrackId) {
    return this.request(`/lounges/${loungeId}/soundclash/${battleId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ tieBreakerWinnerTrackId })
    });
  }

  // Chat & AI
  async getMessages(loungeId) {
    return this.request(`/lounges/${loungeId}/messages`);
  }

  async postMessage(loungeId, message) {
    return this.request(`/lounges/${loungeId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  async getSentiment(loungeId) {
    return this.request(`/lounges/${loungeId}/sentiment`);
  }

  async askAi(loungeId, question) {
    return this.request(`/lounges/${loungeId}/ai/ask`, {
      method: 'POST',
      body: JSON.stringify({ question })
    });
  }

  // Tracks
  async getTracks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tracks${query ? `?${query}` : ''}`);
  }

  async getTrack(trackId) {
    return this.request(`/tracks/${trackId}`);
  }

  async createTrack(formData) {
    return this.request('/tracks', {
      method: 'POST',
      body: formData
    });
  }

  async updateTrack(trackId, data) {
    return this.request(`/tracks/${trackId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteTrack(trackId) {
    return this.request(`/tracks/${trackId}`, {
      method: 'DELETE'
    });
  }

  // User & Recommendations
  async getRecommendations() {
    return this.request('/users/me/recommendations');
  }

  async getHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users/me/history${query ? `?${query}` : ''}`);
  }

  async getPreferences() {
    return this.request('/users/me/preferences');
  }

  async updatePreferences(preferences) {
    return this.request('/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences)
    });
  }

  async updateProfile(profileData) {
    return this.request('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  }

  async toggleLike(trackId) {
    return this.request(`/users/tracks/${trackId}/like`, { method: 'POST' });
  }

  // Analytics
  async getAnalytics(loungeId) {
    return this.request(`/analytics/lounges/${loungeId}`);
  }
}

export const api = new ApiClient();
