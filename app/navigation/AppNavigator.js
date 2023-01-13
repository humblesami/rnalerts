import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import ListingEditScreen from "../screens/ListingEditScreen";
import FeedNavigator from './FeedNavigator';
import AccountNavigator from './AccountNavigator';
import expoPushTokensApi from '../api/expoPushTokens';
import NewListingButton from './NewListingButton';

const Tab = createBottomTabNavigator();

import { View, Text, StyleSheet } from 'react-native';
import client from '../api/client';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true
    }),
});

const AppNavigator = () => {

    const notificationListener = useRef();
    const responseListener = useRef();
    const myToken = '';

    useEffect(() => {

        try{
            registerForPushNotificationsAsync().then(pushToken => {
                console.log(pushToken);
                if(!pushToken){
                    console.log('Invalid token');
                }
                else{
                    expoPushTokensApi.register(pushToken);
                    myToken = pushToken;
                }
            }).catch(er=>{
                //alert('Could not registerPushNotificationsAsync');
            });
        }
        catch(err){
            alert('Could not registerPushNotificationsAsync-1');
        }


        // This listener is fired whenever a notification is received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            //console.log('--- notification received ---');
            //console.log(notification);
            //console.log('------');
        });

        // This listener is fired whenever a user taps on or interacts with a notification
        // (works when app is foregrounded, backgrounded, or killed)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('--- notification tapped ---');
            console.log(response);
            console.log('------');
        });

        // Unsubscribe from events
        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };

    }, []);

    async function sendNotification(){
        let baseUrl = 'http://0.0.0.0:9000/api';
        let endpoint = '/messages/send-get';
        try{
            let resp = await fetch(baseUrl + endpoint);
            let json = await resp.json();
            console.log('Response', json);
        }
        catch(er){
            console.log('Error =>' , er);
        }
    }

    async function registerForPushNotificationsAsync() {
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
    let obj_this = this;

    return (
        <View style={styles.container}>
            <NewListingButton onPress={sendNotification} />
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
};

const styles =  StyleSheet.create({
    container: {
        marginTop: 30
    }
});

export default AppNavigator;
