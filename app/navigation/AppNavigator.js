import * as React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AboutScreen from '../screens/About';
import ConnectScreen from '../screens/Connect';
import ServerInfoScreen from '../screens/ServerInfo';


const Tab = createBottomTabNavigator();


export default function AppWithBottomTabs() {
    function get_option(label, icon, tbb=0){
        let res_options = {
            tabBarLabel: label,
            tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name={icon} color={color} size={size} />)
        }
        if(tbb){
            res_options.tabBarBadge = tbb;
        }
        return res_options;
    }

    let option1 = get_option('Connect', 'home');
    let option2 = get_option('Servers', 'home');
    let option3 = get_option('About', 'bell');
    return (
        <Tab.Navigator initialRouteName="Feed" screenOptions={{ tabBarActiveTintColor: '#e91e63', }}>
            <Tab.Screen name="Servers" component={ServerInfoScreen} options={option2} />
            <Tab.Screen name="Baloch" component={ConnectScreen} options={option1} />
            <Tab.Screen name="About" component={AboutScreen} options={{option3}} />
        </Tab.Navigator>
    );
}

