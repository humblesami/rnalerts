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
        console.log('Home Mount');
        let obj_this = this;
        obj_this.showLoader('/device/register');
        this.registerForPushNotificationsAsync().then(pushToken=>{
            obj_this.hideLoader('/device/register');
            if (!pushToken) {
                obj_this.setState({ expoToken: 'Got no token' });
            }
            else {
                obj_this.setState({ expoToken: pushToken });
                obj_this.submit_token(pushToken);
            }
        }).catch(er8=>{
            obj_this.hideLoader('/device/register');
            obj_this.setState({ expoToken: '' + er8 });
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
        obj_this.setState({ copyBtnLabel: 'Copied' });
    };

    async get_server_list() {
        let obj_this = this;
        let endpoint = '/servers/list';
        let resp = await obj_this.apiClient.get_data(endpoint);
        if (resp.status == 'ok') {
            this.setState({ servers_list: resp.list });
        }
    }

    playSound() {
        SoundPlayer.playSoundFile('beep', 'mp3');
    }

    async sendNotification() {

    }

    async toggleNotification(notification_source) {
        let obj_this = this;
        let item = obj_this.state.subscriptions.find((x) => x.channel__name == notification_source);
        item.active = !item.active;
        obj_this.setState({});
        let endpoint = '/expo/toggle';
        let data = {channel: notification_source, push_token: obj_this.state.expoToken};
        let resp = await obj_this.apiClient.post_data(endpoint, data);
        if (resp.status == 'ok') {
            let temp1 = 'subscribed';
            if(!item.active){ temp1 = 'unsubscribed'; }
            obj_this.popup('done_message', 'Successfully '+temp1);
        }
    }

    async submit_token(obtained_token) {
        console.log('\nSubmitting Token => ' + obtained_token);
        if (!obtained_token) {
            alert('No token provided');
            return;
        }
        let obj_this = this;
        let endpoint = '/servers/submit';
        let resp = await obj_this.apiClient.post_data(endpoint, { obtained_token: obtained_token });
        for(let item of resp.servers_list){
            console.log(11111, item);
        }

        if (resp.status == 'ok') {
            if (!resp.channels.length) {
                obj_this.popup('warning_message', 'No active channels found');
            }
            obj_this.setState({ subscriptions: resp.channels, servers_list: resp.servers_list});
            rnStorage.save('push_token', obtained_token).then(() => { });
            rnStorage.save('auth_token', resp.auth_token).then(() => { });
        }
        else{ obj_this.popup('warning_message', 'No active channels found'); }
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
        obj_this.state.loading[endpoint] = 1;
        obj_this.setState({});
        let res_list = obj_this.state.servers_list;
        let json = await obj_this.apiClient.get_data(endpoint);
        if(!(json && json.status == 'ok')){
            await obj_this.check_servers_client();
            delete obj_this.state.loading[endpoint];
            obj_this.setState({});
            return;
        }
        else {
            json.data.responses.map(item=>{ res_list.find(x => x.check_path == item.server.check_path).status = item.status});
            this.setState({ servers_list: res_list });
        }
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

    refreshIt(){
        console.log('Home');
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
                            let title = "Subscribe => " + item.channel__name + ' Status';
                            if (item.active) {
                                title = "Unsubscribe => " + item.channel__name + ' Status';
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
                <AppButton onPress={() => { obj_this.check_servers() }} title="Check Servers Now" />
                <Text selectable={true}>Token == {obj_this.state.expoToken || 'Obtaining token'}</Text>
                <AppButton onPress={() => { obj_this.copyToken() }} title={obj_this.state.copyBtnLabel} />
                {render_notitifcation_sources(obj_this.state.subscriptions, 'Servers')}
            </View>
        );
        return obj_this.render_in_parent(child_view);
    }
}
