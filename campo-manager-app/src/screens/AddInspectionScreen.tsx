import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { RootStackParamList } from "../../App";
import { API_BASE, createInspection, fetchDashboard } from "../api/api";

type Props = NativeStackScreenProps<RootStackParamList, "AddInspection">;

type Folder = { id: number; name: string };

type PickedImage = { uri: string };

export default function AddInspectionScreen({ navigation }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [dimValue, setDimValue] = useState("");
  const [dimUnit, setDimUnit] = useState("");
  const [obs, setObs] = useState("");

  const [jusantePhoto, setJusantePhoto] = useState<PickedImage | null>(null);
  const [montantePhoto, setMontantePhoto] = useState<PickedImage | null>(null);
  const [otherPhotos, setOtherPhotos] = useState<PickedImage[]>([]);

  useEffect(() => {
    (async () => {
      const data = await fetchDashboard();
      setFolders(data.folders);
      if (data.folders.length > 0) setFolderId(data.folders[0].id);
    })();
  }, []);

  async function pickImage(setter: (img: PickedImage) => void) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setter({ uri: asset.uri });
    }
  }

  async function pickExtra() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setOtherPhotos([
        ...otherPhotos,
        ...result.assets.map((a) => ({ uri: a.uri })),
      ]);
    }
  }

  async function handleSubmit() {
    try{
      if (!folderId) {
        Alert.alert("Erro", "Selecione uma pasta");
        return;
      }
      if (!jusantePhoto || !montantePhoto) {
        Alert.alert("Erro", "Fotos Jusante e Montante são obrigatórias");
        return;
      }

      const form = new FormData();
      form.append("folder_id", String(folderId));
      form.append("name", name);
      form.append("dim_value", dimValue);
      form.append("dim_unit", dimUnit);
      form.append("obs", obs);

      form.append("foto_jusante", {
        uri: jusantePhoto.uri,
        name: "jusante.jpg",
        type: "image/jpeg",
      } as any);

      form.append("foto_montante", {
        uri: montantePhoto.uri,
        name: "montante.jpg",
        type: "image/jpeg",
      } as any);

      otherPhotos.forEach((p, index) => {
        form.append("outras_fotos", {
          uri: p.uri,
          name: `extra_${index}.jpg`,
          type: "image/jpeg",
        } as any);
      });

      const resp = await createInspection(form);
      if (!resp.success) {
        Alert.alert("Erro", resp.message || "Falha ao criar registro");
        return;
      }

      Alert.alert("Sucesso", "Registro criado com sucesso");
      navigation.goBack();
    } catch (e) {
      console.log(e);
      Alert.alert("Erro", "Falha ao enviar registro");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Pasta de Arquivo</Text>
      <View style={styles.row}>
        {folders.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.folderChip,
              folderId === f.id && styles.folderChipSelected,
            ]}
            onPress={() => setFolderId(f.id)}
          >
            <Text
              style={
                folderId === f.id
                  ? styles.folderChipTextSelected
                  : styles.folderChipText
              }
            >
              {f.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Nome da Inspeção</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ex: Inspeção Tubo Principal - Rua A"
      />

      <Text style={styles.label}>Dimensões</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          value={dimValue}
          onChangeText={setDimValue}
          placeholder="Valor"
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={dimUnit}
          onChangeText={setDimUnit}
          placeholder="Unidade (mm, cm, m...)"
        />
      </View>

      <Text style={styles.label}>Foto Jusante *</Text>
      <TouchableOpacity
        style={styles.photoButton}
        onPress={() => pickImage((img) => setJusantePhoto(img))}
      >
        <Text style={styles.photoButtonText}>
          {jusantePhoto ? "Trocar Foto Jusante" : "Escolher Foto Jusante"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Foto Montante *</Text>
      <TouchableOpacity
        style={styles.photoButton}
        onPress={() => pickImage((img) => setMontantePhoto(img))}
      >
        <Text style={styles.photoButtonText}>
          {montantePhoto ? "Trocar Foto Montante" : "Escolher Foto Montante"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Outras Fotos</Text>
      <TouchableOpacity style={styles.photoButton} onPress={pickExtra}>
        <Text style={styles.photoButtonText}>
          {otherPhotos.length === 0
            ? "Adicionar Outras Fotos"
            : `Adicionar (+${otherPhotos.length})`}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Observações</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={obs}
        onChangeText={setObs}
        placeholder="Observações da inspeção"
        multiline
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Salvar Registro</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  label: { fontWeight: "600", marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  folderChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    marginBottom: 8,
  },
  folderChipSelected: {
    backgroundColor: "#0066ff",
    borderColor: "#0066ff",
  },
  folderChipText: { color: "#333" },
  folderChipTextSelected: { color: "#fff", fontWeight: "600" },
  photoButton: {
    backgroundColor: "#e0e7ff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  photoButtonText: { color: "#1d4ed8", fontWeight: "600" },
  submitButton: {
    marginTop: 20,
    backgroundColor: "#10b981",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 32,
  },
  submitButtonText: { color: "#fff", fontWeight: "700" },
});
