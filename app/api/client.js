import { AsyncStorage } from 'react-native';

let apiClient = {
    ping: null,
    get_data: null,
    rnStorage: null,
    post_data: null,
    api_server_url : '',
    vote_count_image: '',
    set_server_url: null,
    current_component: null,
};

(function () {
    let active_server_url = 'https://dap.92newshd.tv';
    let fetch_timeout = 10;

    active_server_url = 'http://127.0.0.1:8000';
    fetch_timeout = 200;

    async function fetch_request(endpoint, method, req_data={}) {
        const abort_controller = new AbortController();
        const timeoutId = setTimeout(() => abort_controller.abort(), fetch_timeout * 1000);

        let api_base_url = apiClient.api_server_url;
        let server_endpoint = api_base_url + endpoint;
        let raw_result = {
            status: 'failed', code: 512, message: 'No result',
            server_endpoint: server_endpoint, endpoint: endpoint.substr(1)
        }
        try{
            let loading_activities = apiClient.current_component.state.loading;
            loading_activities[endpoint] = 1;
            apiClient.current_component.setState({loading : loading_activities});

            let fetch_options = {
                method: method,
            }
            if(method != 'ping'){
                fetch_options.headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                };
                let auth_token = await apiClient.rnStorage.get('auth_token');
                if(auth_token){
                    fetch_options.headers['Authorization'] = 'Token ' + auth_token;
                }
                if(method.toLowerCase() == 'get'){
                    fetch_options.data = req_data;
                }
                else{
                    fetch_options.body = JSON.stringify(req_data);
                }
            }
            else{
                server_endpoint = endpoint;
                fetch_options.method = 'get';
            }

            fetch_options.signal = abort_controller.signal;
            let fetchResult = {status: 512};
            try{
                fetchResult = await fetch(server_endpoint, fetch_options);
            }
            catch(er_not_accessible){
                result.message = '' + er_not_accessible;
            }
            raw_result.code = fetchResult.status;
            if(fetchResult.status == 200){
                try{
                    let http_result = await fetchResult.json();
                    for(let key in http_result){
                        raw_result[key] = http_result[key];
                    }
                } catch(json_parse_error){
                    http_result.message = 'Invalid json response';
                }
            }
            let api_result = format_result(endpoint, timeoutId, api_base_url, raw_result);
            return api_result;
        }
        catch(er_api){
            let api_result = format_result(endpoint, timeoutId, api_base_url, raw_result);
            return Promise.resolve(api_result);
        }
    }

    function format_result(endpoint, timeoutId, api_base_url, processed_result){
        let server_endpoint = api_base_url + endpoint;
        if(processed_result.status == 'success'){
            processed_result.status = 'ok';
            if(processed_result.message == 'No result'){
                processed_result.message = "Success";
            }
        }
        if(processed_result.status !='ok'){
            processed_result.status = 'failed';
            if(!processed_result.message && processed_result.error){
                processed_result.message = processed_result.error;
            }
            if(!processed_result.message && processed_result.data){
                processed_result.message = processed_result.data;
            }
            if(!processed_result.message){
                processed_result.message = 'Invalid response';
            }
            processed_result.message += ' from '+ endpoint.substr(1);
            apiClient.current_component.set_failure_message(processed_result.message, api_base_url);
            console.log('\nFailed ' + processed_result.code + ' => ' + processed_result.message, '\n'+server_endpoint);
        }
        else{
            console.log('\OK', server_endpoint,  processed_result.message);
        }
        clearTimeout(timeoutId);
        explicitly_hide_loader(endpoint);
        return processed_result;
    }

    function explicitly_hide_loader(endpoint){
        let last_rendered = apiClient.current_component.last_rendered;
        delete apiClient.current_component.state.loading[endpoint];
        let loading_trace = apiClient.current_component.state.loading;
        setTimeout(()=>{
            if(apiClient.current_component.last_rendered == last_rendered){
                apiClient.current_component.setState({loading: loading_trace});
            }
        }, 500);
    }

    apiClient = {
        get_data: async function(endpoint, req_data={}){
            let res = await fetch_request(endpoint, 'GET', req_data);
            return res;
        },
        ping: async function(url){
            let res = await fetch_request(url, 'ping', {});
            return res;
        },
        api_server_url : active_server_url,
        set_server_url: function (server_url){
            this.api_server_url = server_url;
        },
        rnStorage: {
            save: async (key, value) => {
                try {
                    await AsyncStorage.setItem(key, value);
                } catch (eor1) {
                    // Error saving data
                }
            },
            get: async (key) => {
                try {
                    const value = await AsyncStorage.getItem(key);
                    return value;
                } catch (eor2) {
                    // Error retrieving data
                }
            }
        },
        post_data: async function(endpoint, item_to_save={}){
            try{
                let req_data = item_to_save;
                if(item_to_save.files){
                    let req_data = new FormData();
                    // console.log(item_to_save);
                    for (let key in item_to_save) {
                        req_data.append(key, item_to_save[key]);
                    }
                    item_to_save.files.forEach((file, index) => {
                        req_data.append('files', {
                            name: 'file' + index,
                            uri: file
                        });
                    });
                }
                let res = await fetch_request(endpoint, 'POST', req_data);
                return res;
            }
            catch(post_er){
                return new Promise(function (resolve, reject) {
                    reject(post_er, endpoint);
                });
            }
        }
    }
})();

export default apiClient;