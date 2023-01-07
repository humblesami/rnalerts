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

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true
    }),
});

const AppNavigator = () => {

    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        // Get a token

        try{
            registerForPushNotificationsAsync().then(pushToken => {
                expoPushTokensApi.register(pushToken);
                alert('Got token '+pushToken);
            }).catch(er=>{
                alert('Could not registerPushNotificationsAsync');
            });
        }
        catch(err){
            alert('Could not registerPushNotificationsAsync-1');
        }


        // This listener is fired whenever a notification is received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('--- notification received ---');
            console.log(notification);
            console.log('------');
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

            let res = await Notifications.getExpoPushTokenAsync()
            let token = res.data;
            return token;
        }
        catch(er){
            console.log(er);
            alert('Error in registerPushNotificationsAsync-0');
            return '';
        }
    }

    return (
        <Tab.Navigator>
            <Tab.Screen
                name="Feed"
                component={FeedNavigator}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="ListingEdit"
                component={ListingEditScreen}
                options={({ navigation }) => ({
                    tabBarButton: () =>
                        <NewListingButton onPress={() => navigation.navigate('ListingEdit')} />,
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="plus-circle" color={color} size={size} />
                    ),
                })}
            />
            <Tab.Screen
                name="Account"
                component={AccountNavigator}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default AppNavigator;
