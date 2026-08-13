import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ArrowRight } from "lucide-react-native";

// ============================================================
// PROFILE ROW
// ============================================================

type ProfileRowProps = {
  icon: React.ReactNode;
  label: string;
  labelColor?: string;
  destructive?: boolean;
  loading?: boolean;
  onPress: () => void;
};

const ProfileRow = ({
  icon,
  label,
  labelColor = "#111111",
  destructive = false,
  loading = false,
  onPress,
}: ProfileRowProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.profileRow,
        pressed && !loading && styles.profileRowPressed,
        loading && styles.profileRowDisabled,
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>

        <Text
          style={[
            styles.rowLabel,
            {
              color: labelColor,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>

      <View style={styles.rowRight}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={destructive ? "#EF2029" : "#1677FF"}
          />
        ) : (
          <ArrowRight size={30} color="#6B7280" strokeWidth={2} />
        )}
      </View>
    </Pressable>
  );
};

export default ProfileRow;

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ----------------------------------------------------------
  // ROW
  // ----------------------------------------------------------

  profileRow: {
    minHeight: 105,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderRadius: 18,
  },

  profileRowPressed: {
    backgroundColor: "rgba(15,23,42,0.045)",
    transform: [{ scale: 0.995 }],
  },

  profileRowDisabled: {
    opacity: 0.65,
  },

  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  rowIcon: {
    width: 54,
    alignItems: "flex-start",
    justifyContent: "center",
    marginRight: 18,
  },

  rowLabel: {
    flex: 1,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "400",
  },

  rowRight: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 12,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 0,
  },
});
