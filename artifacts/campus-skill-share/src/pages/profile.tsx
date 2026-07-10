import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  useGetMyProfile,
  useUpdateMyProfile,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { User, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMyProfileQueryKey } from "@workspace/api-client-react";

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: profile, isLoading: profileLoading } = useGetMyProfile({
    query: { enabled: isAuthenticated, queryKey: getGetMyProfileQueryKey() },
  });

  const updateProfile = useUpdateMyProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");

  // Initialize input when editing starts
  const startEditing = () => {
    setDisplayName(profile?.displayName || "");
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName === profile?.displayName) {
      setIsEditing(false);
      return;
    }

    updateProfile.mutate(
      {
        data: { displayName: displayName.trim() },
      },
      {
        onSuccess: () => {
          toast({ title: "Profile updated" });
          setIsEditing(false);
          queryClient.invalidateQueries({
            queryKey: getGetMyProfileQueryKey(),
          });
        },
        onError: (err) => {
          toast({
            title: "Error",
            description: err.message || "Failed to update",
            variant: "destructive",
          });
        },
      },
    );
  };

  if (authLoading || !isAuthenticated) return null;

  if (profileLoading)
    return <div className="text-center py-20">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Your Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your campus identity.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="h-32 bg-primary/10"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-16 mb-6">
            <div className="w-32 h-32 rounded-full border-4 border-card bg-secondary flex items-center justify-center overflow-hidden shadow-md">
              {profile?.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            {profile?.role === "admin" && (
              <div className="bg-foreground text-background px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                Admin
              </div>
            )}
          </div>

          <div className="space-y-6">
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2"
                  >
                    {updateProfile.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg font-medium hover:bg-secondary/80"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold font-display">
                      {profile?.displayName}
                    </h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  <button
                    onClick={startEditing}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-border/50">
              <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">
                Account Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Joined</p>
                  <p className="font-medium">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString()
                      : "Recently"}
                  </p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Account Type
                  </p>
                  <p className="font-medium capitalize">{profile?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
