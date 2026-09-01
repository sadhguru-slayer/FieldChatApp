// Custom XMLHttpRequest wrapper for tracking upload progress
const getApiUrl = () => {
  const envUrl = import.meta.env.BACKEND_API_URL || import.meta.env.VITE_API_URL;
  if (!envUrl) return "http://localhost:8000";
  if (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) {
    return `http://${envUrl}`;
  }
  return envUrl;
};

export function uploadFileWithProgress(file, onProgress, options = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = localStorage.getItem("access_token");
    const baseUrl = getApiUrl();
    
    let url = `${baseUrl}/api/attachments/upload`;
    const params = new URLSearchParams();
    if (typeof options === "string") {
      params.append("entity_id", options);
    } else if (options && typeof options === "object") {
      if (options.entity_id) params.append("entity_id", options.entity_id);
      if (options.custom_filename) params.append("custom_filename", options.custom_filename);
    }
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    xhr.open("POST", url);
    
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
