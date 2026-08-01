"use client";

import {
  Button,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { Bell, CreditCard, Palette, Shield, User } from "lucide-react";

export function SettingsPanel() {
  return (
    <Tabs defaultValue="general" orientation="vertical" className="flex gap-4">
      <TabsList className="h-fit flex-col items-start gap-1">
        <TabsTrigger value="general" className="w-full justify-start gap-2">
          <User className="size-3.5" />
          General
        </TabsTrigger>
        <TabsTrigger value="appearance" className="w-full justify-start gap-2">
          <Palette className="size-3.5" />
          Appearance
        </TabsTrigger>
        <TabsTrigger value="notifications" className="w-full justify-start gap-2">
          <Bell className="size-3.5" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="account" className="w-full justify-start gap-2">
          <Shield className="size-3.5" />
          Account
        </TabsTrigger>
        <TabsTrigger value="billing" className="w-full justify-start gap-2">
          <CreditCard className="size-3.5" />
          Billing
        </TabsTrigger>
      </TabsList>

      <div className="min-w-0 flex-1">
        <TabsContent value="general" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input id="display-name" defaultValue="GMA Admin" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="language">Language</Label>
            <Input id="language" defaultValue="English" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" defaultValue="UTC" />
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">
                Toggle between light and dark themes.
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Compact mode</p>
              <p className="text-xs text-muted-foreground">
                Reduce spacing between elements.
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Animations</p>
              <p className="text-xs text-muted-foreground">
                Enable UI animations and transitions.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Push notifications</p>
              <p className="text-xs text-muted-foreground">
                Receive push notifications in your browser.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">
                Receive email updates about activity.
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Message sounds</p>
              <p className="text-xs text-muted-foreground">
                Play a sound for new messages.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </TabsContent>

        <TabsContent value="account" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" defaultValue="admin@gma.app" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              placeholder="Enter current password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
            />
          </div>
          <Button variant="outline" size="sm" className="w-fit">
            Change password
          </Button>
          <div className="border-t pt-4">
            <Button variant="destructive" size="sm" className="w-fit">
              Delete account
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="flex flex-col gap-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Free plan</p>
                <p className="text-xs text-muted-foreground">
                  Basic features, limited storage.
                </p>
              </div>
              <Button variant="outline" size="sm">
                Upgrade
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="payment-method">Payment method</Label>
            <Input id="payment-method" defaultValue="•••• 4242" disabled />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="billing-email">Billing email</Label>
            <Input id="billing-email" type="email" defaultValue="admin@gma.app" />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
