import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CBadge,
  CTooltip,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPlus, cilTrash } from "@coreui/icons";
import GradientTextCard from "./GradintColorText";
import Button from "./CustomButton/CustomButton";
import { COLORS } from "../Themes";
import { addMedicineType, getMedicineTypes } from "../Auth/Auth";
import CreatableSelect from "react-select/creatable";

const slotOptions = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
  { value: "NA", label: "NA" },
];

const foodOptions = ["Before Food", "After Food", "With Food", "NA"];

const MedicineCard = ({ index, medicine, updateMedicine, removeMedicine, onAdd, isDuplicateName }) => {
  const [medicineTypes, setMedicineTypes] = useState([]);

  // Fetch medicine types
  useEffect(() => {
    const fetchTypes = async () => {
      const types = await getMedicineTypes();
      setMedicineTypes(types || []);
    };
    fetchTypes();
  }, []);

  // Ensure current medicineType is included in options
  useEffect(() => {
    if (medicine?.medicineType && !medicineTypes.includes(medicine.medicineType)) {
      setMedicineTypes((prev) => [...prev, medicine.medicineType]);
    }
  }, [medicine?.medicineType, medicineTypes]);

  const handleChange = (field, value) => {
    if (value === null || value === undefined) value = "";
    const updated = { ...medicine, [field]: value };

    // Reset frequency/times if durationUnit is Hour
    if (field === "durationUnit" && value === "Hour") {
      updated.remindWhen = "NA";
      updated.times = [];
    }

    updateMedicine(updated);
  };

  const handleSlotChange = (i, value) => {
    const updatedTimes = Array.isArray(medicine.times) ? [...medicine.times] : [];
    updatedTimes[i] = value;
    updateMedicine({ ...medicine, times: updatedTimes });
  };

  const getSlotCount = () => {
    switch (medicine.remindWhen) {
      case "Once A Day":
      case "Once A Week":
      case "Once A Month":
        return 1;
      case "Twice A Day":
      case "Twice A Week":
      case "Twice A Month":
        return 2;
      case "Thrice A Day":
      case "Thrice A Week":
      case "Thrice A Month":
        return 3;
      default:
        return 3;
    }
  };

  const slotCount = getSlotCount();
  const taken = new Set((medicine.times || []).filter(Boolean));
  const isDup = isDuplicateName?.(medicine?.name);
const isSOS = medicine.remindWhen === "SOS";
  const getFrequencyOptions = () => {
    const baseOptions = (() => {
      switch (medicine.durationUnit) {
        case "Day":
          return ["Once A Day", "Twice A Day", "Thrice A Day"];
        case "Week":
          return ["Once A Week", "Twice A Week", "Thrice A Week"];
        case "Month":
          return ["Once A Month", "Twice A Month", "Thrice A Month"];
        default:
          return [];
      }
    })();

    return ["SOS", ...baseOptions]; // Add SOS at the top
  };


  const handleCreateMedicineType = async (inputValue) => {
    const newType = await addMedicineType(inputValue);
    setMedicineTypes((prev) => [...prev, newType]);
    handleChange("medicineType", newType);
  };

  return (
    <div>
      <CCard className="w-100 mb-3 shadow-sm p-3" style={{ marginInline: "5px" }}>
        <CCardHeader className="d-flex align-items-center justify-content-between" style={{ paddingInline: "5px", paddingBlock: "8px" }}>
          <div className="d-flex align-items-center gap-2">
            <CBadge color="secondary" shape="rounded-pill">#{index + 1}</CBadge>
            <strong>{medicine.name || "Medicine"}</strong>
            {isDup && <CBadge color="danger" shape="rounded-pill">Duplicate</CBadge>}
          </div>


        </CCardHeader>

        <CCardBody >
          <CRow>
            {/* Dosage */}
            <CCol xs={12} sm={6} md={4} lg={3}>
              <GradientTextCard text="Dosage" />
              <CFormInput
                type="text"
                value={medicine.dose || ""}
                placeholder="Enter dosage (e.g. Pea-sized or 100 Mg)"
                onChange={(e) => {
                  let value = e.target.value;

                  // Allow empty input
                  if (value === "") {
                    handleChange("dose", "");
                    return;
                  }

                  // ✅ Allow alphabets, numbers, spaces, and hyphen (not at start)
                  if (/^(?!-)[A-Za-z0-9\s-]+$/.test(value)) {
                    handleChange("dose", value);
                  }
                }}
              />
            </CCol>

            {/* Medicine Type */}
            <CCol xs={12} sm={6} md={4} lg={3}>
              <GradientTextCard text="Medicine Type" />
              <CreatableSelect
                isClearable
                options={medicineTypes.map((t) => ({ label: t, value: t }))}
                value={medicine.medicineType ? { label: medicine.medicineType, value: medicine.medicineType } : null}
                onChange={(selected) => handleChange("medicineType", selected ? selected.value : "")}
                onCreateOption={handleCreateMedicineType}
                placeholder="Choose Medicine Type"
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: '30px',   // adjust height if needed
                    width: '250px',      // set the desired width
                  }),
                  valueContainer: (provided) => ({
                    ...provided,
                    padding: '0 6px',
                  }),
                  input: (provided) => ({
                    ...provided,
                    margin: '0px',
                  }),
                }}
              />
            </CCol>

            {/* Duration */}
            <CCol xs={12} sm={6} md={4} lg={3}>
              <GradientTextCard text="Duration" />
              <div className="d-flex gap-2">
                <CFormInput type="number" min={0} value={medicine.duration || ""} placeholder="e.g. 5" onChange={(e) => handleChange("duration", e.target.value)} style={{ flex: 2 }} />
                <CFormSelect value={medicine.durationUnit || ""} onChange={(e) => handleChange("durationUnit", e.target.value)} style={{ flex: 1 }}>
                  <option value="">Select Unit</option>
                  <option value="Hour">Hour</option>
                  <option value="Day">Day</option>
                  <option value="Week">Week</option>
                  <option value="Month">Month</option>
                </CFormSelect>
              </div>
            </CCol>

            {/* Frequency */}
            <CCol xs={12} sm={6} md={4} lg={3}>
              <GradientTextCard text="Frequency" />
              <CFormSelect
                value={medicine.remindWhen || "NA"}
                onChange={(e) => handleChange("remindWhen", e.target.value)}
                disabled={medicine.durationUnit === "Hour"} // keep Hour rule
              >
                <option value="NA">NA</option>
                {getFrequencyOptions().map((f) => <option key={f} value={f}>{f}</option>)}
              </CFormSelect>
            </CCol>

           {/* Others */}
