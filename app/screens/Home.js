import React from 'react';
import * as Notifications from 'expo-notifications';
import SoundPlayer from 'react-native-sound-player';
import { View, Text, Clipboard, ScrollView } from 'react-native';

import styles from '../styles/main';
import rnStorage from '../services/rnStorage';
import AppButton from '../components/Button';
import AbstractScreen from '../AbstractScreen';
import ImageInput from '../components/ImageInput';


Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
    }),
});

export default class HomeScreen extends AbstractScreen {
    constructor() {
        super();
        this.resListener = {};
        this.pushListener = {};
        let home_state = {
            tokenSent: 0,
            expoToken: '',
            loading: {},
            servers_list: [
                {name: '92news', check_path: 'https://92newshd.tv/', status: 200},
                {name: 'Test92news', check_path: 'https://test.92newshd.tv/', status: 512},
                {name: 'Roznama', check_path: 'https://www.roznama.com/', status: 200},
            ],
            subscriptions: [],
            copyBtnLabel: 'Copy token',
        };
        for(let prop in home_state){
            this.state[prop] = home_state[prop];
        }
    }

    async componentDidMount() {
        let obj_this = this;
        obj_this.st_upd = 0;
        let activity_id = '/device/register';
        obj_this.showLoader(activity_id, 5);
        this.registerForPushNotificationsAsync().then(pushToken=>{
            if (!pushToken) {
                pushToken = 'Got no token';
            }
            obj_this.state.expoToken = pushToken;
            obj_this.hideLoader(activity_id);
            if(pushToken != 'Got no token') {
                obj_this.submit_token(pushToken);
            }
        }).catch(er8=>{
            obj_this.state.expoToken = '' + er8;
            obj_this.hideLoader(activity_id);
        });

        obj_this.pushListener = Notifications.addNotificationReceivedListener(notification => notification.request.content.categoryIdentifier);
        obj_this.resListener = Notifications.addNotificationResponseReceivedListener(response => response.notification.request.content);
        return () => {
            Notifications.removeNotificationSubscription(obj_this.pushListener);
            Notifications.removeNotificationSubscription(obj_this.resListener);
        };
    }

    run_bg_process() {
    }

    copyToken() {
        let obj_this = this;
        Clipboard.setString(obj_this.state.expoToken);
        obj_this.setParentState({ copyBtnLabel: 'Copied' }, 'token copied');
    };

    playSound() {
        SoundPlayer.playSoundFile('beep', 'mp3');
    }

    async sendNotification() {

    }

    async toggleNotification(notification_source) {
        let obj_this = this;
        let item = obj_this.state.subscriptions.find((x) => x.channel__name == notification_source);
        item.active = !item.active;
        let endpoint = '/expo/toggle';
        let data = {channel: notification_source, push_token: obj_this.state.expoToken};
        obj_this.apiClient.on_api_success = function(res_data) {
            let temp1 = 'subscribed';
            if(!res_data.active){ temp1 = 'unsubscribed'; }
            obj_this.showAlert('Success', temp1);
        }
        obj_this.apiClient.post_data(endpoint, data);
    }

    async submit_token(obtained_token) {
        if (!obtained_token) {
            alert('No token provided');
            return;
        }
        let obj_this = this;
        let endpoint = '/servers/submit';
        obj_this.apiClient.on_api_success = function(res_data) {
            let warn_message = 'No active channels found';
            if (!res_data.channels.length) {
                obj_this.showAlert('Warning', warn_message);
            }
            obj_this.setParentState({ subscriptions: res_data.channels, servers_list: res_data.servers_list}, 'render subscriptions');
            rnStorage.save('push_token', obtained_token).then(() => { });
            rnStorage.save('auth_token', res_data.auth_token).then(() => { });
        }
        obj_this.apiClient.on_api_error = function(error_message) {
            obj_this.showAlert('Warning', error_message);
        }
        console.log('\nSubmitting Token => ' + obtained_token);
        obj_this.apiClient.post_data(endpoint, { posted_token: obtained_token });
    }

    async registerForPushNotificationsAsync() {
        let token;
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
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('\n\tPlatForm => ' + Platform.OS);
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('down_alerts', {
                name: 'main',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }
        return token;
    }


    async check_servers() {
        let obj_this = this;
        let endpoint = '/servers/check-only';
        let res_list = obj_this.state.servers_list;
        obj_this.apiClient.on_api_success = function(res_data){
            res_data.responses.map(item=>{ res_list.find(x => x.check_path == item.server.check_path).status = item.status});
            this.state.servers_list = res_list;
            obj_this.showAlert('Success', 'Servers status checked and updated');
        }
        obj_this.apiClient.get_data(endpoint);
    }

    async check_servers_client() {
        let res_list = this.state.servers_list;
        const requests = res_list.map((item) => fetch(item.check_path));
        try{
            const responses = await Promise.all(requests);
            responses.map(resp=>res_list.find(x => x.check_path == resp.url).status = resp.status);
            console.log('Checked from client');
        }
        catch(ex3){
            let message = 'Error in checking server from client';
            this.set_failure_message(message);
            console.log(message, ex3);
        }
    }

    render() {
        let obj_this = this;
        obj_this.last_rendered = new Date();

        function server_status_list(items_list) {
            function get_item_style(status, item_url) {
                if (!status) {
                    console.log('\nNo status for ' + item_url);
                    status = 'Unreachable';
                }
                if (status == 200) {
                    status = 'OK';
                }
                status = '' + status;
                if (status == 'OK') {
                    return [styles.list_item, styles.green_item];
                }
                else {
                    return [styles.list_item, styles.red_item];
                }
            }

            return (
                <View>
                    <Text style={styles.heading2}>
                        Servers Status List
                    </Text>
                    <ScrollView>
                        {
                            items_list.map(function (item, j) {
                                return (
                                    <View style={get_item_style(item.status)} key={j}>
                                        <Text>{item.name}</Text>
                                        <Text>{item.status}</Text>
                                    </View>
                                )
                            })
                        }
                    </ScrollView>
                </View>
            )
        }

        function render_notitifcation_sources(items_list, name) {
            return (
                <View>
                    <View>
                        <Text>{name}</Text>
                    </View>
                    <View>
                    {
                        items_list.map(function (item, j) {
                            let title = "Subscribe => " + item.channel__name;
                            if (item.active) {
                                title = "Unsubscribe => " + item.channel__name;
                            }
                            return (
                                <View key={j}>
                                    <AppButton title={title} onPress={() => {
                                        obj_this.toggleNotification(item.channel__name);
                                    }}/>
                                </View>
                            )
                        })
                    }
                    </View>
                </View>
            );
        }
        let child_view = (
            <View>
                {server_status_list(obj_this.state.servers_list)}
                <ImageInput />
                <AppButton onPress={() => { obj_this.check_servers() }} title="Manually Check Servers" />
                <Text selectable={true}>Token == {obj_this.state.expoToken || 'Obtaining token'}</Text>
                <AppButton onPress={() => { obj_this.copyToken() }} title={obj_this.state.copyBtnLabel} />
                {render_notitifcation_sources(obj_this.state.subscriptions, 'Servers')}
            </View>
        );
        return obj_this.render_in_parent(child_view);
    }
}
