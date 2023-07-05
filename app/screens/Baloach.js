import React from 'react';
import ConnectScreen from './Connect';

export default class BalochScreen extends ConnectScreen {
    constructor() {
        let api_base_url = 'https://www.balochistantimes.pk/epaper';
        super(api_base_url);
    }
}
