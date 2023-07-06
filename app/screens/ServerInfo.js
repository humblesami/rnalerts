import React from 'react';
import { View, Text, ScrollView } from 'react-native';

import styles from '../styles/main';
import AppButton from '../components/Button';
import ConnectScreen from './Connect';


export default class ServerInfoScreen extends ConnectScreen {
    constructor() {
        super('https://dap.92newshd.tv');
        this.state.servers_list = [
            {name: '92news', check_path: 'https://92newshd.tv/', status: 200},
            {name: 'Test92news', check_path: 'https://test.92newshd.tv/', status: 512},
            {name: 'Roznama', check_path: 'https://www.roznama.com/', status: 200},
        ];
    }

    onTokenSubmitted(res_data, obtained_token){
        console.log('Child submitted');
        super.onTokenSubmitted(res_data, obtained_token);
        let updated_list = res_data.servers_list || [];
        this.setParentState({ subscriptions: res_data.channels, servers_list: updated_list}, 'render subscriptions');
    }

    async check_servers() {
        let obj_this = this;
        let endpoint = '/servers/check-only';
        let res_list = obj_this.state.servers_list;
        let api_client = this.create_api_request();
        api_client.on_api_success = function(res_data){
            res_data.responses.map(item=>{ res_list.find(x => x.check_path == item.server.check_path).status = item.status});
            this.state.servers_list = res_list;
            obj_this.showAlert('Success', 'Servers status checked and updated');
        }
        api_client.get_data(endpoint);
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

        function set_server_status_list(list_of_status_items) {
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
                            list_of_status_items.map(function (item, j) {
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

        let btn_bgcolor = undefined;
        function render_notitifcation_sources(channels_list, name) {
            return (
                <View>
                    <View>
                        <Text>{name}</Text>
                    </View>
                    <View>
                    {
                        channels_list.map(function (item, j) {
                            let title = "Subscribe => " + item.channel__name;
                            if (item.active) {
                                title = "Unsubscribe => " + item.channel__name;
                                btn_bgcolor = undefined;
                            }
                            else{
                                btn_bgcolor = 'orange';
                            }
                            return (
                                <View key={j}>
                                    <AppButton color={btn_bgcolor} title={title} onPress={() => {
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
                {set_server_status_list(obj_this.state.servers_list)}
                <AppButton onPress={() => { obj_this.check_servers() }} title="Manually Check Servers" />
                <Text selectable={true}>Obtained Token: {obj_this.state.expoToken || 'Obtaining token'}</Text>
                <AppButton onPress={() => { obj_this.copyToken() }} title={obj_this.state.copyBtnLabel} />
                {render_notitifcation_sources(obj_this.state.subscriptions, 'Servers')}
            </View>
        );
        return obj_this.render_in_parent(child_view);
    }
}
