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
        this.state = {
            loading: {},
            done_popup: '',
            warning_popup: '',
            error_message : '',
            warning_message: '',
        };
    }


    on_api_error(message, activity_id){
        let screen_object = this;
        let error_activity = {message: message, activity_id: activity_id};
        if(!screen_object.error_list.find(x=> x.message == message || x.activity_id == activity_id)) {
            screen_object.error_list.push(error_activity);
            screen_object.state.error_message =  screen_object.error_list.map(item=>item.message).join('\n');
        }
        screen_object.hideLoader(activity_id);
    }

    on_api_success(activity_id){
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
        screen_object.hideLoader(activity_id);
    }

    hideLoader(activity_id, keep_state=0){
        delete this.state.loading[activity_id];
        if(!keep_state && !Object.keys(this.state.loading).length){
            this.setParentState({}, 'complete '+activity_id);
        }
    }

    showLoader(activity_id, time_limit=10, keep_state=0){
        let obj_this = this;
        this.state.loading[activity_id] = 1;
        if(!keep_state && Object.keys(this.state.loading).length == 1){
            this.setParentState({}, 'init '+activity_id);
        }
        setTimeout(()=>{
            if(obj_this.state.loading[activity_id]){
                let message = 'Removed loader '+activity_id+' after waiting '+obj_this.max_request_wait + ' seconds';
                message += ' Service timed out '+(obj_this.max_request_wait - obj_this.apiClient.fetch_timeout)+ ' seconds ago';
                alert(message);
                obj_this.hideLoader(activity_id);
            }
        }, (time_limit * 1000) + 1000);
    }

    st_upd = 0;
    setParentState(values, source='unknown') {
        let obj_this = this;
        if (this.last_rendered) {
            obj_this.st_upd += 1;
            super.setState(values);
            console.log('\n Pstate updates = '+obj_this.st_upd+' => '+source);
        }
        else{
            for (let key in values) {
                this.state[key] = values[key];
            }
        }
    }

    setState(values, source='unknown') {
        let obj_this = this;
        if (this.last_rendered) {
            obj_this.st_upd += 1;
            super.setState(values);
            console.log('\n Cstate updates = '+obj_this.st_upd+', source '+source);
        }
        else{
            for (let key in values) {
                this.state[key] = values[key];
            }
        }
    }

    popup(state_attribute, message){
        let obj_this = this;
        console.log('\nWarning => '+message);
        obj_this.state[state_attribute] = message;
        obj_this.setParentState({}, 'popup start for '+state_attribute);
        setTimeout(()=>{
            obj_this.state[state_attribute] = '';
            obj_this.setParentState({}, 'popup end for '+state_attribute);
        }, 1500);
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
            if(obj_this.state.done_popup){
                return (
                    <View style={styles.loader}>
                        <View style={[styles.popup_container, styles.green_container]}>
                            <Text style={styles.popup_message}>{obj_this.state.done_popup}</Text>
                        </View>
                    </View>
                );
            }
        }

        function show_warnings() {
            if (obj_this.state.warning_message) {
                return (
                    <View style={[styles.yellow_container]}>
                        <Text color='black' style={styles.popup_message}>{obj_this.state.warning_message}</Text>
                    </View>
                );
            }
        }

        function show_temporary_warning() {
            if (obj_this.state.warning_popup) {
                return (
                    <View style={styles.loader}>
                        <View style={[styles.popup_container, styles.yellow_container]}>
                            <Text color='black' style={styles.popup_message}>{obj_this.state.warning_popup}</Text>
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
                    {show_warnings()}
                    {show_temporary_warning()}
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

