import ProtectedLayout from "@/components/ProtectedLayout";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <ProtectedLayout>
      <Tabs
        // i added this screenOptions
        screenOptions={{
          headerShown: false,
        }}
      />
    </ProtectedLayout>
  );
}
