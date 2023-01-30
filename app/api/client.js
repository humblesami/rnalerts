import { AsyncStorage } from 'react-native';
let apiClient = {
    get_data: async function(endpoint, req_data={}){
        let res = await fetch_request(endpoint, 'GET', req_data);
        return res;
    },
    ping: async function(url){
        let res = await fetch_request(url, 'ping', {});
        return res;
    },
    api_server_url : '',
    set_server_url: null,
    rnStorage: null,
    post_data: null,
    vote_count_image: ''
};
(function () {
    let active_server_url = 'https://dap.92newshd.tv';
    active_server_url = 'http://127.0.0.1:8000';


    function initFetchController(time){
        const controller = new AbortController();
        const timeout_obj = setTimeout(() => {
            console.log('aborting after '+ time);
            controller.abort();
            clearTimeout(timeout_obj);
        }, time * 1000);
        return {
            signal: controller.signal,
            cleared: 0,
            clear_it: function(message){
                //console.log('clearing with '+message);
                if(!this.cleared){
                    this.cleared = 1;
                    clearTimeout(timeout_obj);
                }
                else{
                    console.log('time already cleared');
                }
            }
        };
    }

    async function fetch_request(endpoint, method, req_data={}) {
        let api_base_url = apiClient.api_server_url + '/api';
        let server_endpoint = api_base_url + endpoint;
        let fetchController = initFetchController(8);
        try{
            let fetch_options = {
                method: method,
            }
            if(method != 'ping'){
                if(method.toLowerCase() == 'get'){
                    fetch_options.data = req_data;
                }
                else{
                    fetch_options.body = req_data;
                }
            }
            else{
                server_endpoint = endpoint;
                fetch_options.method = 'get';
            }

            fetch_options.signal = fetchController.signal;

            const fetchResult = await fetch(server_endpoint, fetch_options);
            let status = 'Uknown';
            if(fetchResult && fetchResult.status){ status = fetchResult.status };
            //console.log('\nStatus = '+status+'\n');
            if(method == 'ping'){
                fetchController.clear_it('after result => ' + fetchResult.status);
                return Promise.resolve(fetchResult.status);
            }
            if(fetchResult.status != 200){
                return {status: 'failed', data: 'Failure 2 in request '};
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
            fetchController.clear_it('after result => ' + fetchResult.status);

            result.server_endpoint = server_endpoint;
            console.log('Request serverd from => '+server_endpoint);
            return result;
        }
        catch(er_api){
            // alert('er is = ' + JSON.stringify(er));
            fetchController.clear_it('clear on falure');
            let res = {status: 'failed', message: 'Failure 1 in request ' + server_endpoint + ' => ' + er_api};
            console.log(res.message);
            return res;
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