export type Workspace = {
  id: string
  name: string
  isPrimary?: boolean
}

const workspaces: Workspace[] = [
  {
    id: "1",
    name: "Primary Workspace",
    isPrimary: true,
  },
  {
    id: "2",
    name: "Development",
  },
  {
    id: "3",
    name: "Staging",
  },
]

export const getWorkspaces = (): Workspace[] => {
  return workspaces
}

export const getWorkspaceById = (id: string): Workspace | undefined => {
  return workspaces.find((ws) => ws.id === id)
}

export const addWorkspace = (name: string): Workspace => {
  const newWorkspace: Workspace = {
    id: (workspaces.length + 1).toString(),
    name,
  }
  workspaces.push(newWorkspace)
  return newWorkspace
}
