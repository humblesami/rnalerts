import rnStorage from './rnStorage';

export default class ServerApi {
    constructor(component, time_limit=8){
        this.active_server_url = 'https://dap.92newshd.tv';
        //this.active_server_url = 'http://127.0.0.1:8000';
        this.fetch_timeout = time_limit * 1000;
        this.api_server_url = this.active_server_url;
        this.composer = component;
    }

    async fetch_request(endpoint, method, req_data={}, time_limit=0) {
        let obj_this = this;
        const abort_controller = new AbortController();
        let max_request_wait = time_limit || obj_this.fetch_timeout;
        const timeoutId = setTimeout(() => abort_controller.abort(), max_request_wait);

        let api_base_url = this.api_server_url;
        let server_endpoint = api_base_url + endpoint;

        let raw_result = {
            status: 'failed', code: 512, message: 'No result',
            server_endpoint: server_endpoint, endpoint: endpoint.substr(1)
        }
        try{
            this.composer.showLoader(endpoint);
            let fetch_options = {
                method: method,
            }

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
                    fetch_options.headers['Authorization'] = 'Token ' + auth_token;
                }
                if(method.toLowerCase() == 'get'){
                    fetch_options.data = req_data;
                }
                else{
                    fetch_options.body = JSON.stringify(req_data);
                }
            }
            fetch_options.signal = abort_controller.signal;
            let fetchResult = {status: 512};
            try{
                fetchResult = await fetch(server_endpoint, fetch_options);
            }
            catch(er_not_accessible){
                console.log('\nError in access '+er_not_accessible);
                result.message = '' + er_not_accessible;
            }
            raw_result.code = fetchResult.status;
            try{
                let http_result = await fetchResult.json();
                if(!http_result.status){
                    http_result.status = 'failed';
                    if(http_result.detail)
                    {
                        http_result.message = http_result.detail;
                        console.log(fetch_options);
                    }
                    else{
                        if(!http_result.message)
                        {
                            http_result.message = 'Invalid access '+raw_result.code;
                        }
                    }
                }
                for(let key in http_result){
                    raw_result[key] = http_result[key];
                }
            } catch(json_parse_error){
                console.log('\n Not a json');
                http_result.message = 'Invalid json response';
            }

            let api_result = obj_this.format_result(endpoint, timeoutId, api_base_url, raw_result);
            return api_result;
        }
        catch(er_api){
            try{
                let api_result = obj_this.format_result(endpoint, timeoutId, api_base_url, raw_result);
                return Promise.resolve(api_result);
            }
            catch(gen_err){
                console.log('Error => ', gen_err);
                alert('Error in api catch');
                return Promise.resolve({status: 'error', message: '' + gen_err, error: '' + gen_err});
            }
        }
    }

    format_result(endpoint, timeoutId, api_base_url, processed_result){
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
            this.composer.on_api_error(processed_result.message, api_base_url);
            console.log('\nFailed ' + processed_result.code + ' => ' + processed_result.message, '\n'+server_endpoint);
        }
        else{
            console.log('\OK', server_endpoint,  processed_result.message);
        }
        clearTimeout(timeoutId);
        this.composer.hideLoader(endpoint);
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
