import React from 'react';
import "./ignoreWarnings";
import styles from './styles/main';
import AppButton from './components/AppButton';
import restServerApi from './services/rnRestApi';
import AwesomeAlert from 'react-native-awesome-alerts';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';


export default class AbstractScreen extends React.Component {
    st_upd = 0;
    first_render = 1;
    constructor() {
        super();
        this.error_list = [];
        this.last_rendered = '';
        let api_base_url = 'https://dap.92newshd.tv';
        //api_base_url = 'http://127.0.0.1:8000';
        this.apiClient = new restServerApi({token_type: 'auth', api_base_url: api_base_url, time_limit: 10});
        this.state = {
            loading: {},
            error_message: '',
            alert_options : {shown: false, title: 'Main', message: 'Nothing'}
        };
        let obj_this = this;
        if(obj_this.first_render){
            obj_this.first_render = 0;
            obj_this.apiClient.just_before_api_request = function(endpoint, max_request_wait){
                obj_this.showLoader(endpoint, max_request_wait);
            }
            obj_this.apiClient.on_api_complete = function(endpoint){
                obj_this.hideLoader(endpoint, 'complete');
            }
        }
    }

    showAlert = (title, message) => {
        this.setParentState({alert_options: {shown: true, title: title, message: message}}, 'show alert');
    };

    hideAlert = () => {
        this.setParentState({alert_options: {shown: false}}, 'hide alert');
    };

    on_api_failed(activity_id, message='Uknown Error') {
        let screen_object = this;
        //console.log('on api failed', activity_id, message);
        let error_activity = { message: message, activity_id: activity_id };
        if (!screen_object.error_list.find(x => x.message == message || x.activity_id == activity_id)) {
            screen_object.error_list.push(error_activity);
            screen_object.state.error_message = screen_object.error_list.map(item => item.message).join('\n');
        }
    }

    on_api_success(activity_id) {
        let screen_object = this;
        let i = 0;
        for (let item of screen_object.error_list) {
            if (item.activity_id == activity_id) {
                screen_object.error_list.splice(i, 1);
                screen_object.state.error_message = screen_object.error_list.map(item => item.message).join('\n');
                break;
            }
            i += 1;
        }
    }

    hideLoader(activity_id) {
        delete this.state.loading[activity_id];
        if (!Object.keys(this.state.loading).length) {
            this.setParentState({}, 'complete ' + activity_id);
        }
    }

    showLoader(activity_id, time_limit = 10, keep_state = 0) {
        let obj_this = this;
        this.state.loading[activity_id] = 1;
        if (!keep_state && Object.keys(this.state.loading).length == 1) {
            this.setParentState({}, 'init ' + activity_id);
        }
        setTimeout(() => {
            if (obj_this.state.loading[activity_id]) {
                let message = 'Removed loader\n' + activity_id + '\n after waiting ' + time_limit + ' seconds';
                message += ' Service timed out ' + (time_limit - obj_this.apiClient.fetch_timeout) + ' seconds ago';
                alert(message);
                obj_this.hideLoader(activity_id);
            }
        }, (time_limit * 1000) + 1000);
    }

    setParentState(values, source = 'unknown') {
        let obj_this = this;
        if (this.last_rendered) {
            obj_this.st_upd += 1;
            super.setState(values);
            //console.log('\n Pstate updates = ' + obj_this.st_upd + ' => ' + Date().substr(19, 5) + ' => ' + source);
            //console.log('\n Pstate updates = '+obj_this.st_upd+' => '+source, Date(), values);
        }
        else {
            for (let key in values) {
                this.state[key] = values[key];
            }
        }
    }

    setState(values, source = 'unknown') {
        let obj_this = this;
        if (this.last_rendered) {
            obj_this.st_upd += 1;
            super.setState(values);
            console.log('\n Cstate updates = ' + obj_this.st_upd + ', source ' + source);
        }
        else {
            for (let key in values) {
                this.state[key] = values[key];
            }
        }
    }

    render_in_parent(child_view) {
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

        function show_activity_indicator() {
            if (Object.keys(obj_this.state.loading).length) {
                return (
                    <View style={{flex:1, alignItems: 'center', position: 'absolute', top: 0, left: 0}}>
                        <View style={[{height: 400, width:100, position: 'absolute', top: 0, left: 0}]}>
                            <ActivityIndicator color="orange" size="large" />
                        </View>
                    </View>

                );
            }
        }

        function alert_dom(){
            return (
                <AwesomeAlert
                    show={obj_this.state.alert_options.shown}
                    showProgress={false}
                    title={obj_this.state.alert_options.title}
                    message=""
                    closeOnTouchOutside={true}
                    onCancelPressed={() => {
                        obj_this.hideAlert();
                    }}
                    onConfirmPressed={() => {
                        obj_this.hideAlert();
                    }}
                    customView={(
                        <View style={{paddingLeft: 50,paddingRight: 50}}>
                            <Text>{obj_this.state.alert_options.message}</Text>
                            <AppButton onPress={() => { obj_this.hideAlert() }} title="OK" />
                        </View>
                    )}
                />
            );
        }

        function get_base_items() {
            let res = (
                <View>
                    {show_activity_indicator()}
                    {alert_dom()}
                    {show_errors()}
                </View>
            );
            return res;
        }

        return (
            <ScrollView style={{padding: 10}}>
                {get_base_items()}
                {child_view}
                <AppButton onPress={() => { obj_this.componentDidMount() }} title="Refresh Now" />
            </ScrollView>
        );
    }
}

