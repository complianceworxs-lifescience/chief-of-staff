import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WeeklyReport } from "@shared/schema";

export function WeeklyReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery<WeeklyReport[]>({
    queryKey: ["/api/reports"]
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reports/generate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Report Generated",
        description: "Weekly intelligence report has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  });

  const latestReport = reports[0];

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600";
    if (grade.startsWith("B")) return "text-yellow-600";
    return "text-red-600";
  };

  const downloadReport = async (reportId: string, period: string) => {
    console.log('Download function called with:', { reportId, period });
    
    // Show immediate feedback that button was clicked
    toast({
      title: "Download Starting",
      description: "Preparing your report download...",
    });

    try {
      console.log('Fetching report data...');
      
      const response = await fetch(`/api/reports/${reportId}/download`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('Blob created, size:', blob.size);
      
      const fileName = `Weekly_Intelligence_Report_${period.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      console.log('Triggering download for file:', fileName);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
      console.log('Download triggered successfully');
      toast({
        title: "Download Complete",
        description: `${fileName} has been downloaded.`,
      });
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: `Failed to download report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Latest Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900">
            Latest Report Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestReport ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Report Period:</span>
                <span className="text-sm font-medium text-gray-900">
                  {latestReport.period}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Generated:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDistanceToNow(new Date(latestReport.generatedAt), { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Score:</span>
                <span className={`text-sm font-medium ${getGradeColor(latestReport.grade)}`}>
                  {latestReport.grade} ({latestReport.overallScore}%)
                </span>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Key Highlights:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  {latestReport.highlights.map((highlight, index) => (
                    <li key={index}>• {highlight}</li>
                  ))}
                </ul>
              </div>
              
              <div className="pt-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Button clicked!', latestReport);
                    await downloadReport(latestReport.id, latestReport.period);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Full Report
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reports generated yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">
            Report History
          </CardTitle>
          <Button
            onClick={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate New Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.length > 0 ? (
              reports.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.period}</p>
                    <p className="text-xs text-gray-600">
                      {Object.keys(report.agentStatuses).length} agents monitored, {report.conflictsDetected} conflicts, {report.grade} score
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${getGradeColor(report.grade)}`}>
                      {report.grade}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Small download button clicked!', report);
                        await downloadReport(report.id, report.period);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 text-sm">No reports available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
