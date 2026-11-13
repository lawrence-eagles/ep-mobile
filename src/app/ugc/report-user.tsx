import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ================= CONFIGURATION =================

const API_BASE_URL = getEnv().BACKEND_URL.replace(/\/+$/, "");

// ================= TYPES =================

type ReportReason =
  | "spam"
  | "harassment_bullying"
  | "hate_speech"
  | "violence_dangerous_content"
  | "nudity_sexual_content"
  | "misinformation"
  | "impersonation"
  | "inappropriate_content"
  | "other";

interface ReportOption {
  label: string;
  value: ReportReason;
}

interface SubmitReportParams {
  targetId: string;
  reason: ReportReason;
}

interface SubmitReportResponse {
  message?: string;
  error?: string;
  reportId?: string;
}

// ================= REPORT OPTIONS =================

const REPORT_OPTIONS: ReportOption[] = [
  {
    label: "Spam",
    value: "spam",
  },
  {
    label: "Harassment Bullying",
    value: "harassment_bullying",
  },
  {
    label: "Hate Speech",
    value: "hate_speech",
  },
  {
    label: "Violence Dangerous Content",
    value: "violence_dangerous_content",
  },
  {
    label: "Nudity Sexual Content",
    value: "nudity_sexual_content",
  },
  {
    label: "Misinformation",
    value: "misinformation",
  },
  {
    label: "Impersonation",
    value: "impersonation",
  },
  {
    label: "Inappropriate Content",
    value: "inappropriate_content",
  },
  {
    label: "Other",
    value: "other",
  },
];

// ================= COMPONENT =================

