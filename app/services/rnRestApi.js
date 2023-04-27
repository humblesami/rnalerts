import rnStorage from './rnStorage';
import {AjaxClient} from '../../my_modules/jsajax/lib/index';

export default class restServerApi extends AjaxClient {
    async set_headers(fetch_options, headers={}){
        fetch_options.headers = headers;
        if((!'Accept' in fetch_options.headers)){
            fetch_options.headers['Accept'] = 'application/json';
        }
        if((!'Content-Type' in fetch_options.headers)){
            fetch_options.headers['Content-Type'] = 'application/json';
        }
        let auth_token = await rnStorage.get('auth_token');
        if(auth_token){
            fetch_options['headers']['Authorization'] = 'Token ' + auth_token;
        }
    }
}
