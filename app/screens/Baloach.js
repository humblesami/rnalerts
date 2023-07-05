import React from 'react';
import ConnectScreen from './Connect';

export default class BalochScreen extends ConnectScreen {
    constructor() {
        let api_base_url = 'https://www.balochistantimes.pk/epaper';
        api_base_url = 'http://127.0.0.1:8000/epaper';
        super(api_base_url);
    }
}
