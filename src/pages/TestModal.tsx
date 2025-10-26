import { useState } from "react";
import CompanyInfoModal, {
  CompanyInfoData,
} from "@/components/modals/CompanyInfoModal";

export default function TestModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = (data: CompanyInfoData) => {
    console.log("✅ Saved company info:", data);
    // You can also trigger a toast or API call here if needed
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
      >
        Open Company Info Modal
      </button>

      <CompanyInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
