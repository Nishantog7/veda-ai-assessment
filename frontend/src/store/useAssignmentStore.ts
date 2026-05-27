import { create } from 'zustand';

interface AssignmentState {
  assignments: any[];
  isLoading: boolean;
  fetchAssignments: () => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: [],
  isLoading: false,
  fetchAssignments: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('http://localhost:5000/api/assignments');
      const data = await response.json();
      if (Array.isArray(data)) set({ assignments: data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch", error);
      set({ isLoading: false });
    }
  },
  deleteAssignment: async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/assignment/${id}`, { method: 'DELETE' });
      
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== id)
      }));
    } catch (error) {
      console.error("Failed to delete", error);
    }
  }
}));