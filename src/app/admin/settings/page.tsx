import { Info, Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const configurationRows = [
  { label: "Site name", value: "YellowRiver" },
  { label: "Public site content", value: "Managed in code" },
  { label: "Runtime configuration", value: "Managed by environment variables" },
  { label: "Admin editing", value: "Not enabled" },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Site Settings</h2>
        <p className="text-sm text-muted-foreground">
          Review how public site configuration is currently managed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="size-4" />
                Configuration Status
              </CardTitle>
              <CardDescription>
                Settings are visible here for admin reference only.
              </CardDescription>
            </div>
            <Badge variant="outline">Read-only</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border bg-muted/30 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Admin settings editing is not enabled yet. Public site values
                still come from source code and deployment configuration, so no
                changes can be saved from this page.
              </p>
            </div>
          </div>

          <Separator />

          <dl className="grid gap-4 sm:grid-cols-2">
            {configurationRows.map((row) => (
              <div key={row.label} className="space-y-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="text-sm font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
