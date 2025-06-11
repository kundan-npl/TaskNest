import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const EmailSent = () => {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-lg text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h1>
      <p className="text-green-600 font-medium mb-4">
        {email
          ? <>If an account exists for <span className="font-semibold">{email}</span>, a password reset link has been sent.</>
          : 'If an account exists for your email, a password reset link has been sent.'}
      </p>
      <p className="text-gray-600 mb-6">
        Please check your inbox and follow the instructions to reset your password. If you don’t see the email, check your spam or junk folder.
      </p>
      <Link to="/auth/login" className="btn-primary inline-block">Back to Login</Link>
    </div>
  );
};

export default EmailSent;
