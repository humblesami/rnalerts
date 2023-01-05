import client from './client';
console.log('will show push');
const register = (pushToken) => {
    console.log('\n\npush\n\n');
    console.log(pushToken);
    console.log('\n\npush\n\n');
    client.post('/expoPushTokens', { token: pushToken });
};

export default {
    register,
}
