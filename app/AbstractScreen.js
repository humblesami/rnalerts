import React from 'react';
import "./ignoreWarnings";
import styles from './styles/main';
import ServerApi from './services/api';
import AppButton from './components/AppButton';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';


export default class AbstractScreen extends React.Component {
    constructor() {
        super();
        this.error_list = [];
        this.last_rendered = '';
        this.apiClient = new ServerApi(this);
        this.max_request_wait = Math.ceil(this.apiClient.fetch_timeout * 1.5);
        this.state = {
            loading: {},
            done_message: '',
            error_message : '',
            warning_message: '',
        };
    }


    on_api_error(message, activity_id, api_base_url){
        let screen_object = this;
        if(message.startsWith('No result')){
            message = 'Unable to connect server ' + api_base_url
        }
        let error_activity = {message: message, activity_id: activity_id};
        console.log('\nError detail => ', error_activity);
        if(!screen_object.error_list.find(x=> x.message == message || x.activity_id == activity_id)) {
            screen_object.error_list.push(error_activity);
            screen_object.state.error_message =  screen_object.error_list.map(item=>item.message).join('\n');
        }
    }

    on_success(activity_id){
        let index = -1;
        let screen_object = this;
        let i = 0;
        for(let item of screen_object.error_list){
            if(item.activity_id == activity_id){
                screen_object.error_list.splice(i, 1);
                screen_object.state.error_message =  screen_object.error_list.map(item=>item.message).join('\n');
                break;
            }
            i += 1;
        }
    }

    hideLoader(activity_id){
        delete this.state.loading[activity_id];
        if(!Object.keys(this.state.loading).length){
            this.setState({});
        }
    }

    showLoader(activity_id){
        let obj_this = this;
        this.state.loading[activity_id] = 1;
        if(Object.keys(this.state.loading).length == 1){
            this.setState({});
        }
        setTimeout(()=>{
            if(obj_this.state.loading[activity_id]){
                let message = 'Removed loader by time out after '+obj_this.max_request_wait;
                message += ' while service had timed out '+(obj_this.max_request_wait - obj_this.apiClient.fetch_timeout)+ 'ms ago';
                alert(message);
                obj_this.hideLoader(activity_id);
            }
        }, obj_this.max_request_wait);
    }

    on_warning(txt) {
        this.setState({ warning_message: txt });
    }

    st_upd = 0;
    setState(values) {
        let obj_this = this;
        if (!this.last_rendered) {
            for (let key in values) {
                this.state[key] = values[key];
            }
        }
        obj_this.st_upd += 1;
        super.setState(values);
        //console.log(11, this.state.warning_message, 12, this.state.error_message, 13, this.state.done_message);
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

    refreshIt(){
        console.log('Par');
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

        function show_activity_indicator(){
            if(Object.keys(obj_this.state.loading).length){
                return (
                    <View style={styles.loader}>
                        <ActivityIndicator color="orange" size="large" />
                    </View>
                );
            }
        }

        function show_done(){
            if(obj_this.state.done_message){
                console.log('don11', obj_this.state.warning_message);
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
                console.log('w11', obj_this.state.warning_message);
                return (
                    <View style={styles.loader}>
                        <View style={[styles.popup_container, styles.yellow_container]}>
                            <Text style={styles.popup_message}>{obj_this.state.warning_message}</Text>
                        </View>
                    </View>
                );
            }
        }

        function get_base_items(){
            let res = (
                <View>
                    {show_activity_indicator()}
                    {show_done()}
                    {show_errors()}
                    {show_warning()}
                </View>
            );
            return res;
        }

        return (
            <ScrollView style={styles.main_container}>
                {get_base_items()}
                {child_view}
                <AppButton onPress={() => { obj_this.componentDidMount() }} title="Refresh Now" />
            </ScrollView>
        );
    }
}

