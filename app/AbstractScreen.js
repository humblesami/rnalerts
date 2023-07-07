import React from 'react';
import "./ignoreWarnings";
import styles from './styles/main';
import AppButton from './components/AppButton';
import restServerApi from './services/rnRestApi';
import DeviceInfo from "react-native-device-info";
import AwesomeAlert from 'react-native-awesome-alerts';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';


export default class AbstractScreen extends React.Component {
    st_upd = 0;
    first_render = 1;
    constructor(api_base_url='') {
        super();
        this.error_list = [];
        this.last_rendered = '';
        this.api_base_url = api_base_url;
        this.state = {
            loading: {},
            api_base_url: api_base_url,
            error_message: '',
            alert_options : {shown: false, title: 'Main', message: 'Nothing'}
        };
        if(this.first_render){
            this.first_render = 0;
        }
        this.appId = DeviceInfo.getBundleId(),
        console.log(this.appId);
    }

    site_tokens = {};

    create_api_request(options={}){
        let obj_this = this;
        if(!options.token_type) options.token_type = 'auth';
        let header_tokens = {token_type: options.token_type};
        let api_tokens = this.site_tokens[options.api_base_url];
        header_tokens.auth_token = options.auth_token || {
            key: 'Authorization',
            prefix: 'Token ',
            value: '',
        }
        header_tokens.csrf = options.csrf || {
            key: 'X-CSRFToken',
            input: 'csrfmiddlewaretoken',
            value: '',
        }
        if(api_tokens) header_tokens.csrf.value = api_tokens.csrf || '';
        if(api_tokens) header_tokens.auth_token.value = api_tokens.auth_token || '';


        if (!options.api_base_url) options.api_base_url = this.api_base_url;
        if(!this.site_tokens[this.api_base_url]) {this.site_tokens[this.api_base_url] = {}}
        else {
            header_tokens.csrf.value = this.site_tokens[this.api_base_url].csrf;
            header_tokens.auth_token.value = this.site_tokens[this.api_base_url].auth_token;
        }
        options.header_tokens = header_tokens;

        let api_client = new restServerApi(options);
        api_client.just_before_api_request = function(endpoint, max_request_wait){
            obj_this.showLoader(endpoint, max_request_wait);
        }
        api_client.on_api_complete = function(endpoint){
            obj_this.hideLoader(endpoint, 'complete');
        }
        return api_client;
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
                    <View style={{alignItems: 'center', width:'100%', zIndex:5, position: 'absolute', top: 0, left: 0}}>
                        <ActivityIndicator style={[{top: 100}]} color="green" size="large" />
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

        return (
            <View>
                <View>
                    {show_activity_indicator()}
                    {alert_dom()}
                    {show_errors()}
                </View>
                <ScrollView style={{padding: 10}}>
                    {child_view}
                    <AppButton onPress={() => { obj_this.componentDidMount() }} title="Refresh Now" />
                </ScrollView>
            </View>
        );
    }
}

