import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import expoPushTokensApi from '../api/expoPushTokens';
import NewListingButton from './NewListingButton';

const Tab = createBottomTabNavigator();

import { View, Text, StyleSheet } from 'react-native';
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true
    }),
});

export default class AppNavigator extends React.Component {
    notificationListener = {}
    responseListener = {};
    myToken = '';
    constructor(){
        super();
        this.state = {
            error_message: ''
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
            //console.log('--- notification received ---');
            //console.log(notification);
            //console.log('------');
        });

        // This listener is fired whenever a user taps on or interacts with a notification
        // (works when app is foregrounded, backgrounded, or killed)
        obj_this.responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('--- notification tapped ---');
            console.log(response);
            console.log('------');
        });

        // Unsubscribe from events
        return () => {
            Notifications.removeNotificationSubscription(obj_this.notificationListener.current);
            Notifications.removeNotificationSubscription(obj_this.responseListener.current);
        };

    }

    async sendNotification(){
        let baseUrl = 'http://0.0.0.0:9000/api';
        let endpoint = '/messages/send-get';
        try{
            let resp = await fetch(baseUrl + endpoint);
            let json = await resp.json();
            console.log('Response', json);
        }
        catch(er){
            console.log('Error in send get =>' , er);
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
            console.log('Going to get Token');
            let res = await Notifications.getExpoPushTokenAsync();
            console.log('Got Token');
            let token = res.data;
            return token;
        }
        catch(er){
            console.log(er);
            alert('Device not connected or could not get token');
            return 'Invalid Token';
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
        return (
            <View style={styles.container}>
                <NewListingButton onPress={obj_this.sendNotification} />
            </View>
            // <Tab.Navigator>
            //     <Tab.Screen
            //         name="Feed"
            //         component={FeedNavigator}
            //         options={{
            //             tabBarIcon: ({ color, size }) => (
            //                 <MaterialCommunityIcons name="home" color={color} size={size} />
            //             ),
            //         }}
            //     />
            // </Tab.Navigator>
        );
    }
}

const styles =  StyleSheet.create({
    container: {
        marginTop: 30,
        padding: 10
    }
});

