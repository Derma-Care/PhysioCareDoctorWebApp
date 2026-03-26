import React, { useState } from "react";
import {
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormInput,
  CFormTextarea,
} from "@coreui/react";

const SymptomsModal = ({
  visible,
  onClose,
  addDisease,
  fetchDiseases,
  setDiagnosis,
  success,
  info,
  error,
  defaultDiseaseName = "", // ✅ disease name comes from parent
}) => {
  // States for modal fields
  const [probableSymptoms, setProbableSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [hover, setHover] = useState(false);

  const handleSave = async () => {
    const name = defaultDiseaseName.trim();
    const symptoms = probableSymptoms.trim();
    const diseaseNotes = notes.trim();

    if (!name || !symptoms || adding) return;

    try {
      setAdding(true);

      const hospitalId = localStorage.getItem("hospitalId") || "H_DEFAULT";

      const created = await addDisease({
        diseaseName: name,
        hospitalId,
        probableSymptoms: symptoms,
        notes: diseaseNotes,
      });

      if (created) {
        success?.(`Saved "${name}" to diagnoses`, { title: "Success" });

        // Clear fields
        setProbableSymptoms("");
        setNotes("");

        await fetchDiseases();

        setDiagnosis(name);
        onClose();
      } else {
        info?.(created?.message || "Could not add disease", { title: "Info" });
      }
    } catch (e) {
      console.error(e);
      error?.("Could not add disease. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>Add Details for "{defaultDiseaseName}"</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {/* 🚫 Removed nested <CForm> to avoid <form> inside <form> */}
        <div className="mb-3">
          <label className="form-label">Category</label>
          <CFormInput
            type="text"
            value={probableSymptoms}
            onChange={(e) => setProbableSymptoms(e.target.value)}
            placeholder="Enter probable symptoms"
            disabled={adding}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Notes</label>
          <CFormTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter notes"
            rows={3}
            disabled={adding}
          />
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={onClose} disabled={adding}>
          Cancel
        </CButton>
        <CButton
          onClick={handleSave}
          disabled={adding}
          style={{
            backgroundColor: hover ? "#7e3a93" : "#a5c4d4ff",
            color: hover ? "#fff" : "#7e3a93",
            border: "none",
            fontWeight: 'bold',
            transition: "all 0.3s ease",
          }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {adding ? "Saving..." : "Save"}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default SymptomsModal;
