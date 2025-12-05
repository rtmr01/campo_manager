import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "./src/screens/DashboardScreen";
import AddInspectionScreen from "./src/screens/AddInspectionScreen";

export type RootStackParamList = {
  Dashboard: undefined;
  AddInspection: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "Arquivos de Inspeção" }}
        />
        <Stack.Screen
          name="AddInspection"
          component={AddInspectionScreen}
          options={{ title: "Adicionar Registro" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
