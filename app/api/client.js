import { create } from 'apisauce';

const apiClient = create({
    baseURL: 'http://0.0.0.0:9000/api' // Use your local network IP
})

export default apiClient;
