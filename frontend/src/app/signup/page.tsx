'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const router = useRouter();
  const { registerOrganization, loading, error } = useAuth();
  
  const [countries, setCountries] = useState<any[]>([]);
  const [fetchingCountries, setFetchingCountries] = useState(true);

  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    email: '',
    password: '',
    baseCurrency: 'USD'
  });

  useEffect(() => {
    // Dynamically fetch from restcountries.com 
    const fetchCountries = async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
        const data = await res.json();
        
        const parsedList = data.map((c: any) => {
          const currencyCode = c.currencies ? Object.keys(c.currencies)[0] : 'USD';
          return {
            name: c.name.common,
            code: currencyCode
          };
        }).sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setCountries(parsedList);
        setFormData(prev => ({ ...prev, baseCurrency: parsedList[0]?.code || 'USD' }));
      } catch (err) {
        console.error('Failed to load countries', err);
      } finally {
        setFetchingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        companyName: formData.companyName,
        baseCurrency: formData.baseCurrency,
        user: {
          name: formData.adminName,
          email: formData.email,
          password: formData.password
        }
      };
      // Hit backend generic API Route
      await registerOrganization(payload);
      router.push('/login'); // Successfully created, now login
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-center mb-2">Register Organization</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Set up your company workspace</p>
        
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" name="companyName" required value={formData.companyName} onChange={handleChange} placeholder="Nexus Enterprise Solutions" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseCurrency">Company Headquarters Location</Label>
            <select 
              id="baseCurrency" 
              name="baseCurrency" 
              value={formData.baseCurrency} 
              onChange={handleChange}
              disabled={fetchingCountries} // Wait for it to load
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {fetchingCountries ? <option>Loading standard countries...</option> : null}
              {countries.map((c, i) => (
                <option key={i} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminName">Admin Contact Name</Label>
            <Input id="adminName" name="adminName" required value={formData.adminName} onChange={handleChange} placeholder="Ashley Admin" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="ashley.admin@company.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Admin Password</Label>
            <Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} />
          </div>
          
          <Button type="submit" className="w-full mt-4" disabled={loading || fetchingCountries}>
            {loading ? 'Registering System...' : 'Create Workspace'}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          Already registered?{' '}
          <button onClick={() => router.push('/login')} className="text-primary hover:underline font-medium">Log back in</button>
        </div>
      </div>
    </div>
  );
}
