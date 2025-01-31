export class Http {
  constructor(userState = null) {
    this.userState = userState;
    this.jwtAuthPaths = [
      '/api/chat/',
    ];
    
    this.expectedUnauthorizedPaths = [
      '/api/auth/me',
    ];
    
    this.request = this.request.bind(this);
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.getCsrfToken = this.getCsrfToken.bind(this);
  }


  requiresJwtAuth(url) {
    return this.jwtAuthPaths.some(path => url.includes(path));
  }

  async getAuthToken() {
    if (!this.userState) {
      throw new Error('UserState not initialized');
    }
    return await this.userState.getWebSocketToken();
  }

  async request(url, options = {}) {
    if (!url.startsWith('http')) {
      url = `http://localhost:8000/api${url.startsWith('/') ? url : `/${url}`}`;
    }

    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    if (!this.requiresJwtAuth(url)) {
      defaultOptions.headers['X-CSRFToken'] = this.getCsrfToken();
    }

    try {
      if (this.requiresJwtAuth(url)) {
        const token = await this.getAuthToken();
        console.log({token})
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
      }

      const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      };

      const isFormData = options.body instanceof FormData;
      if (isFormData) {
        delete requestOptions.headers['Content-Type'];
      }

      if (requestOptions.body && typeof requestOptions.body === 'object' && !isFormData) {
        requestOptions.body = JSON.stringify(requestOptions.body);
      }

      if (process.env.NODE_ENV !== 'production') {
        console.debug('Request:', {
          url,
          options: requestOptions,
          cookies: document.cookie
        });
      }

      const response = await fetch(url, requestOptions);

      if (process.env.NODE_ENV !== 'production') {
        console.debug('Response:', {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        });
      }

      const data = await response.json().catch(() => ({
        message: 'No response body'
      }));

      if (response.ok) {
        return data;
      }

      const isExpectedUnauthorized = 
        (response.status === 401 || response.status === 403) && 
        this.expectedUnauthorizedPaths.some(path => url.includes(path));

      if ((response.status === 401 || response.status === 403) && !isExpectedUnauthorized) {
        if (!document.cookie.includes('sessionid')) {
          window.location.href = '/login';
          return;
        }

        const error = new Error(data.error || 'Authentication required');
        error.status = response.status;
        error.isAuthenticationError = true;
        throw error;
      }

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

   /**
   * Performs a GET request to the specified URL.
   * GET requests are used to retrieve data without modifying server state.
   * 
   * @param {string} url - The endpoint URL to send the request to
   * @param {object} options - Optional configuration for the request
   * @returns {Promise} - Resolves with the response data
   */
   async get(url, options = {}) {
    return this.request(url, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * Performs a POST request to the specified URL.
   * POST requests are used to create new resources or submit data for processing.
   * 
   * @param {string} url - The endpoint URL to send the request to
   * @param {object|FormData} body - The data to send in the request body
   * @param {object} options - Optional additional configuration for the request
   * @returns {Promise} - Resolves with the response data
   */
  async post(url, body = null, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: body
    });
  }

  /**
   * Performs a PUT request to the specified URL.
   * PUT requests are used to update existing resources with new data.
   * 
   * @param {string} url - The endpoint URL to send the request to
   * @param {object|FormData} body - The data to send in the request body
   * @param {object} options - Optional additional configuration for the request
   * @returns {Promise} - Resolves with the response data
   */
  async put(url, body = null, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: body
    });
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