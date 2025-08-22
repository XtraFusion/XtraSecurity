"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Search,
  BookOpen,
  HelpCircle,
  MessageSquare,
  ExternalLink,
  Play,
  FileText,
  Shield,
  Users,
  Container,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  Clock,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { isAuthenticated } from "@/lib/auth"

interface DocumentationSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  articles: DocumentationArticle[]
}

interface DocumentationArticle {
  id: string
  title: string
  description: string
  content: string
  category: string
  tags: string[]
  lastUpdated: string
  readTime: number
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
  notHelpful: number
}

interface SupportTicket {
  subject: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  email: string
  name: string
}

const documentationSections: DocumentationSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of using Secure Environment Manager",
    icon: <Play className="h-5 w-5" />,
    articles: [
      {
        id: "quick-start",
        title: "Quick Start Guide",
        description: "Get up and running in 5 minutes",
        content: `# Quick Start Guide

Welcome to Secure Environment Manager! This guide will help you get started quickly.

## Step 1: Create Your First Project
1. Navigate to the Dashboard
2. Click "Create Project"
3. Enter your project name and description
4. Select your initial branch (usually 'main')

## Step 2: Add Your First Secret
1. Open your project
2. Click "Add Secret"
3. Enter the secret key and value
4. Choose the appropriate environment
5. Add a description for documentation

## Step 3: Set Up Team Access
1. Go to the Teams page
2. Invite team members by email
3. Assign appropriate roles (Admin, Developer, Viewer)
4. Configure project-specific permissions

## Step 4: Enable Notifications
1. Visit the Notifications page
2. Create notification rules for important events
3. Set up delivery channels (email, Slack, etc.)
4. Test your notification setup

## Next Steps
- Set up secret rotation schedules
- Configure CI/CD integrations
- Review audit logs regularly
- Explore advanced features`,
        category: "getting-started",
        tags: ["beginner", "setup", "tutorial"],
        lastUpdated: "2024-01-15T10:00:00Z",
        readTime: 5,
      },
      {
        id: "first-project",
        title: "Creating Your First Project",
        description: "Step-by-step guide to project creation",
        content: `# Creating Your First Project

Projects are the foundation of organizing your secrets in Secure Environment Manager.

## What is a Project?
A project represents a logical grouping of secrets, typically corresponding to an application, service, or environment.

## Creating a Project
1. **Navigate to Dashboard**: From the main navigation, click on "Dashboard"
2. **Click Create Project**: Look for the "Create Project" button
3. **Fill in Details**:
   - **Name**: Choose a descriptive name (e.g., "Production API", "Mobile App")
   - **Description**: Add context about what this project contains
   - **Initial Branch**: Usually "main" or "master"

## Project Structure
Each project contains:
- **Branches**: Different versions of your secrets (main, staging, dev)
- **Secrets**: Key-value pairs for environment variables
- **Access Control**: Team member permissions
- **Audit Logs**: History of all changes

## Best Practices
- Use clear, descriptive project names
- Group related services together
- Set up proper branch structure early
- Document your secrets with descriptions`,
        category: "getting-started",
        tags: ["projects", "setup", "organization"],
        lastUpdated: "2024-01-14T15:30:00Z",
        readTime: 3,
      },
    ],
  },
  {
    id: "secrets-management",
    title: "Secrets Management",
    description: "Learn how to manage environment variables and secrets",
    icon: <Shield className="h-5 w-5" />,
    articles: [
      {
        id: "adding-secrets",
        title: "Adding and Managing Secrets",
        description: "How to add, edit, and organize your secrets",
        content: `# Adding and Managing Secrets

Secrets are the core of your environment management. Here's how to work with them effectively.

## Adding a New Secret
1. **Navigate to Project**: Open the project where you want to add the secret
2. **Select Branch**: Choose the appropriate branch (main, staging, dev)
3. **Click Add Secret**: Use the "Add Secret" button
4. **Fill in Details**:
   - **Key**: The environment variable name (e.g., DATABASE_URL)
   - **Value**: The actual secret value
   - **Description**: What this secret is used for
   - **Environment**: Production, Staging, or Development

## Secret Best Practices
- **Use descriptive keys**: DATABASE_URL instead of DB
- **Add descriptions**: Help your team understand what each secret does
- **Choose correct environment**: Properly categorize your secrets
- **Regular rotation**: Update secrets periodically for security

## Managing Existing Secrets
- **Edit**: Click the edit icon to modify values or descriptions
- **View History**: See all previous versions and changes
- **Copy Values**: Use the copy button to safely get secret values
- **Delete**: Remove secrets that are no longer needed

## Security Features
- **Masked Values**: Secrets are hidden by default
- **Version History**: Track all changes with rollback capability
- **Access Control**: Only authorized users can view/edit
- **Audit Logging**: All actions are logged for compliance`,
        category: "secrets",
        tags: ["secrets", "security", "management"],
        lastUpdated: "2024-01-13T09:15:00Z",
        readTime: 4,
      },
    ],
  },
  {
    id: "team-management",
    title: "Team Management",
    description: "Manage team members and permissions",
    icon: <Users className="h-5 w-5" />,
    articles: [
      {
        id: "inviting-users",
        title: "Inviting Team Members",
        description: "How to add users to your organization",
        content: `# Inviting Team Members

Collaboration is key to effective secret management. Here's how to invite and manage team members.

## Invitation Process
1. **Go to Teams Page**: Navigate to the Teams section
2. **Click Invite Member**: Use the "Invite Member" button
3. **Enter Details**:
   - **Email Address**: The user's work email
   - **Role**: Choose appropriate permissions
   - **Department**: Optional organizational grouping

## User Roles
- **Admin**: Full access to all features and settings
- **Developer**: Can view and edit secrets, limited admin functions
- **Viewer**: Read-only access to assigned projects

## Managing Invitations
- **Pending Invites**: Track who hasn't accepted yet
- **Resend Invites**: Send reminder emails
- **Cancel Invites**: Remove pending invitations
- **Role Changes**: Update permissions as needed

## Best Practices
- Use principle of least privilege
- Regularly review team access
- Remove users who no longer need access
- Use department groupings for organization`,
        category: "team",
        tags: ["team", "permissions", "collaboration"],
        lastUpdated: "2024-01-12T14:20:00Z",
        readTime: 3,
      },
    ],
  },
  {
    id: "integrations",
    title: "CI/CD Integrations",
    description: "Connect your pipelines and automate secret injection",
    icon: <Container className="h-5 w-5" />,
    articles: [
      {
        id: "github-actions",
        title: "GitHub Actions Integration",
        description: "Set up automatic secret injection for GitHub Actions",
        content: `# GitHub Actions Integration

Automatically inject secrets into your GitHub Actions workflows.

## Setup Process
1. **Create Integration**: Go to Integrations page and click "Add Integration"
2. **Choose GitHub Actions**: Select the integration type
3. **Configure Settings**:
   - **Repository**: owner/repository-name format
   - **Access Token**: GitHub personal access token with repo permissions
   - **Branch**: Target branch for integration

## Secret Injection Methods
- **Environment Variables**: Inject as workflow environment variables
- **Files**: Write secrets to files in the runner
- **GitHub Secrets**: Sync with GitHub repository secrets

## Workflow Configuration
Add this to your GitHub Actions workflow:

\`\`\`yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy with secrets
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}
          API_KEY: \${{ secrets.API_KEY }}
        run: |
          echo "Deploying with injected secrets"
\`\`\`

## Security Considerations
- Use minimal required permissions
- Regularly rotate access tokens
- Monitor integration logs
- Test in staging first`,
        category: "integrations",
        tags: ["github", "ci-cd", "automation"],
        lastUpdated: "2024-01-11T16:45:00Z",
        readTime: 6,
      },
    ],
  },
]

