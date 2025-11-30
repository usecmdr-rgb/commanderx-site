import React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import Svg, { Image as SvgImage } from "react-native-svg";
import { colors } from "@/theme";
import { LOGO_BASE64 } from "@/utils/logoBase64";

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 32 }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Calculate logo dimensions maintaining aspect ratio (403x335)
  const aspectRatio = 403 / 335;
  const logoWidth = size * 2.5;
  const logoHeight = logoWidth / aspectRatio;

  // Create data URI for the base64 image
  const imageUri = `data:image/png;base64,${LOGO_BASE64}`;

  return (
    <View style={[styles.container, { width: logoWidth, height: size }]}>
      <Svg width={logoWidth} height={logoHeight} viewBox="0 0 403 335">
        <SvgImage
          href={imageUri}
          x="0"
          y="0"
          width="403"
          height="335"
          preserveAspectRatio="xMidYMid meet"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});
