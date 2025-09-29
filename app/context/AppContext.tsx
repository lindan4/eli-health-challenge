// context/AppContext.tsx
import { Submission } from "@/lib/types";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
  submissions: Submission[];
  setSubmissions: (submissions: Submission[]) => void; // For replacing the whole list
  addSubmission: (submission: Submission) => void;    // For adding one new submission
  updateSubmission: (id: string, data: Partial<Submission>) => void;
  selectedImage: string | null;
  setSelectedImage: (uri: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const addSubmission = (submission: Submission) => {
    // Prepend new submissions to avoid duplicates with existing server data
    setSubmissions((prev) => [submission, ...prev.filter(s => s.id !== submission.id)]);
  };

  const updateSubmission = (id: string, data: Partial<Submission>) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );
  };

  return (
    <AppContext.Provider
      value={{
        submissions,
        setSubmissions,
        addSubmission,
        updateSubmission,
        selectedImage,
        setSelectedImage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};