'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RenewalFormSchema } from '@/lib/validations/renewal';
import { RenewalForm } from '@/types/renewal';
import { Button } from '@/components/ui/button';
import { generateFilledPdf } from '@/lib/pdfGenerator';
import AgencyForm from './AgencyForm';

export default function RenewalWizard() {
  const [step, setStep] = useState(0);
  const methods = useForm<RenewalForm>({
    resolver: zodResolver(RenewalFormSchema),
    defaultValues: {
      agency: {
        name: '',
        registrationNumber: '',
        district: '',
        address: '',
        phone: '',
        email: '',
        village: '',
        taluk: '',
        panchayat: '',
        state: '',
        pin: '',
        gstNumber: '',
        localBodyRegistrationNumber: '',
      },
      rigs: [],
    },
  });

  const onSubmit = async (data: RenewalForm) => {
    const pdfBytes = await generateFilledPdf(data);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Filled-Rig-Renewal-Form.pdf';
    link.click();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {step === 0 && <AgencyForm />}
        {/* ... */}
        
        <div className="flex justify-between mt-6">
          <Button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Previous
          </Button>
          {step === 0 && (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          )}
          {step > 0 && (
            <Button type="submit">
              Generate PDF
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
