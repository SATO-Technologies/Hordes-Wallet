import { BASE_API_ENDPOINT } from '@env';

const doApiCall = async ({ method = 'POST', endpoint = '', params = { }, fallback = null, response = 'json' }) => {
  try {
    let request = await fetch(`${BASE_API_ENDPOINT}/${endpoint}`, {
      method: method,
      body: JSON.stringify(params),
      headers: {
        'Content-Type': 'application/json',
        'wallet-auth-token': global.access_token
      }
    });
    request = response == 'text' ? await request.text() : await request.json();
    return request;
  } catch (error) {
    return fallback;
  }
}

export default hordesApi = {

  account: {
    create: async (params) => {
      return await doApiCall({ endpoint: 'account/create.php', params: params });
    },
    update: async (params) => {
      return await doApiCall({ endpoint: 'account/update.php', params: params });
    },
    fetchProfile: async (params) => {
      return await doApiCall({ endpoint: 'account/profile.php', params: params });
    }
  },
  connect: {
    request: async (params) => {
      return await doApiCall({ endpoint: 'connect/request.php', params: params });
    }
  },
  currencies: {
    get: async () => {
      return await doApiCall({ endpoint: 'currencies/get.php' });
    }
  },
  collections: {
    get: async () => {
      return await doApiCall({ endpoint: 'collections/get.php', fallback: [] });
    }
  },
  gifts: {
    get: async () => {
      return await doApiCall({ endpoint: 'gifts/get2.php', fallback: [] });
    }
  },
  raresats: {
    search: async (params) => {
      return await doApiCall({ endpoint: 'raresats/search.php', params: params, fallback: { }, response: 'text' });
    }
  },
  server: {
    status: async () => {
      return await doApiCall({ endpoint: 'server/status.php' });
    }
  },
  strings: {
    getData: async () => {
      return await doApiCall({ endpoint: 'strings/get.php' });
    }
  }

}
