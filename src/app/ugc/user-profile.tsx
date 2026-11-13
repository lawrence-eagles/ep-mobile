import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

const ReportProfile = () => {
  const { userId, userImage, userName } = useLocalSearchParams<{
    userId: string;
    userImage: string;
    userName: string;
  }>();

  return (
    <View>
      <Text>ReportProfile</Text>
      <Text>User ID: {userId}</Text>
      <Text>User Name: {userName}</Text>
    </View>
  );
};

export default ReportProfile;
