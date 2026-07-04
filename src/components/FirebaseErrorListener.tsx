// src/components/FirebaseErrorListener.tsx
'use client';

import React, { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

// This component should be placed high in your component tree,
// ideally within your main Firebase provider.
export default function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: Error) => {
      if (!(error instanceof FirestorePermissionError)) {
        // Safety guard – should never happen, but keeps TS happy
        console.error("Unknown error received:", error);
        return;
      }
    
      console.error(
        "Firestore Permission Error Caught:",
        JSON.stringify(error, null, 2)
      );

      // In a development environment, we previously threw an error.
      // However, to prevent unintended page crashes during transient auth states (e.g. opening multiple tabs),
      // we now just log it and show a toast if it persists.
      if (process.env.NODE_ENV === 'development') {
        console.warn("Firestore Permission Error (Dev Mode):", error.message, error.path);
      }
      
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to perform this action. If this persists, please try refreshing.',
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return null; // This component does not render anything.
}
