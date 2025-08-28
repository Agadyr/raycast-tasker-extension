import { useEffect, useState } from "react";
import { List, ActionPanel, Action, getPreferenceValues} from "@raycast/api";
import { priorityNames } from "./helpers";

const BearerToken = getPreferenceValues<{ PUBLIC_BEARER_TOKEN: string }>().PUBLIC_BEARER_TOKEN;

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
  const [filter, setFilter] = useState<"all" | "sprint" | "not-sprint">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "В работе" | "На проверке" | "Готово" | "Бэклог">("all");

  const [totalTasks, setTotalTasks] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [inReview, setInReview] = useState(0);

  // Отладочная информация
  console.log(BearerToken);
  console.log("Command component rendered with:", { filter, statusFilter, projectsCount: projects.length });

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

  const filteredProjects = projects.filter((project) => {
    if (filter === "all") return true;
    if (filter === "sprint") return project.isSprint;
    if (filter === "not-sprint") return !project.isSprint;
    return true;
  }).map((project) => ({
    ...project,
    tasks: statusFilter === "all" 
      ? project.tasks 
      : project.tasks.filter((task) => task.board.name === statusFilter)
  }));

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Поиск по проектам..."
      searchBarAccessory={
        <List.Dropdown 
          tooltip="Фильтр по типу проекта"
          value={filter}
          onChange={(value) => {
            setFilter(value as "all" | "sprint" | "not-sprint");
          }}
        >
          <List.Dropdown.Item title="Все проекты" value="all" />
          <List.Dropdown.Item title="Только спринты" value="sprint" />
          <List.Dropdown.Item title="Не спринты" value="not-sprint" />
        </List.Dropdown>
      }
    >
      <List.Section title="Статистика">
        <List.Item title="Всего спринтов" subtitle={String(projects.length)} />
        <List.Item title="Всего задач" subtitle={String(totalTasks)} />
        <List.Item title="В работе" subtitle={String(inProgress)} />
        <List.Item title="На проверке" subtitle={String(inReview)} />
      </List.Section>

      <List.Section title="Фильтр по статусу">
        <List.Item 
          title="Все статусы" 
          accessories={[{ tag: { value: statusFilter === "all" ? "✓" : "", color: statusFilter === "all" ? "#00FF00" : "#666666" } }]}
          actions={
            <ActionPanel>
              <Action title="Выбрать" onAction={() => {
                console.log("Setting statusFilter to 'all'");
                setStatusFilter("all");
              }} />
            </ActionPanel>
          }
        />
        <List.Item 
          title="В работе" 
          accessories={[{ tag: { value: statusFilter === "В работе" ? "✓" : "", color: statusFilter === "В работе" ? "#00FF00" : "#666666" } }]}
          actions={
            <ActionPanel>
              <Action title="Выбрать" onAction={() => {
                console.log("Setting statusFilter to 'В работе'");
                setStatusFilter("В работе");
              }} />
            </ActionPanel>
          }
        />
        <List.Item 
          title="На проверке" 
          accessories={[{ tag: { value: statusFilter === "На проверке" ? "✓" : "", color: statusFilter === "На проверке" ? "#00FF00" : "#666666" } }]}
          actions={
            <ActionPanel>
              <Action title="Выбрать" onAction={() => {
                console.log("Setting statusFilter to 'На проверке'");
                setStatusFilter("На проверке");
              }} />
            </ActionPanel>
          }
        />
      </List.Section>

      {filteredProjects && filteredProjects.map((project: Project) => (
        <List.Section key={project.id} title={project.name} subtitle={project.description}>
          {project.tasks.map((task) => (
            <List.Item
              key={task.id}
              title={task.title}
              subtitle={task.assignee.name}
              accessories={[
                { tag: { value: task.board.name, color: task.board.color } },
                { text: `Приоритет: ${priorityNames[task.priority] || `Уровень ${task.priority}`}` }
              ]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser url={`https://ex-crm.com/tasks/${task.id}`} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