<CCol xs={12} sm={6} md={4} lg={3}>
  <GradientTextCard text="Others" />
  <CFormInput
    type="text"
    placeholder="Custom frequency..."
    value={medicine.others || ""}
    onChange={(e) => handleChange("others", e.target.value)}
    disabled={false} // always editable even for SOS
  />
</CCol>

{/* Food / Instructions */}
<CCol xs={12} sm={6} md={4} lg={3}>
  <GradientTextCard text="Instructions" />
  <CFormSelect
    value={medicine.food || "NA"}
    onChange={(e) => handleChange("food", e.target.value)}
    disabled={false} // enable for SOS
  >
    {foodOptions.map((f) => <option key={f} value={f}>{f}</option>)}
  </CFormSelect>
</CCol>
          </CRow>

          {/* Time slots */}
         <CRow className="gx-2 gy-2 mt-1">
  {[...Array(3)].map((_, i) => (
    <CCol xs={12} md={3} key={i}>
      <GradientTextCard text={`Time ${i + 1}`} />
      <CFormSelect
        value={medicine.times?.[i] || ""}
        onChange={(e) => handleSlotChange(i, e.target.value)}
        disabled={medicine.durationUnit === "Hour" || i >= slotCount} // **SOS allows editing**, so remove isSOS from disabled
      >
        <option value="">Select Time…</option>
        {slotOptions.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={(medicine.times?.[i] !== opt.value && taken.has(opt.value)) || i >= slotCount}
          >
            {opt.label}
          </option>
        ))}
      </CFormSelect>
    </CCol>
  ))}
</CRow>

          {/* Notes */}
          <div className="mt-3">
            <GradientTextCard text="Notes" />
            <CFormTextarea rows={2} placeholder="Add any special instructions…" value={medicine.note || ""} onChange={(e) => handleChange("note", e.target.value)} />
          </div>
        </CCardBody>
        <div className="d-flex justify-content-end gap-2 mb-3" style={{ marginRight: "10px" }}>
          <CTooltip content="Add to table">
            <span>
              <Button
                customColor={COLORS.bgcolor}
                variant="primary"
                size="sm"
                onClick={() => onAdd?.(medicine)}
              >
                <CIcon icon={cilPlus} style={{ color: COLORS.black }} />
              </Button>
            </span>
          </CTooltip>
          <CTooltip content="Remove card">
            <Button
              customColor={COLORS.bgcolor}
              variant="primary"
              size="sm"
              onClick={removeMedicine}
            >
              <CIcon icon={cilTrash} style={{ color: COLORS.black }} />
            </Button>
          </CTooltip>
        </div>
      </CCard>

    </div>

  );
};

export default MedicineCard;
