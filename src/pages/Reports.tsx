import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-3xl font-bold text-foreground">Performance Reports</h2>
          <p className="text-muted-foreground">
            Detailed analytics and insights from your interview sessions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Detailed performance reports and analytics will be available here soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}