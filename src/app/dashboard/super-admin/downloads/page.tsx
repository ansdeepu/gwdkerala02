import { DownloadsManager } from '@/components/downloads/DownloadsManager';

export default function SuperAdminDownloadsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Super Admin Downloads</h1>
      <DownloadsManager />
    </div>
  );
}
