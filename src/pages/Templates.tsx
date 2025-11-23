import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Templates() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-3xl font-bold text-foreground">Interview Templates</h2>
          <p className="text-muted-foreground">
            Pre-built interview scenarios and question sets
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Interview templates and custom question sets will be available here soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}