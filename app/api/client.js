import { AsyncStorage } from 'react-native';
let apiClient = {
    get_data: null,
    ping: null,
    api_server_url : '',
    set_server_url: null,
    rnStorage: null,
    post_data: null,
    vote_count_image: ''
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
        try{
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
            clearTimeout(timeoutId);

            if(method == 'ping'){
                return Promise.resolve(fetchResult.status);
            }
            if(fetchResult.status != 200){
                return Promise.resolve({status: 'failed', message: 'Failed to reach => ' + endpoint});
            }

            const result = await fetchResult.json(); // parsing the response
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
            return result;
        }
        catch(er_api){
            // alert('er is = ' + JSON.stringify(er));
            clearTimeout(timeoutId);
            let res = {status: 'failed', message: 'Request to ' + endpoint + ' failed'};
            console.log(res.message);
            return Promise.resolve(res);
        }
    }

    function reject_promise(err, endpoint){
        let stack = '';
        if(err.stack){
            stack = err.stack.split('\n');
        }
        else{
            stack = err.split('\n');
            if(stack.length > 3){
                stack = stack.slice(0, 3);
            }
            stack = stack.join('\n\n');
        }

        let error_message = err.message || '' + err;

        // alert(error_message);
        // error_message = stack;
        return new Promise(function (resolve, reject) {
            reject(error_message+ ' from '+endpoint);
        });
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