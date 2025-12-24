<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\ReportGenerationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    protected ReportGenerationService $reportService;

    public function __construct(ReportGenerationService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Generate inventory report.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function generateInventoryReport(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date');
            $result = $this->reportService->generateInventoryReport($date);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Inventory report generated successfully',
                    'data' => $result,
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate inventory report',
                'error' => $result['error'] ?? 'Unknown error',
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate inventory report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate sales report.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function generateSalesReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        try {
            $startDate = new \DateTime($validated['start_date']);
            $endDate = new \DateTime($validated['end_date']);

            $result = $this->reportService->generateSalesReport($startDate, $endDate);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sales report generated successfully',
                    'data' => $result,
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate sales report',
                'error' => $result['error'] ?? 'Unknown error',
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate sales report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download a report.
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\StreamedResponse|JsonResponse
     */
    public function download(Request $request)
    {
        $validated = $request->validate([
            'filename' => 'required|string',
        ]);

        try {
            $filepath = "reports/{$validated['filename']}";

            if (!Storage::exists($filepath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Report file not found',
                ], 404);
            }

            return Storage::download($filepath);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get list of available reports.
     *
     * @return JsonResponse
     */
    public function list(): JsonResponse
    {
        try {
            $reports = $this->reportService->getAvailableReports();

            return response()->json([
                'success' => true,
                'data' => $reports,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch reports',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete old reports.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function cleanup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'days_to_keep' => 'nullable|integer|min:1|max:365',
        ]);

        try {
            $daysToKeep = $validated['days_to_keep'] ?? 30;
            $deletedCount = $this->reportService->cleanupOldReports($daysToKeep);

            return response()->json([
                'success' => true,
                'message' => "Cleaned up {$deletedCount} old reports",
                'deleted_count' => $deletedCount,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cleanup reports',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
