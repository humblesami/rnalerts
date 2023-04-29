import React from 'react';
import {
    SafeAreaView, StyleSheet, Text, View, TouchableOpacity,
    Image, Platform, PermissionsAndroid,
} from 'react-native';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    textStyle: {
        padding: 10,
        color: 'black',
        textAlign: 'center',
    },
    buttonStyle: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 5,
        marginVertical: 10,
        width: 250,
    },
    imageStyle: {
        width: 200,
        height: 200,
        margin: 5,
    },
});

export default class ImageInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error_message: '',
            pickedImages: []
        };
    }
    async requestCameraPermission() {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'App needs camera permission',
                    },
                );
                // If CAMERA Permission is granted
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        } else return true;
    };

    async requestExternalWritePermission() {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'External Storage Write Permission',
                        message: 'App needs write permission',
                    },
                );
                // If WRITE_EXTERNAL_STORAGE Permission is granted
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                alert('Write permission err', err);
            }
            return false;
        } else return true;
    };

    fetch_image(response) {
        let obj_this = this;
        if (response.didCancel) {
            alert('User cancelled camera picker');
            return;
        } else if (response.errorCode == 'camera_unavailable') {
            alert('Camera not available on device');
            return;
        } else if (response.errorCode == 'permission') {
            alert('Permission not satisfied');
            return;
        } else if (response.errorCode == 'others') {
            alert(response.errorMessage);
            return;
        }
        let chosenImages = response.assets ? response.assets : (response ? response : []);
        this.props.onChangeImage(chosenImages, function(res_data){
            obj_this.after_upload(res_data, chosenImages);
        });
    }

    after_upload(res_data, chosenImages){
        if(res_data.done)
        {
            this.setState({error_message: '', pickedImages: chosenImages});
        }
        else{
            let em = res_data.error || res_data.message;
            em  = em || 'Some error in upload';
            this.setState({error_message: em, pickedImages: []});
        }
    }

    chooseFile(type) {
        let obj_this = this;
        let options = {
            mediaType: type,
            maxWidth: 300,
            maxHeight: 550,
            quality: 1,
        };
        launchImageLibrary(options, (response) => {
            obj_this.fetch_image(response);
        });
    };

    async captureImage(type) {
        let obj_this = this;
        let options = {
            mediaType: type,
            maxWidth: 300,
            maxHeight: 550,
            quality: 1,
            videoQuality: 'low',
            durationLimit: 30, //Video max duration in seconds
            saveToPhotos: true,
        };
        let isCameraPermitted = await obj_this.requestCameraPermission();
        let isStoragePermitted = await obj_this.requestExternalWritePermission();
        if (isCameraPermitted && isStoragePermitted) {
            launchCamera(options, (response) => {
                obj_this.fetch_image(response);
            });
        }
    };

    render() {
        let obj_this = this;
        let image_list = obj_this.state.pickedImages;
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.container}>
                    {
                        function () {
                            //console.log('Picked images => '+image_list.length, image_list);
                        }()
                    }
                    <TouchableOpacity
                        activeOpacity={0.5}
                        style={styles.buttonStyle}
                        onPress={() => obj_this.chooseFile('photo')}>
                        <Text style={styles.textStyle}>Choose Image</Text>
                    </TouchableOpacity>
                    <View>{
                        image_list.map(function (item, kk) {
                            return (
                                item.uri ? <Image source={{ uri: item.uri }} key={{ kk }} style={styles.imageStyle} /> : (
                                    item.data ? <Image source={{ uri: 'data:image/jpeg;base64,' + filePath.data }} style={styles.imageStyle} /> : null
                                )
                            )
                        })
                    }</View>
                    <View>
                        <Text style={{color: 'red', fontWeight: 'bold'}}>{obj_this.state.error_message}</Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.5}
                        style={styles.buttonStyle}
                        onPress={() => obj_this.captureImage('photo')}>
                        <Text style={styles.textStyle}>Launch Camera for Image</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }
}
