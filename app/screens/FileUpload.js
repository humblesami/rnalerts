import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import AbstractScreen from '../AbstractScreen';
import ImageInput from '../components/ImageInput';

export default class FileUpload extends AbstractScreen {
    constructor() {
        super('');
    }

    upload_images(im_list, after_upload) {
        let obj_this = this;
        const form_data = new FormData();
        let i = 0;
        for (let item of im_list) {
            form_data.append('img1__mt__'+i, {
                name: item.fileName,
                type: item.type,
                uri: Platform.OS === 'ios' ? item.uri.replace('file://', '') : item.uri,
            });
            i++;
        }
        // Object.keys(body).forEach((key) => {
        //     form_data.append(key, body[key]);
        // });
        obj_this.apiClient.on_api_success = function(res_data){ after_upload(res_data, im_list) };
        obj_this.apiClient.on_api_failed = after_upload;
        let endpoint = '/expo/test-upload';
        obj_this.apiClient.post_data(endpoint, form_data);
    }

    render() {
        let obj_this = this;
        obj_this.last_rendered = new Date();
        let child_view = (
            <View>
                <ImageInput onChangeImage={(images, after_upload) => { obj_this.upload_images(images, after_upload) }} />
            </View>
        );
        return obj_this.render_in_parent(child_view);
    }
}
