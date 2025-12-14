export const UPDATE_TYPES = [
  "creation",
  "title-change",
  "description-change",
  "team-change",
  "status-change",
  "edit-assignee",
  "edit-lead",
  "priority-change",
  "tag-change",
  "date-change",
  "subtask-change",
  "icon-change",
] as const;

export type UpdateType = (typeof UPDATE_TYPES)[number];

interface EmptyPayload {}

interface TeamChangePayload {
  previousTeam: string;
  newTeam: string;
}

interface TitleChangePayload {
  previousTitle: string;
  newTitle: string;
}

interface StatusChangePayload {
  previousStatus: string;
  newStatus: string;
}

interface AssigneeChangePayload {
  action: "added" | "removed";
  assignee: string;
}

interface LeadChangePayload {
  action: "added" | "removed";
  lead: string;
}

interface PriorityChangePayload {
  previousPriority: string;
  newPriority: string;
}

interface DateChangePayload {
  previousStartDate?: string;
  newStartDate?: string;
  previousDueDate?: string;
  newDueDate?: string;
}

interface IconChangePayload {
  previousIcon: string;
  newIcon: string;
}

type UpdatePayloadMap = {
  creation: EmptyPayload;
  "title-change": TitleChangePayload;
  "team-change": TeamChangePayload;
  "description-change": EmptyPayload;
  "status-change": StatusChangePayload;
  "edit-assignee": AssigneeChangePayload;
  "edit-lead": LeadChangePayload;
  "priority-change": PriorityChangePayload;
  "tag-change": EmptyPayload;
  "date-change": DateChangePayload;
  "subtask-change": EmptyPayload;
  "icon-change": IconChangePayload;
};

export function createUpdateContent<T extends UpdateType>(
  type: T,
  params: UpdatePayloadMap[T],
): string {
  return JSON.stringify(params);
}
