import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import type { ReactNode } from "react";
import { Platform, View } from "react-native";

const GLASS_SHADOW = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 18,
  elevation: 4,
} as const;

/**
 * Carte "verre dépoli" : fond translucide flouté + bordure fine + ombre portée.
 * Le blur devient visible quand du contenu défile derrière ; sinon il donne
 * juste une teinte vibrante (fallback opaque renforcé sur Android).
 */
export const GlassCard = ({
  children,
  className,
  padding = 16,
}: {
  children: ReactNode;
  className?: string;
  padding?: number;
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className={`rounded-3xl overflow-hidden border border-white/60 dark:border-white/10 ${className ?? ""}`}
      style={GLASS_SHADOW}
    >
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? "dark" : "light"}
        style={{
          padding,
          backgroundColor:
            Platform.OS === "android"
              ? isDark
                ? "rgba(39,39,42,0.88)"
                : "rgba(255,255,255,0.88)"
              : isDark
                ? "rgba(39,39,42,0.55)"
                : "rgba(255,255,255,0.55)",
        }}
      >
        {children}
      </BlurView>
    </View>
  );
};

export const cardShadow = GLASS_SHADOW;
