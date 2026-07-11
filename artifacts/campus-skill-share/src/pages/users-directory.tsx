import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, User } from "lucide-react";

interface UserProfile {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
  university: string | null;
}

export default function UsersDirectoryPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUsers(data.users || data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.university?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-12 bg-card rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-card rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-bold mb-2">Explore People</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Find other students on Campus Skill Share
      </p>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or university..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p>
            {searchTerm ? "No users match your search." : "No users found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => (
            <Link
              key={user.id}
              href={`/user/${user.id}`}
              className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary transition-all hover:shadow-sm"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-lg font-bold">
                    {user.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {user.displayName}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {user.university || "No university"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
