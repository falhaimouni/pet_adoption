import { useState } from "react";
import { ArrowLeft, Save, CheckCircle, User, Stethoscope, FileText, Pill } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";

const APPOINTMENT = {
  id: 1001, pet: "Max", species: "Dog", breed: "Golden Retriever", age: "2 years", gender: "Male", weight: "28 kg",
  owner: "Roaa A.", ownerPhone: "+962 799 111 222", ownerEmail: "roaa@example.com",
  date: "2026-08-06", time: "02:00 PM", reason: "Annual Checkup", status: "pending" as const,
};

interface VetAppointmentDetailPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  params?: { appointmentId?: number };
}

export default function VetAppointmentDetailPage({ onNavigate }: VetAppointmentDetailPageProps) {
  const apt = APPOINTMENT;
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [treatment, setTreatment] = useState("");
  const [saved, setSaved] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [status, setStatus] = useState(apt.status);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleComplete() {
    setStatus("completed" as any);
    setCompleteOpen(false);
  }

  const inputClass = "w-full border border-gray-200 rounded-[10px] px-3 py-2.5 font-['Poppins',sans-serif] text-[13px] text-black outline-none focus:border-[#089D97] transition-colors placeholder-gray-300";
  const textareaClass = `${inputClass} resize-none`;
  const labelClass = "block font-['Poppins',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider mb-1.5";

  return (
    <DashboardLayout role="vet" activePage="vet-appointments" onNavigate={onNavigate} pageTitle={`Appointment #${apt.id}`} breadcrumbs={["Vet", "Appointments", `#${apt.id}`]}>
      {/* Back + status */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => onNavigate("vet-appointments")} className="flex items-center gap-2 text-[#089D97] font-['Poppins',sans-serif] text-[13px] hover:underline">
          <ArrowLeft size={15} /> Back to Appointments
        </button>
        <div className="flex items-center gap-3">
          <Badge label={status} variant={statusBadge(status)} size="md" />
          <span className="font-['Poppins',sans-serif] text-[13px] text-black/50">{apt.date} · {apt.time}</span>
        </div>
      </div>

      {saved && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-[12px] px-4 py-3">
          <CheckCircle size={16} className="text-green-500" />
          <p className="font-['Poppins',sans-serif] text-[13px] text-green-700">Notes saved successfully.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Pet + Owner info */}
        <div className="flex flex-col gap-5">
          {/* Pet Info */}
          <div className="bg-white rounded-[15px] shadow-md p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[rgba(8,157,151,0.12)] rounded-[8px] flex items-center justify-center">
                <Stethoscope size={16} className="text-[#089D97]" />
              </div>
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black">Pet Information</h3>
            </div>
            {[
              { label: "Name", value: apt.pet },
              { label: "Species", value: apt.species },
              { label: "Breed", value: apt.breed },
              { label: "Age", value: apt.age },
              { label: "Gender", value: apt.gender },
              { label: "Weight", value: apt.weight },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="font-['Poppins',sans-serif] text-[12px] text-black/50">{label}</span>
                <span className="font-['Poppins',sans-serif] text-[13px] font-medium text-black">{value}</span>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <button onClick={() => onNavigate("vet-medical", { petId: 1 })} className="flex-1 py-2 text-[#089D97] border border-[#089D97] rounded-[10px] font-['Poppins',sans-serif] text-[12px] hover:bg-[rgba(8,157,151,0.06)] transition-colors">Medical Records</button>
              <button onClick={() => onNavigate("vet-vaccinations", { petId: 1 })} className="flex-1 py-2 text-[#089D97] border border-[#089D97] rounded-[10px] font-['Poppins',sans-serif] text-[12px] hover:bg-[rgba(8,157,151,0.06)] transition-colors">Vaccinations</button>
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-white rounded-[15px] shadow-md p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-[8px] flex items-center justify-center">
                <User size={16} className="text-blue-500" />
              </div>
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black">Owner Information</h3>
            </div>
            {[
              { label: "Name", value: apt.owner },
              { label: "Phone", value: apt.ownerPhone },
              { label: "Email", value: apt.ownerEmail },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="font-['Poppins',sans-serif] text-[12px] text-black/50">{label}</span>
                <span className="font-['Poppins',sans-serif] text-[13px] font-medium text-black">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Clinical form */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Reason */}
          <div className="bg-white rounded-[15px] shadow-md p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-50 rounded-[8px] flex items-center justify-center">
                <FileText size={16} className="text-orange-500" />
              </div>
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black">Reason for Visit</h3>
            </div>
            <p className="font-['Poppins',sans-serif] text-[14px] text-black px-3 py-2.5 bg-[#f0f8f7] rounded-[10px]">{apt.reason}</p>
          </div>

          {/* Clinical notes */}
          <div className="bg-white rounded-[15px] shadow-md p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-[rgba(8,157,151,0.12)] rounded-[8px] flex items-center justify-center">
                <Stethoscope size={16} className="text-[#089D97]" />
              </div>
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black">Clinical Notes</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Medical Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={textareaClass} placeholder="Observations, findings, vitals…" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Diagnosis</label>
                <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} className={textareaClass} placeholder="Primary diagnosis…" />
              </div>
            </div>
          </div>

          {/* Treatment + Prescription */}
          <div className="bg-white rounded-[15px] shadow-md p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-violet-50 rounded-[8px] flex items-center justify-center">
                <Pill size={16} className="text-violet-500" />
              </div>
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black">Treatment & Prescription</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Prescription</label>
                <textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} rows={2} className={textareaClass} placeholder="Medications, dosage…" />
              </div>
              <div>
                <label className={labelClass}>Treatment Plan</label>
                <textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} rows={2} className={textareaClass} placeholder="Follow-up schedule, instructions…" />
              </div>
            </div>
          </div>

          {/* Attachments placeholder */}
          <div className="bg-white rounded-[15px] shadow-md p-5">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black mb-3">Attachments</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-[12px] p-8 text-center">
              <FileText size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="font-['Poppins',sans-serif] text-[13px] text-black/40">Drop files here or click to upload</p>
              <p className="font-['Poppins',sans-serif] text-[11px] text-black/25 mt-1">X-rays, lab results, images</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 border border-[#089D97] text-[#089D97] rounded-[12px] font-['Poppins',sans-serif] font-medium text-[14px] hover:bg-[rgba(8,157,151,0.06)] transition-colors">
              <Save size={15} /> Save
            </button>
            {status === "pending" && (
              <button onClick={() => setCompleteOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-[#089D97] text-white rounded-[12px] font-['Poppins',sans-serif] font-medium text-[14px] hover:bg-[#047975] transition-colors shadow-md">
                <CheckCircle size={15} /> Complete Appointment
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal title="Complete Appointment" open={completeOpen} onClose={() => setCompleteOpen(false)} onConfirm={handleComplete} confirmLabel="Mark as Completed" size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">Mark this appointment as completed? Make sure you have saved all clinical notes before proceeding.</p>
      </Modal>
    </DashboardLayout>
  );
}
