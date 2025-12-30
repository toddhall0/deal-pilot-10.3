"use client"

import { useState, useEffect } from "react"
import { ReportGenerator } from "@/components/reports/ReportGenerator"

export default function ReportsPage() {
  const [deals, setDeals] = useState([])
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [dealsRes, clientsRes] = await Promise.all([
          fetch("/api/deals"),
          fetch("/api/clients"),
        ])

        if (dealsRes.ok) {
          const dealsData = await dealsRes.json()
          setDeals(
            dealsData.map((d: any) => ({
              id: d.id,
              dealNumber: d.dealNumber,
              propertyName: d.propertyName,
            }))
          )
        }

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json()
          setClients(
            clientsData.map((c: any) => ({
              id: c.id,
              name: c.name,
            }))
          )
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-gray-500">
          Generate and export reports for deals, clients, and pipeline
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <ReportGenerator deals={deals} clients={clients} />
      )}
    </div>
  )
}