const ReportUser = () => {
  const router = useRouter();

  const { userId: userIdParam, type } = useLocalSearchParams<{
    userId?: string;
    type?: string;
  }>();

  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

  const reportType = Array.isArray(type) ? type[0] : type;

  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
    null,
  );

  // ================= SUBMIT REPORT API =================

  const submitReport = useCallback(
    async ({
      targetId,
      reason,
    }: SubmitReportParams): Promise<SubmitReportResponse> => {
      const cookies = await authClient.getCookie();

      if (!cookies) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/reports`, {
        method: "POST",
        headers: {
          Cookie: cookies,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "omit",
        body: JSON.stringify({
          targetType: "user",
          targetId,
          reason,
        }),
      });

      let responseData: SubmitReportResponse | null = null;

      try {
        responseData = (await response.json()) as SubmitReportResponse;
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        throw new Error(
          responseData?.message ||
            responseData?.error ||
            `Unable to submit report. Server returned ${response.status}.`,
        );
      }

      return (
        responseData ?? {
          message: "Your report was submitted successfully.",
        }
      );
    },
    [],
  );

  // ================= REACT QUERY MUTATION =================

  const reportMutation = useMutation<
    SubmitReportResponse,
    Error,
    SubmitReportParams
  >({
    mutationFn: submitReport,
  });

  // ================= SUBMIT HANDLER =================

  const handleSubmit = useCallback(async () => {
    if (!userId?.trim()) {
      Alert.alert(
        "Unable to submit report",
        "The user ID could not be found. Please go back and try again.",
      );
      return;
    }

    if (reportType && reportType !== "user") {
      Alert.alert(
        "Unable to submit report",
        "Invalid report type. Please go back and try again.",
      );
      return;
    }

    if (!selectedReason) {
      Alert.alert(
        "Select a reason",
        "Please select a reason for reporting this user.",
      );
      return;
    }

    if (reportMutation.isPending) {
      return;
    }

    try {
      const result = await reportMutation.mutateAsync({
        targetId: userId,
        reason: selectedReason,
      });

      Alert.alert(
        "Report Submitted",
        result.message || "Your report has been submitted successfully.",
        [
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your report. Please try again.";

      Alert.alert("Report Failed", message, [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Retry",
          onPress: () => {
            void handleSubmit();
          },
        },
      ]);
    }
  }, [
    userId,
    reportType,
    selectedReason,
    reportMutation.isPending,
    reportMutation.mutateAsync,
    router,
  ]);

  // ================= RADIO OPTION =================

  const renderReportOption = (option: ReportOption) => {
    const isSelected = selectedReason === option.value;

    return (
      <Pressable
        key={option.value}
        onPress={() => setSelectedReason(option.value)}
        disabled={reportMutation.isPending}
        accessibilityRole="radio"
        accessibilityLabel={option.label}
        accessibilityState={{
          checked: isSelected,
          disabled: reportMutation.isPending,
        }}
        style={({ pressed }) => [
          styles.optionRow,
          pressed && styles.optionPressed,
        ]}
      >
        <View style={styles.radioContainer}>
          <View
            style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}
          >
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>

        <View style={styles.optionTextContainer}>
          <Text style={styles.optionText}>{option.label}</Text>
        </View>
      </Pressable>
    );
  };

  // ================= UI =================

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        {/* ================= HEADER ================= */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <ChevronLeft size={34} color="#102DAA" strokeWidth={2.5} />
          </Pressable>

          <Text style={styles.headerTitle}>Report User</Text>

          {/* Keeps the title visually centered */}
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* ================= CONTENT ================= */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introContainer}>
            <Text style={styles.heading}>Why are you reporting this user?</Text>

            <Text style={styles.description}>
              Help us keep Eaglespress safe and respectful for everyone.
            </Text>
          </View>

          {/* ================= REPORT REASONS ================= */}

          <View
            style={styles.optionsContainer}
            accessibilityRole="radiogroup"
            accessibilityLabel="Select a reason for reporting this user"
          >
            {REPORT_OPTIONS.map(renderReportOption)}
          </View>
        </ScrollView>

        {/* ================= SUBMIT BUTTON ================= */}

        <View style={styles.footer}>
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={!selectedReason || reportMutation.isPending || !userId}
            accessibilityRole="button"
            accessibilityLabel="Submit report"
            accessibilityState={{
              disabled: !selectedReason || reportMutation.isPending || !userId,
              busy: reportMutation.isPending,
            }}
            style={({ pressed }) => [
              styles.submitButton,
              (!selectedReason || !userId) && styles.submitButtonDisabled,
              pressed &&
                selectedReason &&
                !reportMutation.isPending &&
                styles.submitButtonPressed,
            ]}
          >
            {reportMutation.isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ReportUser;

// ================= STYLES =================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Header

  header: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    position: "absolute",
    left: 60,
    right: 60,
    textAlign: "center",
    color: "#102DAA",
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  headerRightPlaceholder: {
    width: 44,
  },

  // Content

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  introContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 78,
    marginBottom: 35,
  },

  heading: {
    color: "#102DAA",
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.6,
    lineHeight: 31,
  },

  description: {
    color: "#6387D0",
    fontSize: 18,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 26,
    marginTop: 10,
    maxWidth: 390,
  },

  // Options

  optionsContainer: {
    paddingHorizontal: 28,
  },

  optionRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
  },

  optionPressed: {
    opacity: 0.65,
  },

  radioContainer: {
    width: 76,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 8,
  },

  radioOuter: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#1688F9",
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterSelected: {
    borderColor: "#087BFF",
  },

  radioInner: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#087BFF",
  },

  optionTextContainer: {
    flex: 1,
    minHeight: 60,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D8E5F8",
    paddingLeft: 8,
  },

  optionText: {
    color: "#101B78",
    fontSize: 19,
    fontWeight: "400",
    letterSpacing: -0.3,
  },

  // Submit button

  footer: {
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },

  submitButton: {
    height: 66,
    borderRadius: 40,
    backgroundColor: "#087BFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#087BFF",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  submitButtonDisabled: {
    opacity: 0.55,
  },

  submitButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});
