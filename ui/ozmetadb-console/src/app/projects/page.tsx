"use client";

import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Plus, FolderOpen, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  // Demo projects data
  const projects = [
    { id: "1", name: "Customer Data Platform", status: "Active", lastModified: "2 hours ago", tables: 12, workflows: 3 },
    { id: "2", name: "Sales Analytics", status: "Draft", lastModified: "1 day ago", tables: 8, workflows: 1 },
    { id: "3", name: "Inventory Management", status: "Active", lastModified: "3 days ago", tables: 15, workflows: 5 },
  ];

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Manage your metadata projects and configurations
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{projects.length}</div>
                  <div className="text-xs text-muted-foreground">Total Projects</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{projects.filter(p => p.status === "Active").length}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{projects.filter(p => p.status === "Draft").length}</div>
                  <div className="text-xs text-muted-foreground">Drafts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              All Projects
            </CardTitle>
            <CardDescription>
              Click on a project to open it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full ${
                          project.status === "Active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                          {project.status}
                        </span>
                        <span>{project.tables} tables</span>
                        <span>{project.workflows} workflows</span>
                        <span>Modified {project.lastModified}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/projects/new"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Create New Project</h3>
                  <p className="text-xs text-muted-foreground">Start a new metadata project with the wizard</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
