export class Http {
    static async get(url, options = {}) {
      return await this.request(url, { ...options, method: 'GET' });
    }
  
    static async post(url, data, options = {}) {
      return await this.request(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  
    static async request(url, options = {}) {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    }
  }