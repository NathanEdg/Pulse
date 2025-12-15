import { db } from "./index";
import { program } from "./programs";
import { cycle } from "./cycles";
import { project } from "./projects";
import { user } from "./schema";
import { task, taskDependency } from "./tasks";

const SEED_PROGRAM_ID = "program-seed-1";
const SEED_USER_ID_1 = "user-seed-1";
const SEED_USER_ID_2 = "user-seed-2";
const SEED_PROJECT_ID_1 = "project-seed-1";
const SEED_PROJECT_ID_2 = "project-seed-2";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create Users
  console.log("Creating users...");
  await db
    .insert(user)
    .values([
      {
        id: SEED_USER_ID_1,
        name: "Alice Engineer",
        email: "alice@example.com",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
      },
      {
        id: SEED_USER_ID_2,
        name: "Bob Manager",
        email: "bob@example.com",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
      },
    ])
    .onConflictDoNothing();

  // 2. Create Program
  console.log("Creating program...");
  await db
    .insert(program)
    .values({
      id: SEED_PROGRAM_ID,
      name: "Core Product Engineering",
      description: "Main engineering delivery program",
      active: true,
    })
    .onConflictDoNothing();

  // 3. Create Projects
  console.log("Creating projects...");
  await db
    .insert(project)
    .values([
      {
        id: SEED_PROJECT_ID_1,
        program_id: SEED_PROGRAM_ID,
        name: "Frontend Revamp",
        description: "Modernizing the UI/UX",
        lead_id: SEED_USER_ID_1,
        sort_order: 1,
        color: "#3b82f6", // blue-500
      },
      {
        id: SEED_PROJECT_ID_2,
        program_id: SEED_PROGRAM_ID,
        name: "API Scalability",
        description: "Improving backend performance",
        lead_id: SEED_USER_ID_2,
        sort_order: 2,
        color: "#10b981", // emerald-500
      },
    ])
    .onConflictDoNothing();

  // 4. Create Cycles
  console.log("Creating cycles...");
  const today = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  const oneWeekFromNow = new Date(today);
  oneWeekFromNow.setDate(today.getDate() + 7);
  const threeWeeksFromNow = new Date(today);
  threeWeeksFromNow.setDate(today.getDate() + 21);

  const cycle1Id = "cycle-seed-1";
  const cycle2Id = "cycle-seed-2";
  const cycle3Id = "cycle-seed-3";

  await db
    .insert(cycle)
    .values([
      {
        id: cycle1Id,
        program_id: SEED_PROGRAM_ID,
        cycle_number: "1",
        start_date: twoWeeksAgo,
        end_date: oneWeekAgo,
        goal: "Foundation work",
        status: "completed",
      },
      {
        id: cycle2Id,
        program_id: SEED_PROGRAM_ID,
        cycle_number: "2",
        start_date: oneWeekAgo,
        end_date: oneWeekFromNow,
        goal: "Feature implementation",
        status: "active",
      },
      {
        id: cycle3Id,
        program_id: SEED_PROGRAM_ID,
        cycle_number: "3",
        start_date: oneWeekFromNow,
        end_date: threeWeeksFromNow,
        goal: "Polish and Release",
        status: "planned",
      },
    ])
    .onConflictDoNothing();

  // 5. Create Tasks
  console.log("Creating tasks...");
  const task1Id = "task-seed-1";
  const task2Id = "task-seed-2";
  const task3Id = "task-seed-3";
  const task4Id = "task-seed-4";
  const task5Id = "task-seed-5";

  await db
    .insert(task)
    .values([
      {
        id: task1Id,
        program_id: SEED_PROGRAM_ID,
        cycle_id: cycle1Id,
        project_id: SEED_PROJECT_ID_1,
        title: "Design System Audit",
        description: "Review existing components",
        lead_id: SEED_USER_ID_1,
        assignees_ids: [SEED_USER_ID_1],
        status: "done",
        priority: "medium",
        tags: ["design", "audit"],
        depends_on: [],
        start_date: twoWeeksAgo,
        due_date: new Date(twoWeeksAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
        subtasks_ids: [],
      },
      {
        id: task2Id,
        program_id: SEED_PROGRAM_ID,
        cycle_id: cycle1Id,
        project_id: SEED_PROJECT_ID_2,
        title: "Database Schema Design",
        description: "Plan the new schema",
        lead_id: SEED_USER_ID_2,
        assignees_ids: [SEED_USER_ID_2],
        status: "done",
        priority: "high",
        tags: ["backend", "db"],
        depends_on: [],
        start_date: new Date(twoWeeksAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
        due_date: oneWeekAgo,
        subtasks_ids: [],
      },
      {
        id: task3Id,
        program_id: SEED_PROGRAM_ID,
        cycle_id: cycle2Id,
        project_id: SEED_PROJECT_ID_1,
        title: "Implement New Button Component",
        description: "Create the button component based on new design",
        lead_id: SEED_USER_ID_1,
        assignees_ids: [SEED_USER_ID_1, SEED_USER_ID_2],
        status: "in-progress",
        priority: "medium",
        tags: ["frontend", "ui"],
        depends_on: [task1Id],
        start_date: oneWeekAgo,
        due_date: new Date(oneWeekAgo.getTime() + 4 * 24 * 60 * 60 * 1000),
        subtasks_ids: [],
      },
      {
        id: task4Id,
        program_id: SEED_PROGRAM_ID,
        cycle_id: cycle2Id,
        project_id: SEED_PROJECT_ID_2,
        title: "API Endpoint Implementation",
        description: "Implement the user endpoints",
        lead_id: SEED_USER_ID_2,
        assignees_ids: [SEED_USER_ID_2],
        status: "todo",
        priority: "high",
        tags: ["backend", "api"],
        depends_on: [task2Id],
        start_date: new Date(oneWeekAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
        due_date: oneWeekFromNow,
        subtasks_ids: [],
      },
      {
        id: task5Id,
        program_id: SEED_PROGRAM_ID,
        cycle_id: cycle3Id,
        project_id: SEED_PROJECT_ID_1,
        title: "Integration Testing",
        description: "Test frontend with backend",
        lead_id: SEED_USER_ID_1,
        assignees_ids: [SEED_USER_ID_1, SEED_USER_ID_2],
        status: "todo",
        priority: "high",
        tags: ["qa"],
        depends_on: [task3Id, task4Id],
        start_date: oneWeekFromNow,
        due_date: threeWeeksFromNow,
        subtasks_ids: [],
      },
    ])
    .onConflictDoNothing();

  // 6. Create Task Dependencies (Relation Table)
  console.log("Creating task dependencies...");
  await db
    .insert(taskDependency)
    .values([
      { task_id: task3Id, dependency_id: task1Id },
      { task_id: task4Id, dependency_id: task2Id },
      { task_id: task5Id, dependency_id: task3Id },
      { task_id: task5Id, dependency_id: task4Id },
    ])
    .onConflictDoNothing();

  console.log("✅ Seed completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
