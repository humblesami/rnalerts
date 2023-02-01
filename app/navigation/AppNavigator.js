import React from 'react';
import * as Notifications from 'expo-notifications';
import SoundPlayer from 'react-native-sound-player';
import AppButton from '../components/Button';
import apiClient from '../api/client';
import { View, Text, StyleSheet, Clipboard, LogBox, ScrollView, ActivityIndicator } from 'react-native';


LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs();


Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
    }),
});


export default class AppNavigator extends React.Component {
    errors = [];
    last_rendered = '';
    responseListener = {};
    notificationListener = {};
    baseUrl = 'https://dap.92newshd.tv';
    constructor() {
        super();
        this.state = {
            expoToken: '',
            tokenSent: 0,
            loading: {},
            servers_list: [],
            subscriptions: [],
            done_message: '',
            error_message : '',
            warning_message: '',
            bg_log: 'No bg worker yet',
            copyBtnLabel: 'Copy token',
        };
    }

    run_bg_process() {
    }
    copyToken() {
        let obj_this = this;
        Clipboard.setString(obj_this.state.expoToken);
        obj_this.setState({ copyBtnLabel: 'Copied' });
    };

    st_upd = 0;

    setState(values) {
        let obj_this = this;
        if (!this.last_rendered) {
            for (let key in values) {
                this.state[key] = values[key];
            }
            return;
        }
        obj_this.st_upd += 1;
        super.setState(values);
    }

    on_warning(txt) {
        this.setState({ warning_message: txt });
    }

    set_failure_message(message, api_base_url=''){
        this.errors.push(message);
        console.log('\nError', message);
        if(message.startsWith('No result')){
            let server_error = 'Unable to connect server '+api_base_url;
            if(this.errors.indexOf(server_error) == -1){
                this.errors.splice(0, 0, server_error);
            }
        }
        this.state.error_message =  this.errors.join('\n');
    }

