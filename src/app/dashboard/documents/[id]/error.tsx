"use client";

import { useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../../../../components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function DocumentViewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Document view error:', error);
  }, [error]);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message === 'You do not have permission to view this document'
                ? 'You do not have permission to view this document.'
                : 'Failed to load the document. Please try again.'}
            </AlertDescription>
          </Alert>
          <Button onClick={reset} variant="outline">Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
