import ProtectedLayout from "@/components/ProtectedLayout";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <ProtectedLayout>
      <Tabs />
    </ProtectedLayout>
  );
}
