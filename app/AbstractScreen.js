import React from 'react';
import "./ignoreWarnings";
import ServerApi from './services/api';


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
}
