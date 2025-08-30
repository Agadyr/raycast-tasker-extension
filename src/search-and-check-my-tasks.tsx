import { useEffect, useState } from "react";
import { List, ActionPanel, Action, getPreferenceValues} from "@raycast/api";
import { priorityNames } from "./helpers";
import { Project, Task } from "./types";
import { environment } from "@raycast/api";

const preferences = getPreferenceValues<{ BEARER_TOKEN: string }>();
const BearerToken = preferences.BEARER_TOKEN;

export default function Command() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "В работе" | "На проверке" | "Готово" | "Бэклог">("all");
  const [error, setError] = useState<string | null>(null);

  const [totalTasks, setTotalTasks] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [inReview, setInReview] = useState(0);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setError(null);
        
        const response = await fetch(
          "https://tasks-back.ex24.dev/api/projects/with-tasks",
          {
            headers: { 
              Authorization: `Bearer ${BearerToken}`,
              'Content-Type': 'application/json'
            },
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          setError(`Ошибка API: ${response.status} - ${errorText}`);
          setProjects([]);
          setTotalTasks(0);
          return;
        }
        
        const data = await response.json() as { projects: Project[]; totalTasks: number };

        setProjects(data.projects);
        setTotalTasks(data.totalTasks);

        const tasks = data.projects.flatMap((p: Project) => p.tasks);
        setInProgress(tasks.filter((t: Task) => t.board.name === "В работе").length);
        setInReview(tasks.filter((t: Task) => t.board.name === "На проверке").length);
      } catch (error) {
        setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        setProjects([]);
        setTotalTasks(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const filteredProjects = projects.filter((project) => {
    if (filter === "all") {
      return true;
    } else {
      return project.id === filter;
    }
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
          onChange={(value) => { setFilter(value)}}
        >
          <List.Dropdown.Item title="Все проекты" value="all" />
          {projects.map((project) => (
            <List.Dropdown.Item key={project.id} title={project.name} value={project.id} />
          ))}
        </List.Dropdown>
      }
    >
      <List.Section title={`Статистика (Проект: ${environment.extensionName}, Автор: ${environment.ownerOrAuthorName}, Версия: ${environment.raycastVersion})`}>
        <List.Item title="Всего спринтов" subtitle={String(projects.length)} />
        <List.Item title="Всего задач" subtitle={String(totalTasks)} />
        <List.Item title="В работе" subtitle={String(inProgress)} />
        <List.Item title="На проверке" subtitle={String(inReview)} />
      </List.Section>

      {error && (
        <List.Section title="Ошибка">
          <List.Item 
            title="Проблема с подключением" 
            subtitle={error}
            accessories={[{ tag: { value: "Ошибка", color: "#FF0000" } }]}
          />
        </List.Section>
      )}

      <List.Section title="Фильтр по статусу">
        <List.Item 
          title="Все статусы" 
          accessories={[{ tag: { value: statusFilter === "all" ? "✓" : "", color: statusFilter === "all" ? "#00FF00" : "#666666" } }]}
          actions={
            <ActionPanel>
              <Action title="Выбрать" onAction={() => {
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
