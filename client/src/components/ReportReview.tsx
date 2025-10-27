import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingReports, deleteReport } from '../api/reports';
import type { Report } from '../types/reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

/**
 * ReportReview Component
 * Dashboard for Project Managers to review pending status reports
 */
const ReportReview: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingReports();
  }, []);

  const loadPendingReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingReports();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending reports');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = (reportId: number) => {
    navigate(`/reports/${reportId}`);
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await deleteReport(reportId);
      setReports(reports.filter(r => r.id !== reportId));
    } catch (err) {
      alert('Failed to delete report: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center">Loading pending reports...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Report Review Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Review and approve status reports for your assigned projects
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">
              No reports pending review. All caught up!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reports.map(report => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>
                  {report.project_name || report.project_code}
                </CardTitle>
                <CardDescription>
                  {report.client_name && `Client: ${report.client_name} • `}
                  Period: {formatDate(report.report_period_start)} - {formatDate(report.report_period_end)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Project Code</p>
                    <p className="font-medium">{report.project_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Generated</p>
                    <p className="font-medium">
                      {formatDate(report.generated_at)}
                      {report.generated_by_name && ` by ${report.generated_by_name}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending Review
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReviewReport(report.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Review Report
                  </Button>
                  <Button
                    onClick={() => handleDeleteReport(report.id)}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportReview;
