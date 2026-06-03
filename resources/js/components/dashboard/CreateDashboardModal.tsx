import { useEffect,useState } from "react"
import axios from "axios"

import {
  Select,
  SelectContent, 
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

type Props = {
  onClose: () => void
  clientGroups: any[]
  clients: any[]
  dashboard?: any
}

export default function CreateDashboardModal({
  onClose,
  clientGroups,
  clients,
  dashboard
}: Props) {

    //console.log('clientsxx',clients);

  const [name, setName] = useState("")
  const [clientId, setClientId] = useState("")
  const [groupId, setGroupId] = useState("")
  const [dataProfile, setDataProfile] = useState("")

const saveDashboard = async () => {

if(dashboard){

  await axios.put(`/dashboards/${dashboard.id}`,{
    name,
    client_id:clientId,
    client_group_id:groupId,
    data_profile:dataProfile
  })

}else{

  await axios.post("/dashboards",{
    name,
    client_id:clientId,
    client_group_id:groupId,
    data_profile:dataProfile
  })

}

onClose()

}

  useEffect(()=>{

if(dashboard){
  setName(dashboard.name)
  setClientId(dashboard.client_id ?? "")
  setGroupId(dashboard.client_group_id ?? "")
  setDataProfile(dashboard.data_profile)
}

},[dashboard])

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-[500px] rounded-lg p-6">

        <h3 className="text-lg font-semibold mb-4">
          Create Dashboard
        </h3>


        {/* Dashboard Name */}

        <input
          type="text"
          placeholder="Dashboard Name"
          className="border p-2 rounded w-full mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />


        {/* Assign Client */}

        <select
        className="border p-2 rounded w-full mb-4"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        >

        <option value="">Assign Client</option>

        {clients.map((client:any) => (

        <option key={client.value} value={client.id}>
        {client.company_name}
        </option>

        ))}

        </select>


        {/* Assign Client Group */}

    <select
    className="border p-2 rounded w-full mb-4"
    value={groupId}
    onChange={(e) => setGroupId(e.target.value)}
    >

    <option value="">Assign Client Group</option>

    {clientGroups.map((group:any) => (

    <option key={group.id} value={group.id}>
    {group.name}
    </option>

    ))}

    </select>

        {/* Data Profile */}

        <div className="mb-4">

          <label className="text-sm block mb-1">
            Data Profile
          </label>

          <Select
            value={dataProfile}
            onValueChange={(value) => setDataProfile(value)}
          >

            <SelectTrigger>
              <SelectValue placeholder="Select data profile" />
            </SelectTrigger>

            <SelectContent>

              <SelectItem value="salt_rank_geofencing">
                Salt Rank Geofencing Only
              </SelectItem>

              <SelectItem value="vendor">
                Vendor
              </SelectItem>

            </SelectContent>

          </Select>

        </div>


        {/* Buttons */}

        <div className="flex justify-end gap-3">

          <button
            className="border px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="bg-orange-500 text-white px-4 py-2 rounded"
            onClick={saveDashboard}
          >
            Create Dashboard
          </button>

        </div>

      </div>

    </div>
  )
}