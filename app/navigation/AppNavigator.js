import React from 'react';
import * as Notifications from 'expo-notifications';
import expoPushTokensApi from '../api/expoPushTokens';
import SoundPlayer from 'react-native-sound-player';
import OpenURLButton from '../components/openurl';
import AppButton from '../components/Button';
import { View, Text, StyleSheet, Clipboard, LogBox } from 'react-native';

LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs();

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
    }),
});


export default class AppNavigator extends React.Component {
    notificationListener = {}
    responseListener = {};
    constructor(){
        super();
        this.state = {
            expoToken: '',
            error_message: '',
            alert_types: [],
            tokenSent: 0,
            mounted: 0,
            copyBtnLabel: 'Copy token'
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
                    obj_this.state.expoToken = pushToken;
                    expoPushTokensApi.register(pushToken);
                    obj_this.submit_token(pushToken);
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
        });

        obj_this.state.mounted = 1;

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

    async stopNotification(alert_id){
        let obj_this = this;
        try{
            let alert_index = obj_this.state.alert_types.indexOf(alert_id);
            if(alert_index == -1){
                return;
            }
            let baseUrl = 'http://0.0.0.0:9000/api';
            let endpoint = '/messages/stop?note_id='+ alert_id+'&device_token='+obj_this.state.expoToken;
            let resp = await fetch(baseUrl + endpoint);
            let json = await resp.json();
            if(json.status == 'success'){

                obj_this.state.alert_types.splice(alert_index, 1);
                obj_this.setState({alert_types: obj_this.state.alert_types});
            }
        }
        catch(er){
            let message = ('Error in stop => ' + er);
            this.setState({error_message: message});
        }
    }

    async submit_token(obtained_token){
        let obj_this = this;
        let baseUrl = 'http://0.0.0.0:9000/api';
        let endpoint = '/messages/submit-token?obtained_token='+obtained_token;
        try{
            let resp = await fetch(baseUrl + endpoint);
            let json = await resp.json();
            if(obj_this.state.mounted)
            {
                obj_this.setState({error_message: '', alert_types: json.active_alert_types, tokenSent: 1});
            }
            else{
                obj_this.state.update({error_message: '', alert_types: json.active_alert_types, tokenSent: 1});
            }
        }
        catch(er){
            let message = ('Error in submit token => ' + '' + er);
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

    copyToken () {
        let obj_this = this;
        Clipboard.setString(obj_this.state.expoToken);
        obj_this.setState({copyBtnLabel: 'Copied'});
    };

    render(){
        let obj_this = this;

        function get_stop_btn(){

            if(obj_this.state.error_message){
                return (
                    <View style={styles.container}>
                        <Text>{obj_this.state.error_message}</Text>
                    </View>
                );
            }

            let items_list = obj_this.state.alert_types;
            if(items_list.length){
                return(
                    <View>
                        {
                            items_list.map(function(item, j) {
                                let title = "Stop alerts => " + item;
                                return(
                                    <View key={j} style={styles.btnstyle}>
                                        <AppButton
                                            title={title}
                                            onPress={() => {
                                                obj_this.stopNotification(item);
                                            }}
                                        />
                                    </View>
                                )
                            })
                        }
                    </View>
                );
            }
            else{
                if(obj_this.state.expoToken){
                    return(
                        <Text>No active notifications</Text>
                    );
                }
                else{
                    <Text>Registering Token at server...</Text>
                }
            }
        }

        function get_submit_button(){
            if(!obj_this.state.tokenSent){
                return(<AppButton onPress={() => {obj_this.submit_token()}} title="Submit Token" />);
            }
        }

        return (
            <View style={styles.container}>
                <Text selectable={true}>Token == {obj_this.state.expoToken}</Text>
                <AppButton onPress={() => {obj_this.copyToken()}} title={obj_this.state.copyBtnLabel} />
                <OpenURLButton url='https://expo.dev/notifications' txt='Test Notifications'/>
                {get_submit_button()}
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

