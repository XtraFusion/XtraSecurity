import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-hero/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-primary">Team Management Platform</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent  text-black dark:text-white">
                Welcome to Posse Point
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Create and manage multiple teams with role-based permissions. Streamline collaboration and project management across your organization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/teams">
                  <Button variant="hero" size="xl" className="gap-2 w-full sm:w-auto text-black dark:text-white">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Manage Teams
                  </Button>
                </a>
                <Button variant="outline" size="xl" className="gap-2 w-full sm:w-auto">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything you need to manage teams</h2>
          <p className="text-muted-foreground text-lg">Powerful features designed for modern team collaboration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg bg-gradient-card border border-primary/20">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-Team Management</h3>
            <p className="text-muted-foreground">Create and organize multiple teams with custom roles and permissions</p>
          </div>

          <div className="text-center p-6 rounded-lg bg-gradient-card border border-primary/20">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-lg mb-4">
              <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
            <p className="text-muted-foreground">Granular permissions with owner, admin, developer, and viewer roles</p>
          </div>

          <div className="text-center p-6 rounded-lg bg-gradient-card border border-primary/20">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-info/10 rounded-lg mb-4">
              <svg className="h-6 w-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Collaboration</h3>
            <p className="text-muted-foreground">Invite members, manage projects, and collaborate seamlessly</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;