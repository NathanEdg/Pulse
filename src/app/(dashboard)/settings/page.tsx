"use client"

import { SettingsContainer, type SettingsSection } from "@/components/dashboard/settings/settings-container"
import { TaskPriorityTable } from "@/components/dashboard/settings/task-management/priority-table"
import { TaskStatusTable } from "@/components/dashboard/settings/task-management/status-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
  const sections: SettingsSection[] = [
    {
      title: "Profile",
      description: "Manage your public profile information",
      settings: [
        {
          id: "name",
          content: (
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="Enter your name" defaultValue="John Doe" />
              <p className="text-sm text-muted-foreground">This is your public display name.</p>
            </div>
          ),
        },
        {
          id: "bio",
          content: (
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself"
                className="min-h-25"
                defaultValue="I'm a software developer passionate about building great products."
              />
              <p className="text-sm text-muted-foreground">Brief description for your profile.</p>
            </div>
          ),
        },
      ],
    },
    {
      title: "Notifications",
      description: "Configure how you receive notifications",
      settings: [
        {
          id: "email-notifications",
          content: (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive emails about your account activity</p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
          ),
        },
        {
          id: "push-notifications",
          content: (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
              </div>
              <Switch id="push-notifications" />
            </div>
          ),
        },
      ],
    },
    {
        title: "Task Management",
        description: "Customize task management settings",
        settings: [
            {
                id: "task-priorities",
                content: (
                    <div className="space-y-2">
                        <Label htmlFor="task-priorities">Task Priorities</Label>
                        <TaskPriorityTable />
                    </div>
                )
            },
            {
                id: "task-statuses",
                content: (
                    <div className="space-y-2">
                        <Label htmlFor="task-statuses">Task Statuses</Label>
                        <TaskStatusTable />
                    </div>
                )
            }
        ]
    },
    {
      title: "Account",
      description: "Manage your account settings and preferences",
      settings: [
        {
          id: "email",
          content: (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="your@email.com" defaultValue="john@example.com" />
            </div>
          ),
        },
        {
          id: "delete-account",
          content: (
            <div className="space-y-2">
              <Label className="text-destructive">Delete Account</Label>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          ),
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <SettingsContainer
        title="Settings"
        description="Manage program wide settings and preferences"
        sections={sections}
      />
    </div>
  )
}
