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
            tokenSent: 0,
            subscriptions: [],
            bg_log: 'No bg worker yet',
            copyBtnLabel: 'Copy token',
        };
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
            console.log(notification);
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

    async toggleNotification(alert_id) {
        let obj_this = this;
        try {
            let item = obj_this.state.subscriptions.find((x)=>x.channel__name==alert_id);
            item.active = !item.active;
            let endpoint = '/expo/toggle/' + alert_id + '/' + obj_this.state.expoToken;
            let resp = await fetch(this.baseUrl + endpoint);
            let json = await resp.json();
            if (json.status == 'success') {

                obj_this.setState({subscriptions:obj_this.state.subscriptions});
            }
        }
        catch (er) {
            let message = ('Error in toggle => ' + er);
            obj_this.on_error(er, message);
        }
    }

    async submit_token(obtained_token) {
        console.log('Submitting Token => '+obtained_token);
        let my_token = await rnStorage.get('token');
        if (!obtained_token) {
            alert('No token provided');
            return;
        }
        let obj_this = this;
        let data = { obtained_token: obtained_token };
        let endpoint = '/expo/submit/' + obj_this.state.expoToken;
        if (my_token){
            endpoint = '/expo/channels/' + obj_this.state.expoToken;
        }
        endpoint = this.baseUrl + endpoint;
        let postOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };
        fetch(endpoint).then((response) => {
            if(!response.ok){
                console.log(endpoint);
                return {status: 'error', message: 'Invalid response => '+response.status+ ' from '+endpoint};
            }
            else{
                return response.json();
            }
        }).then((json_data) => {
            if(json_data.status == 'success'){
                rnStorage.save('token', obtained_token).then(()=>{});
                console.log('json_data.channels', json_data.channels);
                obj_this.setState({ subscriptions: json_data.channels})
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
                    name: 'main',
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
        }

        function get_submit_button() {
            if (!obj_this.state.tokenSent) {
                return (<AppButton onPress={() => { obj_this.submit_token() }} title="Submit Token" />);
            }
        }


        function render_alerts(items_list, name){
            return (
                <View>
                    <View>
                        <Text>{name}</Text>
                    </View>
                    <View>
                        {
                            items_list.map(function (item, j) {
                                let title = "Subscribe => " + item.channel__name + ' Status';
                                if(item.active){
                                    title = "Unsubscribe => " + item.channel__name +' Status';
                                }
                                return (
                                    <View key={j} style={styles.btnstyle}>
                                        <AppButton
                                            title={title}
                                            onPress={() => {
                                                obj_this.toggleNotification(item.channel__name);
                                            }}
                                        />
                                    </View>
                                )
                            })
                        }
                    </View>
                </View>
            );
        }

        // <AppButton onPress={() => { obj_this.run_bg_process() }} title="Start Bg Worker" />
        // <Text>{obj_this.state.bg_log}</Text>

        return (
            <View style={styles.container}>
                <Text selectable={true}>Token == {obj_this.state.expoToken || 'Obtaining token'}</Text>
                <AppButton onPress={() => { obj_this.copyToken() }} title={obj_this.state.copyBtnLabel} />
                {render_alerts(obj_this.state.subscriptions, 'My Alerts')}
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


// import React from 'react';
// import {
//     SafeAreaView,
//     StyleSheet,
//     ScrollView,
//     View,
//     Text,
//     FlatList,
//     StatusBar,
// } from 'react-native';

// import {
//     Header,
//     Colors
// } from 'react-native/Libraries/NewAppScreen';

// import BackgroundFetch from "react-native-background-fetch";

// class App extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             events: []
//         };
//     }

//     componentDidMount() {
//         // Initialize BackgroundFetch ONLY ONCE when component mounts.
//         this.initBackgroundFetch();
//     }

//     async initBackgroundFetch() {
//         // BackgroundFetch event handler.
//         const onEvent = async (taskId) => {
//             console.log('[BackgroundFetch] task: ', taskId);
//             // Do your background work...
//             await this.addEvent(taskId);
//             // IMPORTANT:  You must signal to the OS that your task is complete.
//             BackgroundFetch.finish(taskId);
//         }

//         // Timeout callback is executed when your Task has exceeded its allowed running-time.
//         // You must stop what you're doing immediately BackgroundFetch.finish(taskId)
//         const onTimeout = async (taskId) => {
//             console.warn('[BackgroundFetch] TIMEOUT task: ', taskId);
//             BackgroundFetch.finish(taskId);
//         }

//         // Initialize BackgroundFetch only once when component mounts.
//         let status = await BackgroundFetch.configure({ minimumFetchInterval: 15 }, onEvent, onTimeout);

//         console.log('[BackgroundFetch] configure status: ', status);
//     }

//     // Add a BackgroundFetch event to <FlatList>
//     addEvent(taskId) {
//         // Simulate a possibly long-running asynchronous task with a Promise.
//         return new Promise((resolve, reject) => {
//             this.setState(state => ({
//                 events: [...state.events, {
//                     taskId: taskId,
//                     timestamp: (new Date()).toString()
//                 }]
//             }));
//             resolve();
//         });
//     }

//     render() {
//         return (
//             <>
//                 <StatusBar barStyle="dark-content" />
//                 <SafeAreaView>
//                     <ScrollView
//                         contentInsetAdjustmentBehavior="automatic"
//                         style={styles.scrollView}>
//                         <Header />

//                         <View style={styles.body}>
//                             <View style={styles.sectionContainer}>
//                                 <Text style={styles.sectionTitle}>BackgroundFetch Demo</Text>
//                             </View>
//                         </View>
//                     </ScrollView>
//                     <View style={styles.sectionContainer}>
//                         <FlatList
//                             data={this.state.events}
//                             renderItem={({ item }) => (<Text>[{item.taskId}]: {item.timestamp}</Text>)}
//                             keyExtractor={item => item.timestamp}
//                         />
//                     </View>
//                 </SafeAreaView>
//             </>
//         );
//     }
// }

// const styles = StyleSheet.create({
//     scrollView: {
//         backgroundColor: Colors.lighter,
//     },
//     body: {
//         backgroundColor: Colors.white,
//     },
//     sectionContainer: {
//         marginTop: 32,
//         paddingHorizontal: 24,
//     },
//     sectionTitle: {
//         fontSize: 24,
//         fontWeight: '600',
//         color: Colors.black,
//     },
//     sectionDescription: {
//         marginTop: 8,
//         fontSize: 18,
//         fontWeight: '400',
//         color: Colors.dark,
//     },
// });

// export default App;


