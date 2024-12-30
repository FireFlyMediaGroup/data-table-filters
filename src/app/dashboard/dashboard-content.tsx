'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SimplifiedDocumentTable } from '../../components/dashboard/simplified-document-table';
import { DocumentSchema } from './documents/schema';
import { fetchDocuments, approveDocument, deleteDocument } from './documents/actions';
import { toast } from 'sonner';

interface DashboardContentProps {
  userRole: string;
}

export function DashboardContent({ userRole }: DashboardContentProps) {
  const [documents, setDocuments] = useState<DocumentSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (error) {
      toast.error('Failed to load documents');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleView = async (document: DocumentSchema) => {
    router.push(`/dashboard/documents/${document.id}`);
  };

  const handleEdit = async (document: DocumentSchema) => {
    router.push(`/dashboard/documents/${document.id}/edit`);
  };

  const handleDownload = async (document: DocumentSchema) => {
    try {
      setActionInProgress(`download-${document.id}`);
      const response = await fetch(`/api/documents/${document.id}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.title}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(link);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download document');
      console.error(error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePrint = async (document: DocumentSchema) => {
    try {
      setActionInProgress(`print-${document.id}`);
      const response = await fetch(`/api/documents/${document.id}/print`);
      
      if (!response.ok) {
        throw new Error('Failed to print document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const iframe = window.document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      window.document.body.appendChild(iframe);
      iframe.contentWindow?.print();
      window.document.body.removeChild(iframe);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to print document');
      console.error(error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApprove = async (document: DocumentSchema) => {
    try {
      setActionInProgress(`approve-${document.id}`);
      await approveDocument(document.id);
      toast.success('Document approved successfully');
      await loadDocuments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve document');
      console.error(error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (document: DocumentSchema) => {
    try {
      setActionInProgress(`delete-${document.id}`);
      await deleteDocument(document.id);
      toast.success('Document deleted successfully');
      await loadDocuments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete document');
      console.error(error);
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Recent Documents</h2>
      </div>
      <SimplifiedDocumentTable
        data={documents}
        userRole={userRole}
        onView={handleView}
        onEdit={handleEdit}
        onDownload={handleDownload}
        onPrint={handlePrint}
        onApprove={handleApprove}
        onDelete={handleDelete}
        actionInProgress={actionInProgress}
      />
    </div>
  );
}
