import React from 'react';
//import LottieView from 'lottie-react-native';
import { View, Text } from "react-native";


function ActivityIndicator({ visible = false }) {
    if (!visible) return null;

    // return <LottieView
    //     autoplay
    //     loop
    //     source={require('../assets/animations/loader.json')} />

    return (<View>
        <Text>ActivityIndicator</Text>
    </View>)
}


export default ActivityIndicator;