const faqs: FAQ[] = [
  {
    id: "1",
    question: "How do I reset my password?",
    answer:
      "You can reset your password by clicking the 'Forgot Password' link on the login page. You'll receive an email with instructions to create a new password.",
    category: "account",
    helpful: 45,
    notHelpful: 2,
  },
  {
    id: "2",
    question: "Can I export my secrets?",
    answer:
      "Yes, you can export secrets in various formats (JSON, ENV, YAML) from the project settings. Note that this requires admin permissions and is logged for security.",
    category: "secrets",
    helpful: 32,
    notHelpful: 1,
  },
  {
    id: "3",
    question: "How often should I rotate secrets?",
    answer:
      "We recommend rotating secrets every 90 days for production environments, or immediately if you suspect a compromise. You can set up automatic rotation schedules in the Secret Rotation section.",
    category: "security",
    helpful: 28,
    notHelpful: 0,
  },
  {
    id: "4",
    question: "What happens if I delete a secret by mistake?",
    answer:
      "Deleted secrets can be recovered from the audit logs within 30 days. Contact support immediately if you need to restore a deleted secret.",
    category: "secrets",
    helpful: 19,
    notHelpful: 1,
  },
  {
    id: "5",
    question: "How do I set up two-factor authentication?",
    answer:
      "Go to your Profile settings, click on Security, and enable Two-Factor Authentication. You can use an authenticator app or SMS for the second factor.",
    category: "security",
    helpful: 41,
    notHelpful: 0,
  },
]

