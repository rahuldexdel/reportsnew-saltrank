import React, { useState } from "react";

interface Props {
  onClose: () => void;
}

export default function AIPopup({ onClose }: Props) {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>("");

  const handleSubmit = async () => {
    if (!id) {
      alert("Please enter an ID");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/dashboard/simplifi-summary?id=${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      console.log("Laravel result:", result);

      // Display result summary
      setSummary(JSON.stringify(result, null, 2));

    } catch (error) {
      console.error(error);
      setSummary("❌ Error retrieving data");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-lg p-6">
        
        <h2 className="text-xl font-semibold mb-4">AI Assistance</h2>

        {/* TOP CHAT/OUTPUT AREA */}
        <div className="border rounded-md p-3 mb-4 bg-gray-50 h-48 overflow-auto whitespace-pre-wrap text-sm">
          {summary ? summary : "🔹 Enter an ID and press Submit to get the summary"}
        </div>

        {/* ID Input */}
        <input
          type="text"
          placeholder="Enter ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="w-full border px-3 py-2 rounded-md mb-4"
        />

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-md"
          >
            Close
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
            disabled={loading}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
