import { useEffect, useState } from "react";
import { List, ActionPanel, Action } from "@raycast/api";
import { priorityNames } from "./helpers";

const BearerToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtYnYzNGVraDAwOTduYTJ1ZHl5YjgzNW8iLCJpYXQiOjE3NTYzMjI2NTMsImV4cCI6MTc1NjQwOTA1M30.dVhbRuB6omNqgoIu_kXMBcyhPMfQhZlD8QvCkh94fM0";

interface Task {
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

interface Project {
  id: string;
  name: string;
  description: string;
  isSprint: boolean;
  tasks: Task[];
}

export default function Command() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [totalTasks, setTotalTasks] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [inReview, setInReview] = useState(0);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(
          "https://tasks-back.ex24.dev/api/projects/with-tasks",
          {
            headers: { Authorization: `Bearer ${BearerToken}` },
          }
        );
        const data = await response.json() as { projects: Project[]; totalTasks: number };

        setProjects(data.projects);
        setTotalTasks(data.totalTasks);

        // Считаем статистику
        const tasks = data.projects.flatMap((p: Project) => p.tasks);
        setInProgress(tasks.filter((t: Task) => t.board.name === "В работе").length);
        setInReview(tasks.filter((t: Task) => t.board.name === "На проверке").length);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Поиск по проектам...">
      <List.Section title="Статистика">
        <List.Item title="Всего спринтов" subtitle={String(projects.length)} />
        <List.Item title="Всего задач" subtitle={String(totalTasks)} />
        <List.Item title="В работе" subtitle={String(inProgress)} />
        <List.Item title="На проверке" subtitle={String(inReview)} />
      </List.Section>

      {projects && projects.map((project: Project) => (
        <List.Section key={project.id} title={project.name} subtitle={project.description}>
          {project.tasks.map((task) => (
            <List.Item
              key={task.id}
              title={task.title}
              subtitle={task.assignee.name}
              accessories={[
                { tag: { value: task.board.name, color: task.board.color } },
                { text: `Приоритет: ${priorityNames[task.priority as keyof typeof priorityNames]}`}
              ]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser url={`https://tasks.ex24.dev/tasks/${task.id}`} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
