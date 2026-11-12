import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

const ReportProfile = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  return (
    <View>
      <Text>ReportProfile</Text>
      <Text>User ID: {userId}</Text>
    </View>
  );
};

export default ReportProfile;
