import { DollarSign, ShoppingBag, TrendingUp, Star } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  // Mock data for charts
  const pieData = [
    { name: 'Verified', value: 35, color: '#10b981' },
    { name: 'Pending', value: 22, color: '#8b5cf6' },
    { name: 'Unclaimed', value: 26, color: '#3b82f6' },
    { name: 'Rejected', value: 17, color: '#ef4444' },
  ];

  const barData = [
    { name: 'Mon', orders: 120 }, { name: 'Tue', orders: 200 },
    { name: 'Wed', orders: 150 }, { name: 'Thu', orders: 265 },
    { name: 'Fri', orders: 180 }, { name: 'Sat', orders: 220 },
    { name: 'Sun', orders: 190 },
  ];

  const stats = [
    { title: 'Total Restaurants', value: '12', icon: ShoppingBag, color: 'bg-emerald-500', change: '+2 this month' },
    { title: 'Pending Verifications', value: '3', icon: TrendingUp, color: 'bg-purple-500', change: 'Needs action' },
    { title: 'Total Reviews', value: '245', icon: Star, color: 'bg-blue-500', change: '+18 this week' },
    { title: 'Avg. Rating', value: '4.8', icon: DollarSign, color: 'bg-red-500', change: '+0.2 from last month' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Restaurant Status</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-400">{item.name}</span>
                  <span className="font-bold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Weekly Profile Views</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="orders" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity / Trending */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">👤</div>
                <div>
                  <p className="font-medium text-sm">Customer {i}</p>
                  <div className="flex text-yellow-500 text-xs">★★★★★</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">"Great food and amazing service! Will definitely come back again."</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}