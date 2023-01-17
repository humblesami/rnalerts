import React from 'react';
import * as Notifications from 'expo-notifications';
import expoPushTokensApi from '../api/expoPushTokens';
import SoundPlayer from 'react-native-sound-player';

import { View, Text, Button, StyleSheet } from 'react-native';
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
    }),
});


export default class AppNavigator extends React.Component {
    notificationListener = {}
    responseListener = {};
    myToken = '';
    constructor(){
        super();
        this.state = {
            error_message: '',
            latest_note_id: ''
        };
    }
    componentDidMount() {
        let obj_this = this;
        try{
            this.registerForPushNotificationsAsync().then(pushToken => {
                console.log(pushToken);
                if(!pushToken){
                    let message = 'Invalid Token';
                    obj_this.setState({error_message: message});
                }
                else{
                    expoPushTokensApi.register(pushToken);
                    obj_this.submit_token(pushToken);
                    obj_this.myToken = pushToken;
                    obj_this.playSound();
                }
            }).catch(er=>{
                setState(() => {
                    let message = ('Could not registerPushNotificationsAsync-1');
                    obj_this.setState({error_message: message});
                });
            });
        }
        catch(err){
            setState(() => {
                let message = ('Could not registerPushNotificationsAsync-2');
                obj_this.setState({error_message: message});
            });
        }


        // This listener is fired whenever a notification is received while the app is foregrounded
        obj_this.notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('--- notification received ---');
            //obj_this.playSound();
        });

        // This listener is fired whenever a user taps on or interacts with a notification
        // (works when app is foregrounded, backgrounded, or killed)
        obj_this.responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            let category_id = response.notification.request.content.categoryIdentifier;
            console.log('--- notification here ---' + category_id);
             obj_this.setState({latest_note_id: category_id});
        });

        // Unsubscribe from events
        return () => {
            Notifications.removeNotificationSubscription(obj_this.notificationListener.current);
            Notifications.removeNotificationSubscription(obj_this.responseListener.current);
        };
    }

    playSound() {
        SoundPlayer.playSoundFile('beep', 'mp3');
    }

    async sendNotification(){
        let baseUrl = 'http://0.0.0.0:9000/api';
        let endpoint = '/messages/send';
        try{
            let resp = await fetch(baseUrl + endpoint);
            let json = await resp.json();
            console.log('Response', json);
        }
        catch(er){
            console.log('Error in send get =>' , er);
        }
    }

    async stopNotification(){
        let baseUrl = 'http://0.0.0.0:9000/api';
        let endpoint = '/messages/stop?note_id='+ obj_this.latest_note_id;
        try{
            let resp = await fetch(baseUrl + endpoint);
            let json = await resp.json();
            if(json.status == 'success'){
                obj_this.setState({latest_note_id: ''});
            }
        }
        catch(er){
            let message = ('Error in stop => ' + er);
            this.setState({error_message: message});
        }
    }

    async submit_token(obtained_token){
        let baseUrl = 'http://0.0.0.0:9000/api';
        let endpoint = '/messages/submit-token?obtained_token='+obtained_token;
        try{
            let resp = await fetch(baseUrl + endpoint);
            let json = await resp.json();
            console.log('Response', json);
        }
        catch(er){
            let message = ('Error in submit token =>' + '' + er);
            this.setState({error_message: message});
        }
    }

    async registerForPushNotificationsAsync() {
        try{
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('down_alerts', {
                    name: 'down_alerts',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;


            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                alert('Failed to get push token for push notification!');
                return;
            }
            let res = await Notifications.getExpoPushTokenAsync();
            let token = res.data;
            return token;
        }
        catch(er){
            let message = ('Device not connected or could not get token =>' + '' + er);
            this.setState({error_message: message});
            return message;
        }
    }

    render(){
        let obj_this = this;
        if(obj_this.state.error_message){
            return (
                <View style={styles.container}>
                    <Text>{obj_this.state.error_message}</Text>
                </View>
            );
        }
        function get_stop_btn(){
            if(obj_this.state.latest_note_id){
                return (<View style={styles.btnstyle}>
                    <Button
                        title="Stop Notification"
                        onPress={obj_this.stopNotification}
                    />
                </View>);
            }
            else{
                return(
                    <Text>No active notifications</Text>
                );
            }
        }
        return (
            <View style={styles.container}>
                {get_stop_btn()}
            </View>
        );
    }
}

const styles =  StyleSheet.create({
    container: {
        marginTop: 30,
        padding: 10
    }
});

