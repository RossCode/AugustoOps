import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport, updateReportNarrative, approveReport, sendReport, getReportPdfUrl, getReportPreviewUrl } from '../api/reports';
import type { Report } from '../types/reports';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

/**
 * ReportPreview Component
 * View report details, add PM narrative, and approve/send
 */
const ReportPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadReport(parseInt(id));
    }
  }, [id]);

  const loadReport = async (reportId: number) => {
    try {
      setLoading(true);
      const data = await getReport(reportId);
      setReport(data);
      setNarrative(data.pm_narrative || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNarrative = async () => {
    if (!report) return;
    try {
      setSaving(true);
      await updateReportNarrative(report.id, { pm_narrative: narrative });
      alert('Narrative saved successfully');
    } catch (err) {
      alert('Failed to save narrative');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!report) return;
    if (!window.confirm('Approve this report? It will be ready to send.')) return;

    try {
      setSaving(true);
      await approveReport(report.id);
      await loadReport(report.id);
      alert('Report approved successfully!');
    } catch (err) {
      alert('Failed to approve report');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!report) return;
    if (!window.confirm('Send this report to all recipients via email?')) return;

    try {
      setSaving(true);
      await sendReport(report.id);
      alert('Report queued for sending!');
      navigate('/reports/review');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">
<p>Loading report...</p>
</div>;
  }

  if (error || !report) {
    return <div className="container mx-auto py-8">
<Card className="border-red-500">
<CardContent className="py-4">
<p className="text-red-600">{error || 'Report not found'}</p>
</CardContent>
</Card>
</div>;
  }

  const data = report.report_data;

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{report.project_name || report.project_code}</h1>
          <p className="text-gray-600">
            Report Period: {report.report_period_start} to {report.report_period_end}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.open(getReportPreviewUrl(report.id), '_blank')} variant="outline">
            Preview HTML
          </Button>
          <Button onClick={() => window.open(getReportPdfUrl(report.id), '_blank')} variant="outline">
            Download PDF
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          report.status === 'approved' ? 'bg-green-100 text-green-800' :
          report.status === 'sent' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {report.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Financial Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold">${data?.totals?.budget?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Spent This Period</p>
              <p className="text-2xl font-bold">${data?.totals?.spent_period?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold">${data?.totals?.spent_total?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-green-600">${data?.totals?.remaining?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PM Narrative */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Project Manager Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            className="w-full h-32 p-3 border rounded-md"
            placeholder="Add your project summary and notes here..."
            disabled={report.status === 'sent'}
          />
          {report.status !== 'sent' && (
            <Button onClick={handleSaveNarrative} disabled={saving} className="mt-2">
              {saving ? 'Saving...' : 'Save Narrative'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {report.status === 'pending_review' && (
        <div className="flex gap-3">
          <Button onClick={handleApprove} disabled={saving} className="bg-green-600 hover:bg-green-700">
            Approve Report
          </Button>
          <Button onClick={() => navigate('/reports/review')} variant="outline">
            Back to Review Dashboard
          </Button>
        </div>
      )}

      {report.status === 'approved' && (
        <div className="flex gap-3">
          <Button onClick={handleSend} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            Send Report
          </Button>
          <Button onClick={() => navigate('/reports/review')} variant="outline">
            Back
          </Button>
        </div>
      )}

      {report.status === 'sent' && (
        <Card className="bg-blue-50">
          <CardContent className="py-4">
            <p className="text-blue-800">
              This report was sent on {new Date(report.sent_at!).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportPreview;
