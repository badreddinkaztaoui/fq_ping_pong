export class Http {
  constructor(userState = null) {
    this.userState = userState;
    this.csrfToken = null;
    this.accessToken = null;
    
    this.request = this.request.bind(this);
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.getCsrfToken = this.getCsrfToken.bind(this);
    this.setCsrfToken = this.setCsrfToken.bind(this);
    this.getAccessToken = this.getAccessToken.bind(this);
    this.fetchAccessToken = this.fetchAccessToken.bind(this);
  }

  getCsrfToken() {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    const name = 'csrftoken';
    let cookieValue = null;
    
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    
    this.csrfToken = cookieValue;
    return cookieValue;
  }

  async fetchAccessToken() {
    try {
      const response = await this.get('/auth/token/');
      this.accessToken = response.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Failed to fetch access token:', error);
      return null;
    }
  }

  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }
    
    return this.fetchAccessToken();
  }

  setCsrfToken(token) {
    this.csrfToken = token;
  }

  async request(url, options = {}) {
    if (!url.startsWith('http')) {
      url = `http://localhost:8000/api${url.startsWith('/') ? url : `/${url}`}`;
    }

    const isChatEndpoint = url.includes('/api/chat/');

    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    };

    try {
      const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      };

      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        requestOptions.headers['X-CSRFToken'] = csrfToken;
      }

      if (isChatEndpoint) {
        const accessToken = await this.getAccessToken();
        if (accessToken) {
          requestOptions.headers['Authorization'] = `Bearer ${accessToken}`;
        }
      }

      const isFormData = options.body instanceof FormData;
      if (isFormData) {
        delete requestOptions.headers['Content-Type'];
      }

      if (requestOptions.body && typeof requestOptions.body === 'object' && !isFormData) {
        requestOptions.body = JSON.stringify(requestOptions.body);
      }

      const response = await fetch(url, requestOptions);

      if (response.status === 401) {
        this.accessToken = null;
      }

      const data = await response.json().catch(() => ({
        message: 'No response body'
      }));

      if (response.ok) {
        if (data.csrf_token) {
          this.setCsrfToken(data.csrf_token);
        }
        return data;
      }

      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async get(url, options = {}) {
    return this.request(url, {
      ...options,
      method: 'GET'
    });
  }

  async post(url, body = null, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: body
    });
  }

  async put(url, body = null, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: body
    });
  }
}