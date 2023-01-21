import { create } from 'apisauce';

const apiClient = create({
    baseURL: 'https://dap.92newshd.tv/api' // Use your local network IP
})

export default apiClient;
