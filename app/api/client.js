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

    //active_server_url = 'http://127.0.0.1:8000';
    //fetch_timeout = 200;


    async function fetch_request(endpoint, method, req_data={}) {
        const abort_controller = new AbortController();
        const timeoutId = setTimeout(() => abort_controller.abort(), fetch_timeout * 1000);

        let api_base_url = apiClient.api_server_url;
        let server_endpoint = api_base_url + endpoint;
        try{
            let loading_activities = apiClient.current_component.state.loading;
            loading_activities[endpoint] = 1;
            apiClient.current_component.setState({loading : loading_activities});

            let fetch_options = {
                method: method,
            }
            if(method != 'ping'){
                if(method.toLowerCase() == 'get'){
                    fetch_options.data = req_data;
                }
                else{
                    fetch_options.body = JSON.stringify(req_data);
                    fetch_options.headers = {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    };
                    let auth_token = await apiClient.rnStorage.get('auth_token');
                    if(auth_token){
                        fetch_options.headers['Authorization'] = 'Token ' + auth_token;
                    }
                }
            }
            else{
                server_endpoint = endpoint;
                fetch_options.method = 'get';
            }

            fetch_options.signal = abort_controller.signal;
            const fetchResult = await fetch(server_endpoint, fetch_options);
            console.log('\nStatus = ' + fetchResult.status + ', Url = ', fetchResult.url);

            let status = 'Uknown';
            if(fetchResult && fetchResult.status){ status = fetchResult.status };

            let result = {};
            if(method == 'ping'){
                result = fetchResult.status;
            }
            else if(fetchResult.status != 200){
                if(fetchResult.status == 403 || fetchResult.status == 401){
                    console.log('\nUnuthorized1 ',fetch_options);
                }
                result = {status: 'failed', message: 'Failed to reach => ' + endpoint};
            }
            else{
                result = await fetchResult.json(); // parsing the response
                if(result.status == 'success'){
                    result.status = 'ok';
                }
                if(result.status !='ok'){
                    if(result.error){
                       result.message = result.error;
                    }
                    if(result.data){
                        result.message = result.error;
                    }
                }
                result.server_endpoint = server_endpoint;
            }
            explicitly_hide_loader(endpoint);
            clearTimeout(timeoutId);
            return result;
        }
        catch(er_api){
            explicitly_hide_loader(endpoint);
            clearTimeout(timeoutId);
            let res = {status: 'failed', message: 'Request to ' + endpoint + ' failed'};
            console.log(res.message);
            return Promise.resolve(res);
        }
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