import React from 'react';
import { supabase } from '../supabase';
import { useSession } from '../SessionContext';

const PricingPlans = () => {
  const { user } = useSession();

  const upgradeToPro = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, role: 'pro' });
      
      if (error) throw error;
      alert('Upgraded to Pro! You can now create unlimited events.');
    } catch (error: any) {
      alert('Upgrade failed: ' + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-xl font-bold mb-4">Standard</h3>
          <div className="text-3xl font-bold mb-4">Free</div>
          <ul className="space-y-2 mb-6">
            <li>✓ View nearby events</li>
            <li>✓ Get event tickets</li>
            <li>✓ Subscribe to 3 categories</li>
            <li>✗ Create events</li>
          </ul>
          <button className="w-full py-2 px-4 bg-gray-300 text-gray-600 rounded cursor-not-allowed">
            Current Plan
          </button>
        </div>

        <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
            Recommended
          </div>
          <h3 className="text-xl font-bold mb-4">Pro</h3>
          <div className="text-3xl font-bold mb-4">$9.99<span className="text-lg">/month</span></div>
          <ul className="space-y-2 mb-6">
            <li>✓ All Standard features</li>
            <li>✓ Create unlimited events</li>
            <li>✓ Event analytics</li>
            <li>✓ Priority support</li>
          </ul>
          <button 
            onClick={upgradeToPro}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;