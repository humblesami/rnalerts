import React from 'react';
import * as Notifications from 'expo-notifications';
import SoundPlayer from 'react-native-sound-player';
import { View, Text, Clipboard, ScrollView } from 'react-native';

import styles from '../styles/main';
import rnStorage from '../services/rnStorage';
import AppButton from '../components/Button';
import AbstractScreen from '../AbstractScreen';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default class ConnectScreen extends AbstractScreen {
    constructor(api_base_url) {
        super(api_base_url);
        this.resListener = {};
        this.pushListener = {};
        let home_state = {
            tokenSent: 0,
            server_url: api_base_url,
            expoToken: '',
            loading: {},
            subscriptions: [],
            copyBtnLabel: 'Copy token',
        };
        for (let prop in home_state) {
            this.state[prop] = home_state[prop];
        }
    }

    async componentDidMount() {
        let obj_this = this;
        this.st_upd = 0;
        let activity_id = '/device/register';
        this.showLoader(activity_id, 5);
        let not_permitted = '403 Notifications not permitted';
        let pushToken = await this.registerForPushNotificationsAsync(not_permitted);
        obj_this.state.expoToken = pushToken;
        if (!pushToken || pushToken == not_permitted) {
            obj_this.hideLoader(activity_id);
            alert('Notification access is not granted!');
            return;
        }
        obj_this.hideLoader(activity_id);
        obj_this.submit_token(pushToken);

        this.pushListener = Notifications.addNotificationReceivedListener(notification => {
            const { data, body } = notification.request.content;
            let message = body.trim();
            let channel = notification.request.trigger.channelId;
            console.log(channel + ' received => '+message);
            console.log("\n", notification);
            return notification.request.content.categoryIdentifier;
        });
        this.resListener = Notifications.addNotificationResponseReceivedListener(response => response.notification.request.content);

        //this.test_notifications();

        return () => {
            Notifications.removeNotificationSubscription(obj_this.pushListener);
            Notifications.removeNotificationSubscription(obj_this.resListener);
        };
    }

    async registerForPushNotificationsAsync(not_permitted) {
        let token;
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            return not_permitted;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        // console.log('Choosen PlatForm => ' + Platform.OS);
        // if (Platform.OS === 'android') {
        //     Notifications.setNotificationChannelAsync('down_alerts', {
        //         name: 'down_alerts',
        //         //sound: 's4.mp3',
        //         importance: Notifications.AndroidImportance.MAX,
        //     });
        // }
        return token;
    }

    test_notifications() {
        Notifications.scheduleNotificationAsync({
            content: {
                title: "You've got mail!",
                body: 'Open the notification to read them all',
            },
            trigger: {
                seconds: 1,
                channelId: 'down_alerts',
            },
        });
    }



    copyToken() {
        Clipboard.setString(this.state.expoToken);
        this.setParentState({ copyBtnLabel: 'Copied' }, 'token copied');
    }

    async toggleNotification(notification_source) {
        let item = this.state.subscriptions.find((x) => x.channel__name == notification_source);
        item.active = !item.active;
        let endpoint = '/expo/toggle';
        let data = { channel: notification_source, push_token: this.state.expoToken };
        let api_client = this.create_api_request();
        api_client.on_api_success = function (res_data) {
            let temp1 = 'subscribed';
            if (!res_data.active) { temp1 = 'unsubscribed'; }
            //obj_this.showAlert('Success', temp1);
        }
        api_client.post_data(endpoint, data);
    }

    async submit_token(obtained_token, endpoint = '') {
        if (!obtained_token) {
            alert('No token provided');
            return;
        }
        let obj_this = this;
        if (!endpoint) endpoint = '/expo/submit';
        let api_options = {
            time_limit: 15,
            header_tokens: { token_type: 'auth' }
        };
        let api_client = this.create_api_request();
        api_client.on_api_success = function (res_data) {
            obj_this.site_tokens[api_client.api_server_url].auth_token = res_data.auth_token;
            obj_this.onTokenSubmitted(res_data, obtained_token);
        };
        api_client.on_api_error = function (error_message) {
            obj_this.showAlert('Warning', error_message);
        }
        api_client.post_data(endpoint, { posted_token: obtained_token, app_id: obj_this.appId });
    }

    onTokenSubmitted(res_data, obtained_token) {
        console.log('Parent submitted');
        let warn_message = 'No active channels found';
        if (!res_data.channels.length) {
            this.showAlert('Warning', warn_message);
        }
        this.setParentState({ subscriptions: res_data.channels }, 'render subscriptions');
        rnStorage.save('push_token', obtained_token).then(() => { });
        rnStorage.save('auth_token', res_data.auth_token).then(() => { });
        console.log('Authorized with => ' + obtained_token);
    }

    render_items_list(list_items) {
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
                        list_items.map(function (item, j) {
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

    render() {
        let obj_this = this;
        this.last_rendered = new Date();

        let btn_bgcolor = undefined;
        function render_notitifcation_sources(list_items, name) {
            return (
                <View>
                    <View>
                        <Text>{name}</Text>
                    </View>
                    <View>
                        {
                            list_items.map(function (item, j) {
                                let title = "Subscribe => " + item.channel__name;
                                if (item.active) {
                                    title = "Unsubscribe => " + item.channel__name;
                                    btn_bgcolor = undefined;
                                }
                                else {
                                    btn_bgcolor = 'orange';
                                }
                                return (
                                    <View key={j}>
                                        <AppButton color={btn_bgcolor} title={title} onPress={() => {
                                            obj_this.toggleNotification(item.channel__name);
                                        }} />
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
                <Text>Server: {this.state.server_url }</Text>
                <Text selectable={true}>Obtained Token: {this.state.expoToken || 'Obtaining token'}</Text>
                <AppButton onPress={() => { this.copyToken() }} title={this.state.copyBtnLabel} />
                {render_notitifcation_sources(this.state.subscriptions, 'Subscriptions')}
            </View>
        );
        return this.render_in_parent(child_view);
    }
}
