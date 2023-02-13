import * as React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AboutScreen from '../screens/About';
import HomeScreen from '../screens/Home';


const Tab = createBottomTabNavigator();


export default function AppWithBottomTabs() {
    function get_option(label, icon){
        return {
            tabBarLabel: label,
            tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name={icon} color={color} size={size} />)
        }
    }
    let option1 = get_option('Home', 'home');
    let option2 = get_option('About', 'bell');
    return (
        <Tab.Navigator initialRouteName="Feed" screenOptions={{ tabBarActiveTintColor: '#e91e63', }}>
            <Tab.Screen name="Home" component={HomeScreen} options={option1} />
            <Tab.Screen name="About" component={AboutScreen} options={{option2}} />
        </Tab.Navigator>
    );
}

