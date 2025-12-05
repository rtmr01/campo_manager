export const API_BASE = "http://192.168.0.20:5001"; // seu IP de casa

export async function fetchDashboard() {
  const resp = await fetch(`${API_BASE}/api/dashboard`);
  if (!resp.ok) throw new Error("Erro ao carregar dashboard");
  return resp.json();
}

export async function createFolder(name: string) {
  const form = new FormData();
  form.append("folder_name", name);
  const resp = await fetch(`${API_BASE}/api/folder`, {
    method: "POST",
    body: form,
  });
  return resp.json();
}

export async function deleteFolder(folderId: number) {
  const resp = await fetch(`${API_BASE}/api/folder/delete/${folderId}`);
  return resp.json();
}

export async function deleteInspection(id: number) {
  const resp = await fetch(`${API_BASE}/api/delete/${id}`);
  return resp.json();
}

export async function createInspection(formData: FormData) {
  const resp = await fetch(`${API_BASE}/api/add`, {
    method: "POST",
    body: formData,
  });
  return resp.json();
}
