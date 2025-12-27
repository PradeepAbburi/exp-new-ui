import { useState, useCallback } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface UploadResponse {
  uploadURL: string;
  objectPath: string;
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Determine folder based on file type
        let folder = 'files';
        if (file.type.startsWith('image/')) {
          folder = 'images';
        } else if (file.type.startsWith('video/')) {
          folder = 'videos';
        } else if (
          file.type === 'application/pdf' ||
          file.type === 'application/msword' ||
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) {
          folder = 'documents';
        }

        const fileName = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `${folder}/${fileName}`);

        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise<UploadResponse | null>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(p);
            },
            (err) => {
              console.error('Upload error:', err);
              console.error('Upload error code:', err.code);
              console.error('Upload error message:', err.message);
              setError(err);
              options.onError?.(err);
              setIsUploading(false);
              resolve(null);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('Upload complete! URL:', downloadURL);
                const response = {
                  uploadURL: downloadURL,
                  objectPath: storageRef.fullPath,
                };
                options.onSuccess?.(response);
                setIsUploading(false);
                resolve(response);
              } catch (err) {
                console.error('Error getting download URL:', err);
                setError(err instanceof Error ? err : new Error('Failed to get download URL'));
                setIsUploading(false);
                resolve(null);
              }
            }
          );
        });

      } catch (err) {
        console.error('Upload failed with error:', err);
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        options.onError?.(error);
        setIsUploading(false);
        return null;
      }
    },
    [options]
  );

  return {
    uploadFile,
    isUploading,
    error,
    progress,
  };
}
