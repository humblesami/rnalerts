import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from "./app/navigation/AppNavigator";

import "./ignoreWarnings";


export default function App() {
    return (
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    );
};
