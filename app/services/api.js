import rnStorage from './rnStorage';

export default class ServerApi {
    constructor(component, time_limit=8){
        this.active_server_url = 'https://dap.92newshd.tv';
        //this.active_server_url = 'http://127.0.0.1:8000';
        this.fetch_timeout = time_limit;
        this.api_server_url = this.active_server_url;
        this.composer = component;
    }

    async fetch_request(endpoint, method, req_data={}, time_limit=0) {
        let obj_this = this;
        let api_base_url = this.api_server_url;
        let server_endpoint = api_base_url + endpoint;
        let raw_result = {
            status: 'failed', code: 512, message: 'No result',
            server_endpoint: server_endpoint, endpoint: endpoint.substr(1)
        }
        let api_result = raw_result;
        const abort_controller = new AbortController();
        let max_request_wait = (time_limit ? time_limit : obj_this.fetch_timeout) * 1000;
        const timeoutId = setTimeout(() => abort_controller.abort(), max_request_wait);

        try{
            this.composer.showLoader(endpoint, max_request_wait);
            method = method.toLowerCase()
            let fetch_options = {method: method}

            if(method == 'ping'){
                server_endpoint = endpoint;
                fetch_options.method = 'get';
            }
            else{
                fetch_options.headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                };
                let auth_token = await rnStorage.get('auth_token');
                if(auth_token){
                    fetch_options['headers'] = {
                        'Content-Type': 'application/json',
                        'Authorization': 'Token ' + auth_token
                    }
                }
                if(method == 'get'){
                    fetch_options.data = req_data;
                }
                else{
                    fetch_options.body = JSON.stringify(req_data);
                }
            }
            fetch_options.signal = abort_controller.signal;
            try{
                let fetchResult = await fetch(server_endpoint, fetch_options);
                raw_result.code = fetchResult.status;
                fetchResult = await fetchResult.json();
                if(!fetchResult.status){
                    fetchResult.status = 'failed';
                    if(fetchResult.detail)
                    {
                        fetchResult.message = 'Failed becaused => ' + fetchResult.detail;
                    }
                    else{
                        if(!fetchResult.message)
                        {
                            fetchResult.message = 'Invalid access '+raw_result.code;
                        }
                    }
                }
                for(let key in fetchResult){
                    raw_result[key] = fetchResult[key];
                }
            }
            catch(er_not_accessible){
                er_not_accessible = '' + er_not_accessible;
                if(er_not_accessible.indexOf('AbortError') > -1){
                    raw_result.message = ('Timed out after '+ (obj_this.fetch_timeout)+ ' seconds');
                    raw_result.code = 513;
                }
                else{
                    raw_result.message = 'Error in fetch => ' + er_not_accessible;
                }
            }
            api_result = obj_this.format_result(endpoint, raw_result);
            if(api_result.status == 'ok' || api_result.status == 'success'){
                this.composer.on_api_success(endpoint);
                console.log(api_result.message);
            }
            else{
                this.composer.on_api_error(api_result.message, endpoint);
                console.log(api_result.message);
            }
        }
        catch(er_api){
            alert('Error in api catching error');
            api_result = {status: 'error', message: '' + er_api, error: '' + er_api};
            this.composer.on_api_error(endpoint);
        }
        clearTimeout(timeoutId);
        return api_result;
    }

    format_result(endpoint, processed_result){
        if(processed_result.status == 'success'){
            processed_result.status = 'ok';
        }
        if(processed_result.status != 'ok'){
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
            processed_result.message += ' in => '+ endpoint.substr(1);
            processed_result.status = 'error';
        }
        else{
            if(processed_result.message == 'No result'){
                processed_result.message = "Success at " + endpoint.substr(1);
            }
        }
        return processed_result;
    }

    set_server_url(server_url){
        this.api_server_url = server_url;
    }

    async ping(url, max_time=0){
        let res = await this.fetch_request(url, 'ping', {}, max_time);
        return res;
    }

    async get_data(endpoint, req_data={}, max_time=0){
        let res = await this.fetch_request(endpoint, 'GET', req_data, max_time);
        return res;
    }

    async post_data(endpoint, item_to_save={}, max_time=0){
        try{
            let req_data = item_to_save;
            if(item_to_save.files){
                let req_data = new FormData();
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
            let res = await this.fetch_request(endpoint, 'POST', req_data, max_time);
            return res;
        }
        catch(post_er){
            return new Promise(function (resolve, reject) {
                reject(post_er, endpoint);
            });
        }
    }
}