    componentDidMount() {
        let obj_this = this;
        apiClient.current_component = this;

        this.get_server_list();
        obj_this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            let category_id = notification.request.content.categoryIdentifier;
            //obj_this.playSound();
        });
        obj_this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            let category_id = response.notification.request.content.categoryIdentifier;
        });
        try {
            this.registerForPushNotificationsAsync().then(pushToken => {
                if (!pushToken) {
                    let message = 'Invalid Token';
                    obj_this.on_error(0, message);
                }
                else {
                    obj_this.setState({ expoToken: pushToken });
                    obj_this.submit_token(pushToken);
                }
            }).catch(er6 => {
                let message = ('Could not registerPushNotificationsAsync-1');
                obj_this.on_error(er6, message);
            });
        }
        catch (er7) {
            let message = ('Could not registerPushNotificationsAsync-2');
            obj_this.on_error(er7, message);
        }

        // Unsubscribe from events
        return () => {
            Notifications.removeNotificationSubscription(obj_this.notificationListener);
            Notifications.removeNotificationSubscription(obj_this.responseListener);
        };
    }

    async get_server_list() {
        let endpoint = '/servers/list';
        let resp = await apiClient.get_data(endpoint);
        if (resp.status == 'ok') {
            this.setState({ servers_list: resp.list });
        }
    }

    playSound() {
        SoundPlayer.playSoundFile('beep', 'mp3');
    }

    async sendNotification() {

    }

    popup(state_attribute, message){
        let obj_this = this;
        obj_this.state[state_attribute] = message;
        obj_this.setState({});
        setTimeout(()=>{
            obj_this.state[state_attribute] = '';
            obj_this.setState({});
        }, 1500);
    }

    async toggleNotification(alert_id) {
        let obj_this = this;
        let item = obj_this.state.subscriptions.find((x) => x.channel__name == alert_id);
        item.active = !item.active;
        obj_this.setState({});
        let endpoint = '/expo/toggle';
        let data = {channel: alert_id, push_token: obj_this.state.expoToken};
        let resp = await apiClient.post_data(endpoint, data);
        if (resp.status == 'ok') {
            let temp1 = 'subscribed';
            if(!item.active){
                temp1 = 'unsubscribed';
            }
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
        let endpoint = '/expo/submit';
        let json_data = await apiClient.post_data(endpoint, { obtained_token: obtained_token });
        if (json_data.status == 'ok') {
            if (!json_data.channels.length) {
                obj_this.popup('warning_message', 'No active channels found');
            }
            else {
                obj_this.setState({ subscriptions: json_data.channels });
            }
            apiClient.rnStorage.save('push_token', obtained_token).then(() => { });
            apiClient.rnStorage.save('auth_token', json_data.auth_token).then(() => { });
        }
        else{
            obj_this.popup('warning_message', 'No active channels found');
        }
    }

    async registerForPushNotificationsAsync() {
        let token;
        try {

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
        }
        catch (ex) {
            console.log('\nError in device ', er)
        }
        if (!token) {
            console.log('\nNo expo token for device');
        }
        return token;
    }

    async check_servers() {
        let obj_this = this;
        let res_list = obj_this.state.servers_list;
        let endpoint = '/servers/check-only';
        let json = await apiClient.get_data(endpoint);
        console.log('\njson', json);
        if(!json){
            obj_this.check_servers_client();
            return;
        }
        if (json.status != 'ok') {
            obj_this.check_servers_client();
            return;
        }
        else {
            let uc = 0;
            for (let item of json.data.responses) {
                let matched = res_list.find(x => x.check_path == item.server.check_path && item.status != x.status);
                if (matched) {
                    matched.status = item.status;
                    uc += 1;
                }
            }
            if(uc)
            {
                this.setState({ servers_list: res_list });
            }
        }
    }

    check_servers_client() {
        console.log('\nBefore check', Date());
        let obj_this = this;
        let res_list = obj_this.state.servers_list;
        console.log('\nList', res_list);
        let i = 0;
        for (let item of res_list) {
            fetch(item.check_path).then((resp) => {
                res_list.find(x => x.check_path == resp.url).status = resp.status;
                 i += 1;
                if(i == res_list.length){
                    obj_this.setState({ servers_list: res_list });
                }
            });
        }
    }

    render() {
        let obj_this = this;
        obj_this.last_rendered = new Date();
        function show_errors() {
            if (obj_this.state.error_message) {
                return (
                    <View>
                        <Text style={styles.er_style}>{obj_this.state.error_message}</Text>
                    </View>
                );
            }
        }


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

        function render_alerts(items_list, name) {
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
                                        <AppButton
                                            title={title}
                                            onPress={() => {
                                                obj_this.toggleNotification(item.channel__name);
                                            }}
                                        />
                                    </View>
                                )
                            })
                        }
                    </View>
                </View>
            );
        }



        function show_activity_indicator(){
            if(Object.keys(obj_this.state.loading).length){
                return (<View style={styles.loader}><ActivityIndicator color="orange" size="large" /></View>);
            }
        }

        function show_done(){
            if(obj_this.state.done_message){
                return (
                    <View style={styles.loader}>
                        <View style={[styles.popup_container, styles.green_container]}>
                            <Text style={styles.popup_message}>{obj_this.state.done_message}</Text>
                        </View>
                    </View>
                );
            }
        }

        function show_warning() {
            if (obj_this.state.warning_message) {
                return (
                    <View style={styles.loader}>
                        <View style={[styles.popup_container, styles.yellow_container]}>
                            <Text style={styles.popup_message}>{obj_this.state.warning_message}</Text>
                        </View>
                    </View>
                );
            }
        }

        return (
            <View style={styles.container}>
                {show_activity_indicator()}
                {show_done()}
                {show_errors()}
                {show_warning()}
                {server_status_list(obj_this.state.servers_list)}
                <AppButton onPress={() => { obj_this.check_servers() }} title="Check Servers Now" />
                <Text selectable={true}>Token == {obj_this.state.expoToken || 'Obtaining token'}</Text>
                <AppButton onPress={() => { obj_this.copyToken() }} title={obj_this.state.copyBtnLabel} />
                {render_alerts(obj_this.state.subscriptions, 'My Alerts')}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        marginTop: 30,
        padding: 10
    },
    popup_container:{
        padding: 40,
        width: '80%',
        zIndex: 4,
        elevation: 4
    },
    green_container:{
        backgroundColor: 'green',
    },
    yellow_container:{
        backgroundColor: 'orange',
    },
    popup_message:{
        fontSize: 18,
        color: 'white'
    },
    loader: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 3,
        elevation: 3,
        alignItems: 'center',
        justifyContent: 'center'
    },
    list_item: {
        marginVertical: 5,
        borderWidth: 2,
        padding: 5,
        flex: 1,
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    red_item: {
        borderWidth: 4,
        borderColor: 'red',
    },
    green_item: {
        borderColor: 'green',
    },
    er_style: {
        marginVertical: 5,
        color: 'red',
        fontWeight: 'bold',
        fontSize: 15,
    },
    heading2: {
        fontWeight: 'bold',
        fontSize: 16,
        paddingTop: 10,
        paddingBottom: 5,
    }
});
