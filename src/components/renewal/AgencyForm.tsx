'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export default function AgencyForm() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <FormField control={control} name="agency.name" render={({ field }) => (
        <FormItem><FormLabel>1. ഏജൻസിയുടെ പേര് (Agency Name)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={control} name="agency.registrationNumber" render={({ field }) => (
        <FormItem><FormLabel>2. നിലവിലെ രജിസ്ട്രേഷൻ നമ്പർ (Current Registration Number)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={control} name="agency.district" render={({ field }) => (
        <FormItem><FormLabel>3. ഏജൻസി രജിസ്റ്റർ ചെയ്തിട്ടുള്ള ജില്ല (District)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={control} name="agency.address" render={({ field }) => (
        <FormItem><FormLabel>4. മേൽവിലാസം (Address)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={control} name="agency.phone" render={({ field }) => (
        <FormItem><FormLabel>5. ഫോൺ നമ്പർ (Phone)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={control} name="agency.email" render={({ field }) => (
        <FormItem><FormLabel>6. ഇമെയിൽ വിലാസം (Email)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control} name="agency.village" render={({ field }) => (
            <FormItem><FormLabel>വില്ലേജ് (Village)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="agency.taluk" render={({ field }) => (
            <FormItem><FormLabel>താലൂക്ക് (Taluk)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control} name="agency.panchayat" render={({ field }) => (
            <FormItem><FormLabel>പഞ്ചായത്ത് (Panchayat)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="agency.pin" render={({ field }) => (
            <FormItem><FormLabel>പിൻ കോഡ് (Pin Code)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={control} name="agency.gstNumber" render={({ field }) => (
        <FormItem><FormLabel>7. ജി.എസ്.ടി. നമ്പർ (GST Number)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={control} name="agency.localBodyRegistrationNumber" render={({ field }) => (
        <FormItem><FormLabel>8. തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം നൽകിയ രജിസ്ട്രേഷൻ നമ്പർ (Local Body Reg No)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
    </div>
  );
}
