'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { Users, PhoneCall, CreditCard, Activity, Search, ShieldAlert } from 'lucide-react';
import { superAdminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const statsRes = await superAdminApi.getStats();
        const usersRes = await superAdminApi.getUsers();
        setStats(statsRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.error('Failed to fetch super admin data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const handleUpdateSubscription = async (userId: string, plan: string, status: string) => {
    try {
      await superAdminApi.updateSubscription(userId, plan, status);
      // Refresh users
      const usersRes = await superAdminApi.getUsers();
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to update subscription', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light text-foreground flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Super Admin <span className="font-semibold">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-light">Monitor platform usage and manage user subscriptions.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard title="Total Calls (Platform)" value={stats?.totalCalls || 0} icon={PhoneCall} color="text-purple-500" bg="bg-purple-500/10" />
        <StatCard title="Total Revenue" value={`$${stats?.totalRevenue || 0}`} icon={CreditCard} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard title="Active Subs" value={stats?.activeSubscriptions || 0} icon={Activity} color="text-orange-500" bg="bg-orange-500/10" />
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-xl font-light">Platform Users</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-muted-foreground text-sm font-medium">
                <th className="p-4 pl-6 font-light">Name</th>
                <th className="p-4 font-light">Email</th>
                <th className="p-4 font-light">Role</th>
                <th className="p-4 font-light">Joined</th>
                <th className="p-4 font-light">Subscription</th>
                <th className="p-4 font-light">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 pl-6 font-medium text-foreground">{u.name}</td>
                  <td className="p-4 text-muted-foreground text-sm">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.role === 'super_admin' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">{u.settings?.plan || 'Free'}</span>
                      <span className={`text-xs ${u.settings?.subscriptionStatus === 'active' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {u.settings?.subscriptionStatus || 'inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs font-light"
                        onClick={() => handleUpdateSubscription(u._id, 'Pro', 'active')}
                      >
                        Upgrade Pro
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs font-light text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleUpdateSubscription(u._id, 'Free', 'inactive')}
                      >
                        Revoke
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-light">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-light mb-1">{title}</p>
          <h3 className="text-3xl font-light text-foreground tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}
