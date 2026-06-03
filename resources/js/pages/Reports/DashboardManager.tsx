import { useEffect, useState } from "react"
import AppLayout from "@/layouts/app-layout"
import { Button } from "@/components/ui/button"
import CreateDashboardModal from "@/components/dashboard/CreateDashboardModal"
import axios from "axios"
import { router } from "@inertiajs/react"

interface Dashboard {
  id: number
  name: string
  data_profile: string
  client_id: number | null
  client_group_id: number | null
  created_at: string
}

export default function DashboardManager() {

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [clientGroups, setClientGroups] = useState([])
  const [clients, setClients] = useState([])
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null)

  const openNewWindow = (id:number) => {
    window.open(`/dashboard?dashboard_id=${id}`, "_blank")
  }

  const deleteDashboard = async (id:number) => {
    if (!confirm("Delete this dashboard?")) return
    await axios.delete(`/dashboards/${id}`)
    loadDashboards()
  }

  const editDashboard = (dashboard:Dashboard) => {
    setEditingDashboard(dashboard)
    setShowCreateModal(true)
  }


  const loadDashboards = async () => {
    try {
      const res = await axios.get("/dashboards/list")
      setDashboards(res.data.dashboards)
      setClientGroups(res.data.clientGroups)
      setClients(res.data.statuses)
    } catch (error) {

      console.error("Failed to load dashboards:", error)

    }
  }

  useEffect(() => {
    loadDashboards()
  }, [])

  return (

    <AppLayout>

      <div className="p-6">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-semibold">
            Dashboards
          </h2>

          <Button
            className="bg-orange-500"
            onClick={() => setShowCreateModal(true)}
          >
            NEW DASHBOARD
          </Button>

        </div>

        {/* DASHBOARD GRID */}

        <div className="grid grid-cols-3 gap-6">

          {dashboards.map((dashboard) => (

            <div
              key={dashboard.id}
              className="border rounded-lg p-4 hover:shadow cursor-pointer relative"
            >

              {/* ACTION MENU */}

              <div className="absolute top-3 right-3">

                <div className="flex gap-2 text-gray-500">

                  <button
                    onClick={(e)=>{
                      e.stopPropagation()
                      openNewWindow(dashboard.id)
                    }}
                    className="hover:text-black"
                  >
                    ↗
                  </button>

                  <button
                    onClick={(e)=>{
                      e.stopPropagation()
                      editDashboard(dashboard)
                    }}
                    className="hover:text-blue-600"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={(e)=>{
                      e.stopPropagation()
                      deleteDashboard(dashboard.id)
                    }}
                    className="hover:text-red-600"
                  >
                    🗑
                  </button>

                </div>

              </div>

              {/* CARD CLICK */}

              <div
                onClick={() => router.visit(`/dashboard?dashboard_id=${dashboard.id}`)}
              >

                <div className="h-40 bg-gray-100 mb-3 rounded"></div>

                <h3 className="font-semibold">
                  {dashboard.name}
                </h3>

                <p className="text-sm text-gray-500">
                  {dashboard.data_profile}
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* CREATE DASHBOARD MODAL */}

    {showCreateModal && (

    <CreateDashboardModal
      dashboard={editingDashboard}
      onClose={()=>{
        setShowCreateModal(false)
        setEditingDashboard(null)
        loadDashboards()
      }}
      clientGroups={clientGroups}
      clients={clients}
    />

    )}

    </AppLayout>

  )

}