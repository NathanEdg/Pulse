import Timeline, { type Task, type Cycle } from "@/components/Timeline";

const mockCycles: Cycle[] = [
  {
    id: "c1",
    number: 1,
    start_date: new Date(new Date().setDate(new Date().getDate() - 10)),
    end_date: new Date(new Date().setDate(new Date().getDate() - 4)),
  },
  {
    id: "c2",
    number: 2,
    start_date: new Date(new Date().setDate(new Date().getDate() - 3)),
    end_date: new Date(new Date().setDate(new Date().getDate() + 3)),
  },
  {
    id: "c3",
    number: 3,
    start_date: new Date(new Date().setDate(new Date().getDate() + 4)),
    end_date: new Date(new Date().setDate(new Date().getDate() + 10)),
  },
];

const mockTasks: Task[] = [
  {
    id: "1",
    title: "15 Qualified Prospects",
    start_date: new Date(new Date().setDate(new Date().getDate() - 5)),
    due_date: new Date(new Date().setDate(new Date().getDate() + 2)),
    status: "done",
    priority: "high",
    assignees_ids: ["user1"],
    project_id: "proj1",
    tags: ["sales"],
  },
  {
    id: "2",
    title: "Developer Survey Analysis",
    start_date: new Date(new Date().setDate(new Date().getDate() - 2)),
    due_date: new Date(new Date().setDate(new Date().getDate() + 5)),
    status: "in-progress",
    priority: "medium",
    assignees_ids: ["user2"],
    project_id: "proj1",
    tags: ["research"],
  },
  {
    id: "3",
    title: "MVP Development",
    start_date: new Date(),
    due_date: new Date(new Date().setDate(new Date().getDate() + 14)),
    status: "todo",
    priority: "high",
    assignees_ids: ["user1", "user3"],
    project_id: "proj2",
    tags: ["dev"],
  },
  {
    id: "4",
    title: "Q1 Marketing Strategy",
    start_date: new Date(new Date().setDate(new Date().getDate() + 5)),
    due_date: new Date(new Date().setDate(new Date().getDate() + 10)),
    status: "todo",
    priority: "low",
    assignees_ids: ["user4"],
    project_id: "proj3",
  },
  {
    id: "5",
    title: "Design System Update",
    start_date: new Date(new Date().setDate(new Date().getDate() - 10)),
    due_date: new Date(new Date().setDate(new Date().getDate() - 2)),
    status: "done",
    priority: "medium",
    assignees_ids: ["user5"],
    project_id: "proj1",
  },
];

export default function TimelinePage() {
  return (
    <div className="bg-background h-screen w-full overflow-hidden">
      <Timeline tasks={mockTasks} cycles={mockCycles} />
    </div>
  );
}
