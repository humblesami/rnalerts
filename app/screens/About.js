import React from 'react';
import { View, Text, } from 'react-native';
import AbstractScreen from '../AbstractScreen';

export default class AboutScreen extends AbstractScreen {
    constructor() {
        super();
        let home_state = {
            tokenSent: 0,
        };
        for(let prop in home_state){
            this.state[prop] = home_state[prop];
        }
    }

    async componentDidMount() {
        let obj_this = this;
    }

    render() {
        let obj_this = this;
        obj_this.last_rendered = new Date();

        return (
            <View>
                <Text>This is about</Text>
            </View>
        );
    }
}