export default function HelpPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("documentation")
  const [selectedArticle, setSelectedArticle] = useState<DocumentationArticle | null>(null)
  const [isArticleOpen, setIsArticleOpen] = useState(false)
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [supportTicket, setSupportTicket] = useState<SupportTicket>({
    subject: "",
    description: "",
    priority: "medium",
    category: "general",
    email: "",
    name: "",
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setIsLoading(false)
    }

    loadData()
  }, [router])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const filteredSections = documentationSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.articles.some(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
  )

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSubmitSupport = () => {
    if (!supportTicket.subject || !supportTicket.description || !supportTicket.email || !supportTicket.name) {
      setNotification({ type: "error", message: "Please fill in all required fields" })
      return
    }

    // Simulate ticket submission
    console.log("Support ticket submitted:", supportTicket)
    setSupportTicket({
      subject: "",
      description: "",
      priority: "medium",
      category: "general",
      email: "",
      name: "",
    })
    setIsSupportOpen(false)
    setNotification({ type: "success", message: "Support ticket submitted successfully. We'll get back to you soon!" })
  }

  const handleOpenArticle = (article: DocumentationArticle) => {
    setSelectedArticle(article)
    setIsArticleOpen(true)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <Alert
            className={`${notification.type === "error" ? "border-destructive" : "border-green-500"} animate-in slide-in-from-top-2 duration-300`}
          >
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Help & Documentation</h1>
            <p className="text-muted-foreground">Find answers, guides, and get support for Secure Environment Manager</p>
          </div>
          <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Contact Support
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Contact Support</DialogTitle>
                <DialogDescription>
                  Need help? Submit a support ticket and our team will get back to you as soon as possible.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={supportTicket.name}
                      onChange={(e) => setSupportTicket({ ...supportTicket, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={supportTicket.email}
                      onChange={(e) => setSupportTicket({ ...supportTicket, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={supportTicket.subject}
                    onChange={(e) => setSupportTicket({ ...supportTicket, subject: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={supportTicket.category}
                      onValueChange={(value) => setSupportTicket({ ...supportTicket, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Question</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing & Account</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="security">Security Concern</SelectItem>
                        <SelectItem value="integration">Integration Help</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={supportTicket.priority}
                      onValueChange={(value) => setSupportTicket({ ...supportTicket, priority: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide as much detail as possible about your issue or question..."
                    rows={5}
                    value={supportTicket.description}
                    onChange={(e) => setSupportTicket({ ...supportTicket, description: e.target.value })}
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSupportOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitSupport} className="w-full sm:w-auto">
                    Submit Ticket
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">Quick Start</h3>
                  <p className="text-sm text-muted-foreground">Get started in 5 minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium">API Docs</h3>
                  <p className="text-sm text-muted-foreground">REST API reference</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <ExternalLink className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium">Community</h3>
                  <p className="text-sm text-muted-foreground">Join our Discord</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium">Support</h3>
                  <p className="text-sm text-muted-foreground">Get help from our team</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation and FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="tutorials">Video Tutorials</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
          </TabsList>

          <TabsContent value="documentation" className="space-y-6">
            {filteredSections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">{section.icon}</div>
                    <div>
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.articles.map((article) => (
                      <Card
                        key={article.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleOpenArticle(article)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{article.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {article.readTime}min
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{article.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {article.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="faqs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Find quick answers to common questions</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          {faq.question}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <p className="text-muted-foreground">{faq.answer}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="capitalize">
                              {faq.category}
                            </Badge>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                {faq.helpful} helpful
                              </div>
                              {faq.notHelpful > 0 && (
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-orange-600" />
                                  {faq.notHelpful} not helpful
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutorials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription>Learn with step-by-step video guides</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      title: "Getting Started with Secure Environment Manager",
                      duration: "8:32",
                      description: "Complete walkthrough of setting up your first project",
                      thumbnail: "/placeholder.svg?height=180&width=320",
                    },
                    {
                      title: "Setting Up CI/CD Integrations",
                      duration: "12:15",
                      description: "Connect GitHub Actions and automate secret injection",
                      thumbnail: "/placeholder.svg?height=180&width=320",
                    },
                    {
                      title: "Advanced Secret Rotation",
                      duration: "6:45",
                      description: "Configure automatic secret rotation schedules",
                      thumbnail: "/placeholder.svg?height=180&width=320",
                    },
                    {
                      title: "Team Management Best Practices",
                      duration: "9:20",
                      description: "Organize teams and manage permissions effectively",
                      thumbnail: "/placeholder.svg?height=180&width=320",
                    },
                    {
                      title: "Security and Compliance",
                      duration: "11:05",
                      description: "Implement security best practices and audit compliance",
                      thumbnail: "/placeholder.svg?height=180&width=320",
                    },
                    {
                      title: "Troubleshooting Common Issues",
                      duration: "7:18",
                      description: "Solve the most common problems users encounter",
                      thumbnail: "/placeholder.svg?height=180&width=320",
                    },
                  ].map((video, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-0">
                        <div className="relative">
                          <img
                            src={video.thumbnail || "/placeholder.svg"}
                            alt={video.title}
                            className="w-full h-40 object-cover rounded-t-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-t-lg">
                            <div className="p-3 bg-white/90 rounded-full">
                              <Play className="h-6 w-6 text-gray-800" />
                            </div>
                          </div>
                          <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                            {video.duration}
                          </Badge>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium mb-2">{video.title}</h4>
                          <p className="text-sm text-muted-foreground">{video.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Get in touch with our support team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Email Support</div>
                      <div className="text-sm text-muted-foreground">support@secureenv.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Phone Support</div>
                      <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Business Hours</div>
                      <div className="text-sm text-muted-foreground">Mon-Fri, 9 AM - 6 PM EST</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Live Chat</div>
                      <div className="text-sm text-muted-foreground">Available during business hours</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Times</CardTitle>
                  <CardDescription>Expected response times by priority level</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Urgent</Badge>
                      <span className="text-sm">Critical issues</span>
                    </div>
                    <span className="text-sm font-medium\"> 1 hour</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        High
                      </Badge>
                      <span className="text-sm">Important issues</span>
                    </div>
                    <span className="text-sm font-medium\"> 4 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Medium</Badge>
                      <span className="text-sm">General questions</span>
                    </div>
                    <span className="text-sm font-medium\"> 24 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Low</Badge>
                      <span className="text-sm">Feature requests</span>
                    </div>
                    <span className="text-sm font-medium\"> 3 days</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
                <CardDescription>More ways to get help and stay updated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4 justify-start bg-transparent">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Status Page</div>
                        <div className="text-sm text-muted-foreground">System status & updates</div>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 justify-start bg-transparent">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Community Forum</div>
                        <div className="text-sm text-muted-foreground">Ask questions & share tips</div>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 justify-start bg-transparent">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Changelog</div>
                        <div className="text-sm text-muted-foreground">Latest features & fixes</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Article Dialog */}
        <Dialog open={isArticleOpen} onOpenChange={setIsArticleOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {selectedArticle?.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-4">
                <span>{selectedArticle?.description}</span>
                <Badge variant="outline">{selectedArticle?.readTime}min read</Badge>
              </DialogDescription>
            </DialogHeader>
            {selectedArticle && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap">{selectedArticle.content}</div>
                </div>
                <div className="text-sm text-muted-foreground border-t pt-4">
                  Last updated: {new Date(selectedArticle.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
