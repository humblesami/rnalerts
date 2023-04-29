import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import colors from "../config/colors";

function AppButton({ title, onPress, color = undefined }) {
    let bg_color = {};
    if(color){
        color = colors[color] || color;
        bg_color = { backgroundColor: color };
    }
    else{
        bg_color = { backgroundColor: colors.happy};
    }
    return (
        <TouchableOpacity
            style={[styles.button, bg_color]}
            onPress={onPress}
        >
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
        marginVertical: 10,
    },
    text: {
        color: colors.white,
        fontSize: 15,
        textTransform: "uppercase",
        fontWeight: "bold",
    },
});

export default AppButton;
