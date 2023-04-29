import React, { useState } from 'react';
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

function ImageInput({ onChangeImage }) {
    const [pickedImages, setFilePath] = useState([]);
    const requestCameraPermission = async () => {
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

    const requestExternalWritePermission = async () => {
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

    const fetch_image = (response) => {
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
        response = response.assets ? response.assets : (response ? response : []);
        setFilePath(response);
        onChangeImage(response);
    }

    const chooseFile = (type) => {
        let options = {
            mediaType: type,
            maxWidth: 300,
            maxHeight: 550,
            quality: 1,
        };
        launchImageLibrary(options, (response) => {
            fetch_image(response);
        });
    };

    const captureImage = async (type) => {
        let options = {
            mediaType: type,
            maxWidth: 300,
            maxHeight: 550,
            quality: 1,
            videoQuality: 'low',
            durationLimit: 30, //Video max duration in seconds
            saveToPhotos: true,
        };
        let isCameraPermitted = await requestCameraPermission();
        let isStoragePermitted = await requestExternalWritePermission();
        if (isCameraPermitted && isStoragePermitted) {
            launchCamera(options, (response) => {
                fetch_image(response);
            });
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                {
                    function(){
                        //console.log('Picked images => '+pickedImages.length, pickedImages);
                    }()
                }
                <TouchableOpacity
                    activeOpacity={0.5}
                    style={styles.buttonStyle}
                    onPress={() => chooseFile('photo')}>
                    <Text style={styles.textStyle}>Choose Image</Text>
                </TouchableOpacity>
                <View>{
                    pickedImages.map(function(item, kk) {
                        return (
                            item.uri ? <Image source={{ uri: item.uri }} key={{ kk }} style={styles.imageStyle} /> : (
                                item.data ? <Image source={{ uri: 'data:image/jpeg;base64,' + filePath.data }} style={styles.imageStyle} /> : null
                            )
                        )
                    })
                }</View>
                <TouchableOpacity
                    activeOpacity={0.5}
                    style={styles.buttonStyle}
                    onPress={() => captureImage('photo')}>
                    <Text style={styles.textStyle}>Launch Camera for Image</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default ImageInput;