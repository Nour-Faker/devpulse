// frontend/src/components/LoginForm.tsx

import React from 'react';
import { Input, Button } from 'framer-motion';

const LoginForm: React.FC = () => {
  return (
    <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Login</h2>
      <form>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <Input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            required
            className="mt-1 p-2 border rounded w-full block"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <Input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            required
            className="mt-1 p-2 border rounded w-full block"
          />
        </div>
        <Button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Login
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
