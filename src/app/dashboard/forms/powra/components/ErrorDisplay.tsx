"use client";

import { FC } from 'react';

interface ErrorDisplayProps {
  error?: string;
}

export const ErrorDisplay: FC<ErrorDisplayProps> = ({ error }): JSX.Element | null => {
  if (!error) return null;
  return (
    <p className="text-sm text-red-600">{error}</p>
  );
};

export default ErrorDisplay;
