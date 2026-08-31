// Custom XMLHttpRequest wrapper for tracking upload progress
const getApiUrl = () => {
  const envUrl = import.meta.env.BACKEND_API_URL || import.meta.env.VITE_API_URL;
  if (!envUrl) return "http://localhost:8000";
  if (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) {
    return `http://${envUrl}`;
  }
  return envUrl;
};

export function uploadFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = localStorage.getItem("access_token");
    const baseUrl = getApiUrl();
    
    xhr.open("POST", `${baseUrl}/api/attachments/upload`);
    
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error("Invalid response format"));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.detail || "Upload failed"));
        } catch {
          reject(new Error(xhr.statusText || "Upload failed"));
        }
      }
    };
    
    xhr.onerror = () => reject(new Error("Network error"));
    
    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}
