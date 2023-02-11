import * as React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AboutScreen from '../screens/About';
import HomeScreen from '../screens/Home';


const Tab = createBottomTabNavigator();


export default function AppWithBottomTabs() {
    return (
        <Tab.Navigator initialRouteName="Feed" screenOptions={{ tabBarActiveTintColor: '#e91e63', }}>
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Tab1', tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="home" color={color} size={size} />), }} />
            <Tab.Screen name="About" component={AboutScreen} options={{ tabBarLabel: 'Tab2', tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="bell" color={color} size={size} />), }} />
        </Tab.Navigator>
    );
}
