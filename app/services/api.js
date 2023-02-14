import rnStorage from './rnStorage';

export default class ServerApi {
    constructor(component, time_limit=8){
        this.active_server_url = 'https://dap.92newshd.tv';
        //this.active_server_url = 'http://127.0.0.1:8000';
        this.fetch_timeout = time_limit;
        this.api_server_url = this.active_server_url;
        this.composer = component;
    }

    fetch_request(endpoint, method, req_data={}, time_limit=0) {
        let obj_this = this;
        let api_base_url = this.api_server_url;
        let server_endpoint = api_base_url + endpoint;
        let raw_result = {
            status: 'failed', code: 512, message: 'No result',
            server_endpoint: server_endpoint, endpoint: endpoint.substr(1)
        }
        const abort_controller = new AbortController();
        let max_request_wait = (time_limit ? time_limit : obj_this.fetch_timeout) * 1000;
        const timeoutId = setTimeout(() => abort_controller.abort(), max_request_wait);

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
            if(method == 'get'){
                fetch_options.data = req_data;
            }
            else{
                fetch_options.body = JSON.stringify(req_data);
            }
        }
        fetch_options.signal = abort_controller.signal;

        return rnStorage.get('auth_token').then(auth_token=> {
            if(auth_token){
                fetch_options['headers']['Authorization'] = 'Token ' + auth_token;
            }
            return fetch(server_endpoint, fetch_options)
        }).then(api_response=>{
            if(!api_response.status){
                if(api_response.detail)
                {
                    raw_result.message = 'Failed becaused => ' + api_response.detail;
                }
                else{
                    if(!api_response.message)
                    {
                        raw_result.message = 'Invalid access ';
                    }
                }
                return raw_result;
            }
            if(api_response.status == 200){
                return api_response.json().then(json_result=> json_result);
            }
            else{
                return {status: 'failed', message: 'Error thrown '+api_response.status+' by api'}
            }
        }).then(api_result=>{
            for(let key in api_result){
                raw_result[key] = api_result[key];
            }
            let processed_result = obj_this.format_result(endpoint, raw_result);
            if(processed_result.status == 'ok' || processed_result.status == 'success'){
                this.composer.on_api_success(endpoint);
            }
            else{
                this.composer.on_api_error(endpoint, processed_result.message);
            }
            return processed_result;
        }).catch(er_not_accessible => {
            er_not_accessible = '' + er_not_accessible;
            raw_result.status = 'failed';
            if(er_not_accessible.indexOf('JSON Parse error')){
                raw_result.message = ('Api response is not a valid json');
                if(!raw_result.code || raw_result.code == 512)
                {
                    raw_result.code = 500;
                }
            }
            else if(er_not_accessible.indexOf('Network request failed') > -1)
            {
                raw_result.message = 'Network request failed to reach';
            }
            else if(er_not_accessible.indexOf('AbortError') > -1){
                raw_result.message = ('Timed out after '+ (obj_this.fetch_timeout)+ ' seconds');
                raw_result.code = 513;
            }
            else{
                raw_result.message = 'Error in fetch => ' + er_not_accessible;
            }
            this.composer.on_api_error(endpoint, raw_result.message);
            return raw_result;
        }).catch(on_error=>{
            raw_result.message = 'Error 1 in catch => ' +on_error
            this.composer.on_api_error(endpoint, raw_result.message);
            return {status: 'failed', message: raw_result.message};
        }).catch(er_catch=>{
            raw_result.message = 'Error 2 in catch => ' +er_catch
            return {status: 'failed', message: raw_result.message};
        }).finally(x => {
            clearTimeout(timeoutId);
        });
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
        return this.fetch_request(url, 'ping', {}, max_time);
    }

    async get_data(endpoint, req_data={}, max_time=0){
        return this.fetch_request(endpoint, 'GET', req_data, max_time);
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
            return this.fetch_request(endpoint, 'POST', req_data, max_time);
        }
        catch(post_er){
            return new Promise(function (resolve, reject) {
                reject(post_er, endpoint);
            });
        }
    }
}
