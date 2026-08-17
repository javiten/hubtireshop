"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"

type TireDepthData = {
  fl?: string
  fr?: string
  rl?: string
  rr?: string
}

type InspectionItem = {
  id: string
  item_number: number
  category: string
  item_label: string
  status: "PASS" | "FAIL" | null
  fail_notes: string | null
  tire_depths: TireDepthData | null
}

type InspectionPhoto = {
  id: string
  blob_url: string
  file_name: string | null
}

type Inspection = {
  id: string
  inspection_date: string
  customer_name: string | null
  vehicle_plate: string | null
  vehicle_vin: string | null
  vehicle_year: string | null
  vehicle_make: string | null
  vehicle_model: string | null
  vehicle_trim: string | null
  mileage: string | null
  additional_notes: string | null
  created_at: string
  updated_at: string | null
  inspection_items: InspectionItem[]
  inspection_photos: InspectionPhoto[]
}

export default function InspectionReportPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    async function fetchInspection() {
      try {
        const res = await fetch(`/api/admin/inspections/${id}`, { credentials: "same-origin" })
        if (res.status === 401) {
          router.push("/admin/login")
          return
        }
        if (!res.ok) {
          setError("Inspection not found")
          setLoading(false)
          return
        }
        const data = await res.json()
        setInspection(data)
      } catch {
        setError("Failed to load inspection")
      } finally {
        setLoading(false)
      }
    }
    fetchInspection()
  }, [id, router])

  const handlePrint = useCallback(() => {
    setPrinting(true)
    // Brief delay to ensure all content/images are loaded
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 300)
  }, [])

  const handleBack = useCallback(() => {
    router.push("/admin/inspections")
  }, [router])

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })

  const formatTimestamp = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

  const vehicleLabel = (insp: Inspection) => {
    const parts = [insp.vehicle_year, insp.vehicle_make, insp.vehicle_model, insp.vehicle_trim]
    return parts.filter(Boolean).join(" ") || "Unknown Vehicle"
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Loading inspection report...</p>
      </div>
    )
  }

  if (error || !inspection) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-gray-500">{error || "Inspection not found"}</p>
        <button onClick={handleBack} className="text-blue-600 hover:underline">
          Back to Inspections
        </button>
      </div>
    )
  }

  // Group items by category
  const itemsByCategory = inspection.inspection_items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, InspectionItem[]>)

  const categories = Object.keys(itemsByCategory)
  const failedCount = inspection.inspection_items.filter((i) => i.status === "FAIL").length
  const passedCount = inspection.inspection_items.filter((i) => i.status === "PASS").length
  const overallStatus = failedCount > 0 ? "FAILED" : passedCount === inspection.inspection_items.length ? "PASSED" : "PENDING"

  return (
    <>
      {/* Print Styles - Must be first for Chrome compatibility */}
      <style jsx global>{`
        @media print {
          @page {
            size: Letter;
            margin: 0.5in;
          }

          /* Reset everything for print */
          *, *::before, *::after {
            box-sizing: border-box;
          }

          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Hide action bar */
          #report-actions {
            display: none !important;
          }

          /* Make printable content flow naturally */
          #inspection-print-report {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          #inspection-print-report * {
            overflow: visible !important;
          }

          /* Page break controls */
          .print-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-break-before {
            break-before: page;
            page-break-before: always;
          }

          /* Logo must have fixed size in print */
          .report-logo {
            width: 140px !important;
            max-width: 140px !important;
            height: auto !important;
            object-fit: contain !important;
          }

          /* Photo images can use max-width for responsive fit */
          img:not(.report-logo) {
            max-width: 100% !important;
            height: auto !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Table styling for print */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }

          td, th {
            border: 1px solid #d1d5db !important;
            padding: 6px 8px !important;
          }

          /* Hide any fixed/sticky elements */
          [style*="position: fixed"],
          [style*="position: sticky"] {
            position: static !important;
          }

          /* Ensure backgrounds print */
          .bg-emerald-100, .bg-red-100, .bg-gray-100, .bg-gray-50, .bg-red-50 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Screen-only styles */
        @media screen {
          #inspection-print-report {
            max-width: 56rem;
            margin: 0 auto;
            padding: 2rem 1.5rem;
          }
        }
      `}</style>

      {/* Screen-only action bar */}
      <div id="report-actions" className="sticky top-0 z-50 border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Inspections
          </button>
          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            {printing ? "Preparing..." : "Print / Save PDF"}
          </button>
        </div>
      </div>

      {/* Printable Report Content */}
      <div id="inspection-print-report" className="bg-white">
        {/* Header with branding */}
        <div className="print-section mb-8 flex items-start justify-between border-b border-gray-200 pb-6">
          <div className="flex items-center gap-4">
            <Image
              src="/images/hub-20tire-20shop-20logo-20rectangle-20rounded.png"
              alt="Hub Tire Shop"
              width={140}
              height={45}
              className="report-logo h-12 w-auto"
              priority
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Inspection Report</h1>
              <p className="text-sm text-gray-500">Professional Multi-Point Inspection</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Report ID</p>
            <p className="font-mono text-sm text-gray-700">{inspection.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Inspection Summary */}
        <div className="print-section mb-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Inspection Date</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(inspection.inspection_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Created</p>
            <p className="mt-1 text-sm text-gray-700">{formatTimestamp(inspection.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Items</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{inspection.inspection_items.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Overall Status</p>
            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              overallStatus === "PASSED"
                ? "bg-emerald-100 text-emerald-700"
                : overallStatus === "FAILED"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}>
              {overallStatus} {failedCount > 0 && `(${failedCount} issues)`}
            </span>
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div className="print-section mb-8 grid grid-cols-1 gap-6 rounded-lg border border-gray-200 bg-gray-50 p-5 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Customer Information</h3>
            <p className="text-base font-medium text-gray-900">{inspection.customer_name || "N/A"}</p>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Vehicle Information</h3>
            <p className="text-base font-medium text-gray-900">{vehicleLabel(inspection)}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
              {inspection.vehicle_plate && (
                <span>Plate: <strong>{inspection.vehicle_plate}</strong></span>
              )}
              {inspection.vehicle_vin && (
                <span className="font-mono">VIN: {inspection.vehicle_vin}</span>
              )}
              {inspection.mileage && (
                <span>Mileage: <strong>{inspection.mileage}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Inspection Checklist */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Inspection Checklist</h2>
          {categories.map((category) => (
            <div key={category} className="print-section mb-6">
              <h3 className="mb-2 border-b border-gray-200 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-700">
                {category}
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {itemsByCategory[category].map((item, idx) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      style={item.status === "FAIL" ? { backgroundColor: "#fef2f2" } : undefined}
                    >
                      <td className="w-8 px-3 py-2 text-center text-xs text-gray-400">
                        {item.item_number}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{item.item_label}</td>
                      <td className="w-20 px-3 py-2 text-center">
                        {item.status === "PASS" && (
                          <span className="text-emerald-600">Pass</span>
                        )}
                        {item.status === "FAIL" && (
                          <span className="font-medium text-red-600">Fail</span>
                        )}
                        {item.status === null && (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Show fail notes for failed items in this category */}
              {itemsByCategory[category]
                .filter((item) => item.status === "FAIL" && (item.fail_notes || item.tire_depths))
                .map((item) => (
                  <div key={`${item.id}-notes`} className="print-section mt-2 rounded border-l-4 border-red-400 bg-red-50 p-3 text-sm">
                    <p className="font-medium text-red-800">
                      #{item.item_number} {item.item_label}
                    </p>
                    {item.fail_notes && (
                      <p className="mt-1 text-red-700">{item.fail_notes}</p>
                    )}
                    {item.tire_depths && Object.keys(item.tire_depths).length > 0 && (
                      <p className="mt-2 text-xs text-red-800">
                        <strong>Tire Depths (32nds):</strong>{" "}
                        {item.tire_depths.fl !== undefined && `FL: ${item.tire_depths.fl} `}
                        {item.tire_depths.fr !== undefined && `FR: ${item.tire_depths.fr} `}
                        {item.tire_depths.rl !== undefined && `RL: ${item.tire_depths.rl} `}
                        {item.tire_depths.rr !== undefined && `RR: ${item.tire_depths.rr}`}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Additional Notes */}
        {inspection.additional_notes && (
          <div className="print-section mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Additional Notes</h2>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-sm text-gray-700">{inspection.additional_notes}</p>
            </div>
          </div>
        )}

        {/* Photos */}
        {inspection.inspection_photos.length > 0 && (
          <div className="print-break-before mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Inspection Photos ({inspection.inspection_photos.length})
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {inspection.inspection_photos.map((photo, idx) => (
                <div key={photo.id} className="print-section relative overflow-hidden rounded-lg border border-gray-200" style={{ aspectRatio: "4/3" }}>
                  <Image
                    src={photo.blob_url}
                    alt={photo.file_name || `Photo ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="print-section border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          <p>Hub Tire Shop - Vehicle Inspection Report</p>
          <p>Generated on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
      </div>
    </>
  )
}
