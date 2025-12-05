import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import {
  API_BASE,
  fetchDashboard,
  deleteFolder,
  deleteInspection,
} from "../api/api";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

type Folder = {
  id: number;
  name: string;
};

type Inspection = {
  id: number;
  name: string;
  folder_name: string;
  created_at: string;
  dimensions_value: string;
  dimensions_unit: string;
  latitude?: string;
  longitude?: string;
};

export default function DashboardScreen({ navigation }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await fetchDashboard();
      setFolders(data.folders);
      setInspections(data.inspections);
    } catch (e) {
      console.log(e);
      Alert.alert("Erro", "Falha ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation]);

  function getInspectionsByFolder(folderName: string) {
    return inspections.filter((i) => i.folder_name === folderName);
  }

  function openAdd() {
    navigation.navigate("AddInspection");
  }

  function openCsv(id: number) {
    Alert.alert(
      "Download CSV",
      "Abra este link no navegador:",
      [
        {
          text: "OK",
          onPress: () =>
            console.log(`${API_BASE}/api/inspection/csv/${id}`),
        },
      ],
      { cancelable: true }
    );
  }

  function openPdf(id: number) {
    Alert.alert(
      "Download PDF",
      "Abra este link no navegador:",
      [
        {
          text: "OK",
          onPress: () =>
            console.log(`${API_BASE}/api/inspection/pdf/${id}`),
        },
      ],
      { cancelable: true }
    );
  }

  async function handleDeleteInspection(id: number) {
    await deleteInspection(id);
    load();
  }

  async function handleDeleteFolder(id: number) {
    await deleteFolder(id);
    load();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={openAdd}>
        <Text style={styles.addButtonText}>+ Novo Registro</Text>
      </TouchableOpacity>

      <FlatList
        data={folders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const folderInspections = getInspectionsByFolder(item.name);
          return (
            <View style={styles.folderCard}>
              <View style={styles.folderHeader}>
                <Text style={styles.folderName}>{item.name}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteFolder(item.id)}
                >
                  <Text style={styles.deleteText}>Excluir Pasta</Text>
                </TouchableOpacity>
              </View>

              {folderInspections.length === 0 ? (
                <Text style={styles.emptyText}>0 registros</Text>
              ) : (
                folderInspections.map((ins) => (
                  <View key={ins.id} style={styles.inspectionRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inspectionName}>{ins.name}</Text>
                      <Text style={styles.inspectionMeta}>
                        {new Date(ins.created_at).toLocaleDateString()} •{" "}
                        {ins.dimensions_value} {ins.dimensions_unit}
                      </Text>
                    </View>
                    <View style={styles.inspectionActions}>
                      <TouchableOpacity onPress={() => openCsv(ins.id)}>
                        <Text style={styles.actionText}>CSV</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openPdf(ins.id)}>
                        <Text style={styles.actionText}>PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteInspection(ins.id)}
                      >
                        <Text style={styles.deleteText}>Del</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  addButton: {
    backgroundColor: "#0066ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "600" },
  folderCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  folderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  folderName: { fontSize: 16, fontWeight: "700" },
  emptyText: { color: "#999" },
  inspectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderColor: "#eee",
  },
  inspectionName: { fontSize: 14, fontWeight: "600" },
  inspectionMeta: { fontSize: 12, color: "#666" },
  inspectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionText: { color: "#0066ff", marginHorizontal: 4 },
  deleteText: { color: "#ff4444", marginHorizontal: 4 },
});
