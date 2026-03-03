import { useTheme } from "@/hooks/useTheme";
import { useAppStore } from "@/stores/appStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text } from "react-native";

const TOAST_DURATION = 3500;

export function NotificationToast() {
    const theme = useTheme();
    const c = theme.colors;
    const notification = useAppStore((state) => state.notification);
    const clearNotification = useAppStore((state) => state.clearNotification);
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const variantConfig = {
        success: {
            icon: "check-circle" as const,
            bgColor: c.surface,
            borderColor: c.success,
            iconColor: c.success,
            textColor: c.text,
        },
        error: {
            icon: "error" as const,
            bgColor: c.surface,
            borderColor: c.error,
            iconColor: c.error,
            textColor: c.text,
        },
        info: {
            icon: "info" as const,
            bgColor: c.surface,
            borderColor: c.primary,
            iconColor: c.primary,
            textColor: c.text,
        },
    };

    useEffect(() => {
        if (notification) {
            translateY.setValue(-100);
            opacity.setValue(0);

            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 10,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: -100,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    clearNotification();
                });
            }, TOAST_DURATION);

            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (!notification) return null;

    const config = variantConfig[notification.type] || variantConfig.info;

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                {
                    backgroundColor: config.bgColor,
                    borderLeftColor: config.borderColor,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <MaterialIcons name={config.icon} size={22} color={config.iconColor} />
            <Text style={[styles.message, { color: config.textColor }]}>
                {notification.message}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        // @ts-ignore — 'fixed' works on web, falls back to 'absolute' on native
        position: Platform.OS === "web" ? ("fixed" as any) : "absolute",
        top: 50,
        left: 16,
        right: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderLeftWidth: 4,
        zIndex: 99999,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
    },
});
