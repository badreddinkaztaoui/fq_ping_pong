export class Http {

  constructor() {
    this.expectedUnauthorizedPaths = [
      '/api/auth/me',
    ]
    this.request = this.request.bind(this);
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.getCsrfToken = this.getCsrfToken.bind(this);
  }

  async get(url, options = {}) {
    return await this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return await this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async request(url, options = {}) {
    if (!url.startsWith('http')) {
      url = `http://localhost:8000/api${url.startsWith('/') ? url : `/${url}`}`;
    }

    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': this.getCsrfToken(),
      }
    };

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      });

      const data = await response.json().catch(() => ({
        message: 'No response body'
      }));

      if (response.ok) {
        return data;
      }

      const isExpectedUnauthorized = response.status === 401 && 
        this.expectedUnauthorizedPaths.some(path => url.includes(path));

      if (isExpectedUnauthorized) {
        const error = new Error(data.error || 'Authentication required');
        error.isExpectedError = true;
        throw error;
      }

      console.error('API Error:', {
        url,
        status: response.status,
        data
      });

      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    } catch (error) {
      if (!error.isExpectedError) {
        console.error('Request failed:', {
          url,
          options,
          error
        });
      }
      
      throw error;
    }
  }

  getCsrfToken() {
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
    
    return cookieValue;
  }
}