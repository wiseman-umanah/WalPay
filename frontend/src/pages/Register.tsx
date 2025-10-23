import React, { useState } from 'react';

const RegistrationForm = () => {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');

  // Check if the form is valid (all fields are filled)
  const isFormValid = businessName && email && country;


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here (wallet address, country, business details)
    console.log({ businessName, email, country });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white w-full max-w-md p-8 rounded-lg shadow-lg border border-slate-200">
        <h2 className="text-2xl font-semibold text-center text-gray-900">Register Your Business</h2>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="business-name" className="text-sm text-gray-600">Business Name</label>
            <input
              id="business-name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-gray-600">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="country" className="text-sm text-gray-600">Country</label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="" disabled>Select your country</option>
              <option value="Nigeria">Nigeria</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              {/* Add more country options as needed */}
            </select>
          </div>


          <button
            type="submit"
            disabled={!isFormValid} // Disable button if form is not filled
            className={`w-full py-3 rounded-md mt-4 transition-colors ${isFormValid ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
          >
            Create My Account
          </button>

          <div className="mt-4 text-sm text-center text-gray-600">
            By clicking the "Create My Account" button, you agree to WalletPay's <a href="#" className="text-green-500">terms of service</a> and <a href="#" className="text-green-500">privacy policy</a>.
          </div>

          <div className="mt-6 text-sm text-center">
            Already have an account? <a href="#" className="text-green-500">Sign in</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
