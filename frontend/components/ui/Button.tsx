import { useTheme } from '@/hooks/useTheme';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  textStyle?: TextStyle;
}

export const Button = ({
  title,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled,
  style,
  textStyle,
  ...props
}: ButtonProps) => {
  const theme = useTheme();
  const c = theme.colors;

  const variantBg: Record<string, any> = {
    primary: { backgroundColor: c.primary },
    secondary: { backgroundColor: c.secondary },
    outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: c.primary },
    ghost: { backgroundColor: 'transparent' },
  };

  const variantText: Record<string, any> = {
    primary: { color: '#FFFFFF' },
    secondary: { color: '#FFFFFF' },
    outline: { color: c.primary },
    ghost: { color: c.primary },
  };

  const sizeStyle = sizeStyles[size] || sizeStyles.medium;
  const textSizeStyle = textSizeStyles[size] || textSizeStyles.medium;

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      style={[
        styles.button,
        variantBg[variant] || variantBg.primary,
        sizeStyle,
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? c.primary : "#FFFFFF"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variantText[variant] || variantText.primary,
            textSizeStyle,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const sizeStyles = StyleSheet.create({
  small: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  medium: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8 },
  large: { paddingVertical: 18, paddingHorizontal: 28, borderRadius: 12 },
});

const textSizeStyles = StyleSheet.create({
  small: { fontSize: 13 },
  medium: { fontSize: 16 },
  large: { fontSize: 18 },
});

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  disabledButton: {
    opacity: 0.7,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
});
