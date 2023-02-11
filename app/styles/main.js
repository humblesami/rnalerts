import { StyleSheet } from 'react-native';

export default styles = StyleSheet.create({
    container: {
        marginTop: 30,
        padding: 10
    },
    main_container: {
        padding: 10
    },
    popup_container:{
        padding: 40,
        width: '80%',
        zIndex: 4,
        elevation: 4
    },
    green_container:{
        backgroundColor: 'green',
    },
    yellow_container:{
        backgroundColor: 'orange',
    },
    popup_message:{
        fontSize: 18,
        color: 'white'
    },
    loader: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 3,
        elevation: 3,
        alignItems: 'center',
        justifyContent: 'center'
    },
    list_item: {
        marginVertical: 5,
        borderWidth: 2,
        padding: 5,
        flex: 1,
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    red_item: {
        borderWidth: 4,
        borderColor: 'red',
    },
    green_item: {
        borderColor: 'green',
    },
    er_style: {
        marginVertical: 5,
        color: 'red',
        fontWeight: 'bold',
        fontSize: 15,
    },
    heading2: {
        fontWeight: 'bold',
        fontSize: 16,
        paddingTop: 10,
        paddingBottom: 5,
    }
});