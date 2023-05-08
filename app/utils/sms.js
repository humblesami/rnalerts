import SmsAndroid from 'react-native-sms-android';

const phoneNumbers = ['1234567890', '0987654321', '5555555555'];
const message = 'Hello from my React Native app!';

function send_messages(message, phoneNumbers) {
    // Loop through each phone number and send the message
    phoneNumbers.forEach(number => {
        SmsAndroid.autoSend(number, message, (fail) => {
                console.log('Failed to send SMS to ' + number + ': ' + fail);
            }, (success) => {
                console.log('SMS sent successfully to ' + number + ': ' + success);
            },
        );
    });
}

export default send_messages;

