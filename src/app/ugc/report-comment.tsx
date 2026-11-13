import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  hideComment: boolean;
}

interface SubmitReportResponse {
  message?: string;
  error?: string;
  reportId?: string;
  hidden?: boolean;
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

const ReportComment = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    commentId: commentIdParam,
    reportedUserId: reportedUserIdParam,
    contentType: contentTypeParam,
  } = useLocalSearchParams<{
    commentId?: string;
    reportedUserId?: string;
    contentType?: string;
  }>();

  // Normalize route parameters.
  const commentId = Array.isArray(commentIdParam)
    ? commentIdParam[0]
    : commentIdParam;

  const reportedUserId = Array.isArray(reportedUserIdParam)
    ? reportedUserIdParam[0]
    : reportedUserIdParam;

  const contentType = Array.isArray(contentTypeParam)
    ? contentTypeParam[0]
    : contentTypeParam;

  // ================= FORM STATE =================

  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
    null,
  );

  const [hideComment, setHideComment] = useState(false);

  // ================= SUBMIT REPORT API =================

  const submitReport = useCallback(
    async ({
      targetId,
      reason,
      hideComment,
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
          targetType: "comment",
          targetId,
          reason,
          hideComment,
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

      if (responseData?.error) {
        throw new Error(responseData.error);
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

  const handleSubmit = useCallback(() => {
    if (!commentId?.trim()) {
      Alert.alert(
        "Unable to submit report",
        "The comment ID could not be found. Please go back and try again.",
      );
      return;
    }

    if (contentType !== "comment") {
      Alert.alert(
        "Unable to submit report",
        "Invalid report type. Please go back and try again.",
      );
      return;
    }

    if (!selectedReason) {
      Alert.alert(
        "Select a reason",
        "Please select a reason for reporting this comment.",
      );
      return;
    }

    if (reportMutation.isPending) {
      return;
    }

    const payload: SubmitReportParams = {
      targetId: commentId,
      reason: selectedReason,
      hideComment,
    };

    // Display successful submission.
    async function showSuccess(result: SubmitReportResponse) {
      // Refresh comment and reply queries only when the backend
      // confirms that this comment was successfully hidden.
      if (result.hidden === true) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["comments"],
          }),

          queryClient.invalidateQueries({
            queryKey: ["replies"],
          }),
        ]);
      }

      let message =
        result.message || "Your report has been submitted successfully.";

      if (result.hidden) {
        message += "\n\nThis comment has also been hidden from your view.";
      }

      Alert.alert("Report Submitted", message, [
        {
          text: "Done",
          onPress: () => router.back(),
        },
      ]);
    }

    // Display errors and allow retrying the same submission.
    function showError(error: Error) {
      Alert.alert(
        "Report Failed",
        error.message || "Something went wrong while submitting your report.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Retry",
            onPress: () => {
              reportMutation.mutate(payload, {
                onSuccess: showSuccess,
                onError: showError,
              });
            },
          },
        ],
      );
    }

    void reportMutation.mutateAsync(payload).then(showSuccess, showError);
  }, [
    commentId,
    contentType,
    selectedReason,
    hideComment,
    reportMutation.isPending,
    reportMutation.mutate,
    reportMutation.mutateAsync,
    queryClient,
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
            <ChevronLeft size={34} color="#101B9B" strokeWidth={2.5} />
          </Pressable>

          <Text style={styles.headerTitle}>Report Comment</Text>

          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* ================= CONTENT ================= */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Introduction */}

          <View style={styles.introContainer}>
            <Text style={styles.heading}>Why are you reporting this?</Text>

            <Text style={styles.description}>
              Help us keep Eaglespress safe and respectful for everyone.
            </Text>
          </View>

          {/* ================= REPORT REASONS ================= */}

          <View
            style={styles.optionsContainer}
            accessibilityLabel="Select a reason for reporting this comment"
          >
            {REPORT_OPTIONS.map(renderReportOption)}
          </View>

          {/* ================= HIDE COMMENT CHECKBOX ================= */}

          <Pressable
            onPress={() => setHideComment((previous) => !previous)}
            disabled={reportMutation.isPending}
            accessibilityRole="checkbox"
            accessibilityLabel="Hide Comment"
            accessibilityState={{
              checked: hideComment,
              disabled: reportMutation.isPending,
            }}
            style={({ pressed }) => [
              styles.hideCommentContainer,
              pressed && styles.optionPressed,
            ]}
          >
            <View style={styles.checkboxContainer}>
              <View
                style={[
                  styles.checkbox,
                  hideComment && styles.checkboxSelected,
                ]}
              >
                {hideComment && (
                  <View style={styles.checkboxCheckmark}>
                    <View style={styles.checkmarkShort} />
                    <View style={styles.checkmarkLong} />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.hideCommentTextContainer}>
              <Text style={styles.hideCommentTitle}>Hide Comment</Text>

              <Text style={styles.hideCommentDescription}>
                This will hide this comment from your view.
              </Text>
            </View>
          </Pressable>
        </ScrollView>

        {/* ================= SUBMIT BUTTON ================= */}

        <View style={styles.footer}>
          <Pressable
            onPress={handleSubmit}
            disabled={!selectedReason || reportMutation.isPending || !commentId}
            accessibilityRole="button"
            accessibilityLabel="Submit report"
            accessibilityState={{
              disabled:
                !selectedReason || reportMutation.isPending || !commentId,
              busy: reportMutation.isPending,
            }}
            style={({ pressed }) => [
              styles.submitButton,
              (!selectedReason || !commentId) && styles.submitButtonDisabled,
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

export default ReportComment;

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
    color: "#101B9B",
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
    marginBottom: 30,
  },

  heading: {
    color: "#101B9B",
    fontSize: 25,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.7,
    lineHeight: 33,
  },

  description: {
    color: "#5874D4",
    fontSize: 18,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 26,
    marginTop: 10,
    maxWidth: 390,
  },

  // Report options

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

  // Hide comment checkbox

  hideCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 36,
    marginTop: 24,
    minHeight: 64,
  },

  checkboxContainer: {
    width: 76,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 8,
  },

  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#1688F9",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    backgroundColor: "#087BFF",
    borderColor: "#087BFF",
  },

  checkboxCheckmark: {
    width: 17,
    height: 17,
    position: "relative",
  },

  checkmarkShort: {
    position: "absolute",
    width: 6,
    height: 2.5,
    backgroundColor: "#FFFFFF",
    left: 1,
    top: 9,
    transform: [{ rotate: "45deg" }],
    borderRadius: 2,
  },

  checkmarkLong: {
    position: "absolute",
    width: 11,
    height: 2.5,
    backgroundColor: "#FFFFFF",
    left: 5,
    top: 7,
    transform: [{ rotate: "-48deg" }],
    borderRadius: 2,
  },

  hideCommentTextContainer: {
    flex: 1,
    justifyContent: "center",
  },

  hideCommentTitle: {
    color: "#101B78",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  hideCommentDescription: {
    color: "#5874D4",
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 21,
    marginTop: 3,
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
