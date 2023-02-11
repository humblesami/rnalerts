import React from "react";
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from "./app/navigation/AppNavigator";


LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs();

export default function App() {
    return (
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    );
};

