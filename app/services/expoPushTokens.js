import client from './api';
const register = (pushToken) => {
    client.post('/expoPushTokens', { token: pushToken });
};

export default {
    register,
}
