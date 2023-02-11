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
            done_message: '',
            error_message : '',
            warning_message: '',
        };
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
    }
    removeLoader(loader_api){
        delete this.state.loading[loader_api];
    }

    on_warning(txt) {
        this.setState({ warning_message: txt });
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

    render_parent(child_view) {
        let obj_this = this;
        obj_this.last_rendered = new Date();
        console.log('Getting all');
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

