import React from 'react';
import * as Notifications from 'expo-notifications';
import SoundPlayer from 'react-native-sound-player';
import OpenURLButton from '../components/openurl';
import AppButton from '../components/Button';
import { View, AsyncStorage, Text, StyleSheet, Clipboard, LogBox } from 'react-native';

LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs();


Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
    }),
});


let rnStorage = {
    save: async (key, value) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            // Error saving data
        }
    },
    get: async (key) => {
        try {
            const value = await AsyncStorage.getItem(key);
            return value;
        } catch (error) {
            // Error retrieving data
        }
    }
}


export default class AppNavigator extends React.Component {
    notificationListener = {}
    responseListener = {};
    mounted = 0;
    baseUrl = 'https://dap.92newshd.tv';
    constructor() {
        super();
        this.state = {
            expoToken: '',
            error_message: '',
            alert_types: [],
            tokenSent: 0,
            bg_log: 'No bg worker yet',
            copyBtnLabel: 'Copy token'
        };
        //this.baseUrl = 'http://127.0.0.1:8000'
    }

    run_bg_process() {
    }
    copyToken() {
        let obj_this = this;
        Clipboard.setString(obj_this.state.expoToken);
        obj_this.setState({ copyBtnLabel: 'Copied' });
    };

    st_upd = 0;

    setState(values){
        let obj_this = this;
        if(!this.mounted){
            for(let key in values){
                this.state[key] = values[key];
            }
            console.log(obj_this.st_upd, values);
            return;
        }
        obj_this.st_upd += 1;
        super.setState(values);
    }

    on_error(er, prefix){
        this.setState({ error_message: prefix });
    }

    componentDidMount() {
        let obj_this = this;

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

        obj_this.mounted = 1;

        try {
            console.log("Mount");
            this.registerForPushNotificationsAsync().then(pushToken => {
                if (!pushToken) {
                    let message = 'Invalid Token';
                    obj_this.on_error(0, message);
                }
                else {
                    obj_this.setState({expoToken: pushToken});
                    obj_this.submit_token(pushToken);
                }
            }).catch(er => {
                let message = ('Could not registerPushNotificationsAsync-1');
                obj_this.on_error(er, message);
            });
        }
        catch (err) {
            let message = ('Could not registerPushNotificationsAsync-2');
            obj_this.on_error(er, message);
        }

        // Unsubscribe from events
        return () => {
            Notifications.removeNotificationSubscription(obj_this.notificationListener.current);
            Notifications.removeNotificationSubscription(obj_this.responseListener.current);
        };
    }

    playSound() {
        SoundPlayer.playSoundFile('beep', 'mp3');
    }

    async sendNotification() {

        let endpoint = '/messages/send';
        try {
            let resp = await fetch(this.baseUrl + endpoint);
            let json = await resp.json();
            console.log('Response', json);
        }
        catch (er) {
            console.log('Error in send get =>', er);
        }
    }

    async stopNotification(alert_id) {
        let obj_this = this;
        try {
            let alert_index = obj_this.state.alert_types.indexOf(alert_id);
            if (alert_index == -1) {
                return;
            }
            let endpoint = '/expo/stop?note_id=' + alert_id + '&device_token=' + obj_this.state.expoToken;
            let resp = await fetch(this.baseUrl + endpoint);
            let json = await resp.json();
            if (json.status == 'success') {

                obj_this.state.alert_types.splice(alert_index, 1);
                obj_this.setState({ alert_types: obj_this.state.alert_types });
            }
        }
        catch (er) {
            let message = ('Error in stop => ' + er);
            obj_this.on_error(er, message);
        }
    }

    async submit_token(obtained_token) {
        console.log('Submitting Token');
        let my_token = await rnStorage.get('token');
        if(my_token){
            console.log('Already submitted');
            return;
        }
        if (!obtained_token) {
            alert('No token provided');
            return;
        }
        let obj_this = this;
        let data = { obtained_token: obtained_token };
        let endpoint = '/expo/submit/' + obj_this.state.expoToken;
        endpoint = this.baseUrl + endpoint;
        let postOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };
        fetch(endpoint).then((response) => response.json()).then((json_data) => {
            if(json_data.status == 'success'){
                rnStorage.save('token', obtained_token).then(()=>{});
                console.log('Now Submitted');
            }
            else{
                obj_this.on_error(0, json_data.message);
            }
        }).catch((er) => {
            console.log('\n'+endpoint+'\n')
            let message = ('Error in submit token => ' + '' + er);
            obj_this.on_error(er, message);
        });
    }

    async registerForPushNotificationsAsync() {
        try {
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
        catch (er) {
            let message = ('Device not connected or could not get token =>' + '' + er);
            obj_this.on_error(er, message);
            return message;
        }
    }

    render() {
        let obj_this = this;

        function get_stop_btn() {

            if (obj_this.state.error_message) {
                return (
                    <View style={styles.container}>
                        <Text>{obj_this.state.error_message}</Text>
                    </View>
                );
            }

            let items_list = obj_this.state.alert_types;
            if (items_list.length) {
                return (
                    <View>
                        {
                            items_list.map(function (item, j) {
                                let title = "Stop alerts => " + item;
                                return (
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
            else {
                if (obj_this.state.expoToken) {
                    return (
                        <Text>No active notifications</Text>
                    );
                }
                else {
                    <Text>Registering Token at server...</Text>
                }
            }
        }

        function get_submit_button() {
            if (!obj_this.state.tokenSent) {
                return (<AppButton onPress={() => { obj_this.submit_token() }} title="Submit Token" />);
            }
        }

        // <AppButton onPress={() => { obj_this.run_bg_process() }} title="Start Bg Worker" />
        // <Text>{obj_this.state.bg_log}</Text>

        return (
            <View style={styles.container}>
                <Text selectable={true}>Token == {obj_this.state.expoToken || 'Obtaining token'}</Text>
                <AppButton onPress={() => { obj_this.copyToken() }} title={obj_this.state.copyBtnLabel} />
                <OpenURLButton url='https://expo.dev/notifications' txt='Test Notifications' />
                {get_submit_button()}
                {get_stop_btn()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        marginTop: 30,
        padding: 10
    }
});

