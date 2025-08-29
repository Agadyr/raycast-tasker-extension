export interface Task {
    id: string;
    title: string;
    description: string | null;
    priority: number;
    assignee: {
      id: string;
      name: string;
      avatar: string | null;
    };
    board: {
      id: string;
      name: string;
      color: string;
    };
  }
  
  export interface Project {
    id: string;
    name: string;
    description: string;
    isSprint: boolean;
    tasks: Task[];
  }