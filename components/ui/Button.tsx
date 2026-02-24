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
  const variantStyle = variantStyles[variant] || variantStyles.primary;
  const sizeStyle = sizeStyles[size] || sizeStyles.medium;
  const textVariantStyle = textVariantStyles[variant] || textVariantStyles.primary;
  const textSizeStyle = textSizeStyles[size] || textSizeStyles.medium;

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyle,
        sizeStyle,
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? "#58CC02" : "#FFFFFF"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            textVariantStyle,
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

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: "#58CC02",
  },
  secondary: {
    backgroundColor: "#CE82FF",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#58CC02",
  },
  ghost: {
    backgroundColor: "transparent",
  },
});

const sizeStyles = StyleSheet.create({
  small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  large: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
});

const textVariantStyles = StyleSheet.create({
  primary: { color: "#FFFFFF" },
  secondary: { color: "#FFFFFF" },
  outline: { color: "#58CC02" },
  ghost: { color: "#58CC02" },
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
