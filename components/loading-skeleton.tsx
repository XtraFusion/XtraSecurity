import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function ProjectCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-16"></div>
          </div>
          <div className="h-8 w-8 bg-muted rounded"></div>
        </div>
        <div className="h-4 bg-muted rounded w-full mt-2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-muted rounded w-20"></div>
          <div className="h-4 bg-muted rounded w-20"></div>
        </div>
        <div className="h-3 bg-muted rounded w-32"></div>
        <div className="flex gap-1">
          <div className="h-5 bg-muted rounded w-12"></div>
          <div className="h-5 bg-muted rounded w-8"></div>
          <div className="h-5 bg-muted rounded w-16"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="p-4">
        <div className="h-4 bg-muted rounded w-32"></div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-6 bg-muted rounded w-24"></div>
          <div className="h-4 w-4 bg-muted rounded"></div>
          <div className="h-4 w-4 bg-muted rounded"></div>
        </div>
      </td>
      <td className="p-4">
        <div className="h-5 bg-muted rounded w-20"></div>
      </td>
      <td className="p-4">
        <div className="space-y-1">
          <div className="h-3 bg-muted rounded w-24"></div>
          <div className="h-3 bg-muted rounded w-16"></div>
        </div>
      </td>
      <td className="p-4">
        <div className="h-4 w-4 bg-muted rounded"></div>
      </td>
    </tr>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
        </div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
      </div>

      {/* Search skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 bg-muted rounded w-80 animate-pulse"></div>
        <div className="flex gap-4">
          <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
        </div>
      </div>

      {/* Projects grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
