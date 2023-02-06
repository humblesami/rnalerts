import { AsyncStorage } from 'react-native';
let rnStorage = {
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
}
export default rnStorage;