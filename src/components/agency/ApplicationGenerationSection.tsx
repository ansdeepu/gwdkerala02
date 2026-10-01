"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText, Download, Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { fillPdfForm } from "@/lib/pdfGenerator";

export default function ApplicationGenerationSection({ applicationData }: { applicationData: any }) {
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [template, setTemplate] = useState<File | null>(null);
    const [filledPdfUrl, setFilledPdfUrl] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setTemplate(file);
            toast({ title: "Template Uploaded", description: `${file.name} is ready.` });
        }
    };

    const handleGenerate = async () => {
        if (!template) return;
        setIsProcessing(true);
        try {
            const buffer = await template.arrayBuffer();
            // Map applicationData to PDF fields here based on your template's field names
            const dataToFill = {
                'name': applicationData.agencyName,
                'regNo': applicationData.agencyRegistrationNo,
                // ... map all other fields
            };
            const filledPdf = await fillPdfForm(buffer, dataToFill);
            const blob = new Blob([filledPdf], { type: 'application/pdf' });
            setFilledPdfUrl(URL.createObjectURL(blob));
            toast({ title: "PDF Generated", description: "You can now preview and download it." });
        } catch (e) {
            toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="border-l-4 border-l-teal-600 dark:border-l-teal-500 shadow-xs">
            <CardHeader>
                <CardTitle className="text-xl font-bold tracking-tight">6. Application Generation</CardTitle>
                <CardDescription>Upload PDF template and generate filled form.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-secondary/20">
                    <Input type="file" accept="application/pdf" onChange={handleFileChange} />
                    <Button onClick={handleGenerate} disabled={!template || isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4"/>}
                        Generate Filled Form
                    </Button>
                </div>
                {filledPdfUrl && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.open(filledPdfUrl, '_blank')}>
                            <Eye className="mr-2 h-4 w-4" /> Preview
                        </Button>
                        <Button onClick={() => {
                            const link = document.createElement('a');
                            link.href = filledPdfUrl;
                            link.download = 'filled-application.pdf';
                            link.click();
                        }}>
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
