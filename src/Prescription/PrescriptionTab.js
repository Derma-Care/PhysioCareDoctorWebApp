// PrescriptionTab.jsx
import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import html2pdf from 'html2pdf.js'
import { format } from 'date-fns'
import MedicineCard from '../components/MedicineCard'
import TemplateModal from '../components/TemplateModal'
import RecentChips from '../components/RecentChips'

import { FaTrash, FaEdit, FaCheck } from 'react-icons/fa'
import Button from '../components/CustomButton/CustomButton'
import { COLORS } from '../Themes'
import {
  CAlert,
  CButton,
  CCol,
  CFormInput,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheck, cilPencil, cilTrash } from '@coreui/icons'
import GradientTextCard from '../components/GradintColorText'
import { useToast } from '../utils/Toaster'
import { addOrSearchMedicine, getAllMedicines, getMedicineTypes, medicineTemplate, SavePrescription } from '../Auth/Auth'
import Select from 'react-select'
import api from '../Auth/axiosInterceptor'
import AsyncSelect from 'react-select/async'
import { formatDuration } from '../utils/formatDateTime'
import CreatableSelect from 'react-select/creatable'; // ✅ Add this import

const PrescriptionTab = ({ seed = {}, onNext, sidebarWidth = 0, formData }) => {
  const [search, setSearch] = useState('')
  const [localsearch, setLocalsearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [activeMedicine, setActiveMedicine] = useState(null) // ← ADD THIS
  const [editingIndex, setEditingIndex] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([])
  const [selectedPrescriptionMedicines, setSelectedPrescriptionMedicines] = useState([])
  const [isSelectLoading, setIsSelectLoading] = useState(false)
  const [medicineTypes, setMedicineTypes] = useState([]);
  const [globalMedicines, setGlobalMedicines] = useState([]);


  useEffect(() => {
    const fetchGlobalMedicines = async () => {
      setIsLoading(true);
      try {
        const meds = await getAllMedicines();
        setGlobalMedicines(meds || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlobalMedicines();
  }, []);
  const foodOptions = ["Before Food", "After Food", "With Food", "NA"];
  const slotOptions = [
    { value: "morning", label: "Morning" },
    { value: "afternoon", label: "Afternoon" },
    { value: "evening", label: "Evening" },
    { value: "night", label: "Night" },
    { value: "NA", label: "NA" },
  ];

  const slotLegendMap = {
    morning: "M",
    afternoon: "A",
    evening: "E",
    night: "N",
    NA: "NA",
  };

  useEffect(() => {
    const fetchTypes = async () => {
      const types = await getMedicineTypes(); // API call
      setMedicineTypes(types || []);
    };
    fetchTypes();
  }, []);

  const [medicines, setMedicines] = useState(
    Array.isArray(seed.medicines)
      ? seed.medicines.map((m) => ({
        medicineType: m.medicineType || "",
        name: m.name || "",
        dose: m.dose || "",
        remindWhen: m.remindWhen || "Once A Day",
        others: m.others || "",
        duration: m.duration || "",
        durationUnit: m.durationUnit?.trim() || "",
        food: m.food || "",
        note: m.note || "",
        times: Array.isArray(m.times) ? m.times : ["", "", ""],
      }))
      : []
  )

  const [note, setNote] = useState(seed.note ?? '')
  //Toaster
  const { success, error, info, warning } = useToast()
  // --- add near other state/derived values ---
  const hasPendingCards = Boolean(activeMedicine);

  const debounce = useRef(null)
  // optional: sanitize before sending (fill blanks with 'NA')
  const sanitizeMedicines = (list) =>
    list.map((m) => ({
      ...m,
      dose: m.dose?.toString().trim() || "NA",
      note: m.note?.trim() || "NA",
      food: m.food?.trim() || "NA",
      medicineType: m.medicineType?.trim() || "NA",
      duration: m.duration?.toString().trim() || "NA",
      durationUnit: m.durationUnit?.trim() || "",
      others: m.others?.trim() || "NA",
      remindWhen: m.remindWhen?.trim() || "NA",
      times: Array.isArray(m.times)
        ? m.times.map((t) => `${t}`.trim()).filter(Boolean)
        : typeof m.times === "string"
          ? m.times
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
          : [],
    }));

  useEffect(() => {
    const storedTemplates = JSON.parse(localStorage.getItem('templates') || '[]')
    const recent = JSON.parse(localStorage.getItem('recent_searches') || '[]')
    setTemplates(storedTemplates)
    setRecentSearches(recent)
  }, [])

  useEffect(() => {
    setMedicines(Array.isArray(seed.medicines) ? seed.medicines : [])
    setNote(seed.note ?? '')
  }, [seed])
  const handleDelete = (id) => setMedicines((prev) => prev.filter((m) => (m.id ?? m.name) !== id))

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await medicineTemplate()
        if (res) {
          console.log(res)
          setPrescriptions(res)
        }
        // ✅ Use data array directly
      } catch (err) {
        console.error('Error fetching prescriptions:', err)
      }
    }

    fetchPrescriptions()
  }, [])

  const options = Array.isArray(prescriptions)
    ? prescriptions.map((presc) => ({
      label: presc.medicines?.[0]?.name || `Prescription #${presc.prescriptionId}`,
      value: presc.prescriptionId,
      data: presc,
    }))
    : []

  const handlePrescriptionSelect = (selectedOption) => {
    const selected = selectedOption?.data
    if (selected?.medicines?.length > 0) {
      setSelectedPrescriptionMedicines(selected.medicines)
      // or show all if needed
    }
  }

  useEffect(() => {
    if (search.length < 2) return
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => fetchSearchResults(search), 300)
  }, [search])

  const fetchSearchResults = async (query) => {
    setIsLoading(true)
    try {
      const { data } = await axios.get(
        `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${query}*&limit=25`,
      )
      const results = data.results.map((item) => item.openfda?.generic_name?.[0]).filter(Boolean)
      setSearchResults([...new Set(results)])
      setShowList(true)
    } catch (err) {
      console.error(err)
      setSearchResults([])
      setShowList(false)
    } finally {
      setIsLoading(false)
    }
  }

  const addMedicine = (name) => {
    if (hasPendingCards) {
      warning("Please add or remove the current medicine card before adding a new one.", {
        title: "Pending Medicine",
      });
      return;
    }

    const lower = name.toLowerCase();

    const exists =
      medicines.some((med) => med.name?.toLowerCase() === lower) ||
      selectedPrescriptionMedicines.some((med) => med.name?.toLowerCase() === lower) ||
      (activeMedicine?.name?.toLowerCase() === lower);

    if (exists) {
      info("Medicine already added");
      return;
    }

    setActiveMedicine({
      name,
      dose: "",
      medicineType: "",
      remindWhen: "NA",
      note: "",
      duration: "",
      food: "",
      others: "",
      times: ["", "", ""],
    });

    setSearch("");
    setSearchResults([]);

    const updatedRecent = [name, ...recentSearches.filter((item) => item !== name)].slice(0, 10);
    setRecentSearches(updatedRecent);
    localStorage.setItem("recent_searches", JSON.stringify(updatedRecent));
  };


  // ✅ FIXED SAVE TEMPLATE FUNCTION
  const saveTemplate = async () => {
    if (!medicines.length) {
      warning('Please add medicines before saving.', { title: 'No Medicines' })
      return
    }

    const sanitized = medicines.map((m) => ({
      name: m.name || "NA",
      dose: m.dose || "NA",
      medicineType: m.medicineType || "",
      food: m.food || "",
      remindWhen: m.remindWhen || "Once A Day",
      duration: m.duration || "",
      durationUnit: m.durationUnit?.trim() || "",
      note: m.note || "",
      others: m.others || "",
      times: Array.isArray(m.times) ? m.times : ["", "", ""]
    }))

    const clinicId = localStorage.getItem('hospitalId')
    const prescriptionData = { medicines: sanitized, clinicId }

    try {
      const result = await SavePrescription(prescriptionData)
      if (result) {
        success('Medicines saved successfully!', { title: 'Success' })

        // 👇 Refresh prescriptions immediately so Local Finder sees it
        const updated = await medicineTemplate()
        setPrescriptions(updated || [])
      } else {
        warning('Failed to save medicines. Try again.', { title: 'Warning' })
      }
    } catch (err) {
      error('Error saving medicines', { title: 'Error' })
    }
  }

  // ✅ FIXED LOAD TEMPLATE FUNCTION
  const loadTemplate = (templateStr) => {
    try {
      const parsed = JSON.parse(templateStr)

      // Sanitize loaded medicines
      const sanitized = parsed.map((m) => ({
        name: m.name || "NA",
        dose: m.dose || "NA",
        medicineType: m.medicineType || "", // empty string fallback
        food: m.food || "",                 // Instructions fallback
        remindWhen: m.remindWhen || "Once A Day",
        duration: m.duration || "",
        durationUnit: m.durationUnit?.trim() || "",
        note: m.note || "",
        others: m.others || "",
        times: Array.isArray(m.times) ? m.times : ["", "", ""]
      }))

      setMedicines(sanitized)
    } catch (e) {
      console.error('Invalid template')
    }
  }


  const generatePDF = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const element = document.getElementById('pdf-content')
      html2pdf()
        .from(element)
        .set({ margin: 1, filename: `Prescription_${Date.now()}.pdf`, html2canvas: {}, jsPDF: {} })
        .save()
        .finally(() => setIsGenerating(false))
    }, 100)
  }

  const handleUpdate = (index, field, value) => {
    const updated = [...medicines]
    updated[index][field] = value
    setMedicines(updated)
  }

  // const handleNext = () => onNext?.({ medicines, note })
  const handleNext = () => {
    // stop if there are cards not added to the table yet
    if (hasPendingCards) {
      warning('Please add the medicine card(s) to the table before continuing.', {
        title: 'Pending medicines',
      })
      return
    }

    const payload = { medicines: sanitizeMedicines(medicines) }
    onNext?.(payload)
    console.log(payload)
  }

  const [showList, setShowList] = useState(false)

  const listRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) {
        setShowList(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])


  const isDuplicateName = (name) => {
    const n = String(name || '')
      .trim()
      .toLowerCase()
    return medicines.some(
      (m) =>
        String(m?.name || '')
          .trim()
          .toLowerCase() === n,
    )
  }


  const isAlreadySelected = (name) => {
    if (!name) return false;
    const lower = name.toLowerCase();

    return (
      medicines.some((m) => m.name?.toLowerCase() === lower) ||
      selectedPrescriptionMedicines.some((m) => m.name?.toLowerCase() === lower) ||
      (activeMedicine && activeMedicine.name?.toLowerCase() === lower)
    );
  };
  const handleCreateOption = (inputValue) => {
    if (!inputValue) return;

    // Check if it already exists
    if (medicineTypes.includes(inputValue)) {
      info('Medicine type already exists');
      return;
    }

    // Add to medicineTypes state
    setMedicineTypes((prev) => [...prev, inputValue]);

    // Optionally, update the medicine in the table immediately
    if (editingIndex !== null) {
      handleUpdate(editingIndex, "medicineType", inputValue);
    }

    success(`Medicine type "${inputValue}" added`);
  };

  return (
    <div className="container pb-5">
      <CRow className="mb-4">
        {/* Local Medicine Finder */}
        <CCol xs={12} style={{ flex: '0 0 45%', minWidth: '300px' }}>
          <GradientTextCard text={'🏥 Local Medicine Finder'} />
          <div className="input-group no-focus-ring">
            <div className="mb-4" style={{ width: '100%' }}>
              <AsyncSelect
                cacheOptions
                loadOptions={(inputValue, callback) => {
                  if (!inputValue || inputValue.length < 2) return callback([])

                  const filtered = prescriptions.flatMap((presc) =>
                    presc.medicines
                      ?.filter((m) =>
                        m.name?.toLowerCase().includes(inputValue.toLowerCase())
                      )
                      .map((m) => ({
                        label: m.name,
                        value: m.id,
                        prescriptionId: presc.prescriptionId,
                        data: m,
                      })) || []
                  )

                  callback(filtered)
                }}
                defaultOptions={false}
                placeholder="Search prescription medicine..."
                onChange={(selectedOption) => {
                  if (hasPendingCards) {
                    warning("Please add the current medicine before selecting another.", { title: "Pending Medicine" });
                    return;
                  }

                  const selectedMed = selectedOption?.data;
                  if (selectedMed) {
                    if (isAlreadySelected(selectedMed.name)) {
                      info("Medicine already added");
                      return;
                    }
                    setSelectedPrescriptionMedicines((prev) => [...prev, selectedMed]);
                  }
                }}


                value={null}   // 👈 clears selection so caret never shows before "ASPIRIN"
                noOptionsMessage={() => 'Start typing to search...'}
                styles={{
                  container: (base) => ({
                    ...base,
                    width: '100%',
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
              />


            </div>
          </div>
        </CCol>

        {/* 🌐 Global Medicine Finder */}
        <CCol xs={12} md={6}>
          <GradientTextCard text={"🌐 Global Medicine Finder"} />

          <div className="mb-4" style={{ width: "100%" }}>
            <AsyncSelect
              cacheOptions
              defaultOptions={globalMedicines.map((m) => ({
                label: m.name,
                value: m.name,
              }))}
              loadOptions={(inputValue, callback) => {
                if (!inputValue) {
                  callback(globalMedicines.map((m) => ({ label: m.name, value: m.name })));
                  return;
                }

                const filtered = globalMedicines
                  .filter((m) => m.name.toLowerCase().includes(inputValue.toLowerCase()))
                  .map((m) => ({
                    label: m.name,
                    value: m.name,
                  }));

                if (filtered.length === 0) {
                  filtered.push({
                    label: `➕ Add "${inputValue}"`,
                    value: inputValue,
                    __isNew__: true,
                  });
                }

                callback(filtered);
              }}
              placeholder={
                hasPendingCards
                  ? "✅ Please finish adding the current medicine"
                  : "Search or add a medicine..."
              }
              isLoading={isLoading}
              noOptionsMessage={() => "No medicines found"}
              isClearable
              isDisabled={hasPendingCards}   // 🚫 disabled until medicine is saved
              onChange={async (selectedOption) => {
                if (!selectedOption) return;
                const selectedName = selectedOption.value;

                if (isAlreadySelected(selectedName)) {
                  info("Medicine already added");
                  return;
                }

                if (selectedOption.__isNew__) {
                  const added = await addOrSearchMedicine(selectedName);
                  if (added) {
                    success(`✅ Medicine "${selectedName}" added`);
                    addMedicine(selectedName);

                    const meds = await getAllMedicines();
                    setGlobalMedicines(meds || []);
                  }
                } else {
                  addMedicine(selectedName);
                }
              }}
              styles={{
                container: (base) => ({
                  ...base,
                  width: "100%",
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                }),
              }}
            />


          </div>
        </CCol>
      </CRow>

      {/* {isLoading && <div>Loading...</div>} */}
      {!isLoading && search && searchResults.length === 0 && (
        <p>No matching results. You can add manually.</p>
      )}
      {search.length >= 2 && recentSearches.length > 0 && (
        <RecentChips recent={recentSearches} onSelect={addMedicine} />
      )}

      <ul
        className="list-group mt-2"
        ref={listRef}
        style={{ display: showList ? 'block' : 'none' }}
      >
        {searchResults.map((res, idx) => (
          <li
            className="list-group-item d-flex justify-content-between"
            key={idx}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              addMedicine(res)
              setShowList(false) // hide after selection
            }}
          >
            {res}
            <button className="btn btn-sm btn-outline-success" customColor={COLORS.bgcolor} // background color of button
              color={COLORS.black}>Add</button>
          </li>
        ))}
      </ul>

      {medicines.length > 0 && (
        <div className="mb-4">
          <GradientTextCard text={'Medication Table'} />

          <CTable striped hover responsive className="align-middle">
            <CTableHead>
              <CTableRow className="bg-info  fst-normal" >
                <CTableHeaderCell scope="col" style={{ color: COLORS.black }}>S.NO</CTableHeaderCell>
                <CTableHeaderCell scope="col" style={{ color: COLORS.black }}>Medicine Type</CTableHeaderCell>
                <CTableHeaderCell scope="col" style={{ color: COLORS.black }}>Medicine</CTableHeaderCell>
                <CTableHeaderCell scope="col" style={{ color: COLORS.black }}>Dosage</CTableHeaderCell>
                <CTableHeaderCell scope="col" style={{ color: COLORS.black }}>Frequency</CTableHeaderCell>
                <CTableHeaderCell scope="col" style={{ color: COLORS.black }}>Duration</CTableHeaderCell>
                <CTableHeaderCell scope="col" style={{ color: COLORS.black }}>Instructions</CTableHeaderCell>
                <CTableHeaderCell scope="col" style={{ color: COLORS.black }}>Note</CTableHeaderCell>
                <CTableHeaderCell scope="col" style={{ color: COLORS.black }}>Timings</CTableHeaderCell>
                <CTableHeaderCell scope="col" className="text-end" style={{ color: COLORS.black }}>
                  Action
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {medicines.map((med, index) => (
                <CTableRow key={index}>
                  <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>

                  {/* Medicine Type */}
                  <CTableDataCell style={{ minHeight: '30px', padding: '4px' }}>
                    {editingIndex === index ? (
                      <CreatableSelect
                        isClearable
                        options={medicineTypes.map((t) => ({ label: t, value: t }))}
                        value={med.medicineType ? { label: med.medicineType, value: med.medicineType } : null}
                        onChange={(selected) =>
                          handleUpdate(index, "medicineType", selected ? selected.value : "")
                        }
                        onCreateOption={handleCreateOption}
                        placeholder="Select or create medicine type..."
                        menuPlacement="auto"
                        menuPortalTarget={document.body}   // ✅ render dropdown outside table
                        styles={{
                          container: (provided) => ({
                            ...provided,
                            width: '100%',
                            minWidth: '120px',
                          }),
                          control: (provided) => ({
                            ...provided,
                            minHeight: '35px',
                            fontSize: '0.9rem',
                            padding: '2px 6px',
                          }),
                          valueContainer: (provided) => ({
                            ...provided,
                            padding: '0 6px',
                            overflow: 'visible',
                          }),
                          input: (provided) => ({
                            ...provided,
                            margin: 0,
                            padding: 0,
                          }),
                          indicatorsContainer: (provided) => ({
                            ...provided,
                            height: '35px',
                          }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }), // ✅ always on top
                        }}
                      />
                    ) : (
                      <span style={{ color: med.medicineType ? '#000' : '#000' }}>
                        {med.medicineType || 'NA'}
                      </span>
                    )}
                  </CTableDataCell>

                  {/* Medicine Name */}
                  <CTableDataCell style={{ minHeight: '30px', padding: '4px' }}>
                    {editingIndex === index ? (
                      <Select
                        isClearable
                        className="w-100"
                        value={med.name ? { label: med.name, value: med.name } : null}
                        onChange={(option) => handleUpdate(index, 'name', option ? option.value : '')}
                        options={globalMedicines.map((m) => ({
                          label: m.name,
                          value: m.name,
                        }))}
                        placeholder="Select medicine..."
                        menuPlacement="auto"
                        menuPortalTarget={document.body}   // ✅ render dropdown outside table
                        styles={{
                          container: (provided) => ({
                            ...provided,
                            width: '100%',
                            minWidth: '120px',
                          }),
                          control: (provided) => ({
                            ...provided,
                            minHeight: '35px',
                            fontSize: '0.9rem',
                            padding: '2px 6px',
                          }),
                          valueContainer: (provided) => ({
                            ...provided,
                            padding: '0 6px',
                            overflow: 'visible',
                          }),
                          input: (provided) => ({
                            ...provided,
                            margin: 0,
                            padding: 0,
                          }),
                          indicatorsContainer: (provided) => ({
                            ...provided,
                            height: '35px',
                          }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }), // ✅ always on top
                        }}
                      />
                    ) : (
                      med.name || 'NA'
                    )}
                  </CTableDataCell>




                  {/* Dose */}
                  <CTableDataCell>
                    {editingIndex === index ? (
                      <CFormInput
                        size="sm"
                        value={med.dose}
                        onChange={(e) => handleUpdate(index, 'dose', e.target.value)}
                      />
                    ) : (
                      med.dose || 'NA'
                    )}
                  </CTableDataCell>

                  <CTableDataCell>
                    {editingIndex === index ? (
                      <CFormSelect
                        size="sm"
                        value={med.remindWhen}
                        onChange={(e) => handleUpdate(index, "remindWhen", e.target.value)}
                      >
                        <option>Once A Day</option>
                        <option>Twice A Day</option>
                        <option>Thrice A Day</option>
                        <option>others</option>
                      </CFormSelect>
                    ) : (
                      <>
                        {med.remindWhen && med.remindWhen !== "NA"
                          ? med.remindWhen === "Other" && med.others
                            ? `Other (${med.others})`
                            : med.remindWhen
                          : med.others || "NA"}
                      </>
                    )}
                  </CTableDataCell>

                  <CTableDataCell>
                    {editingIndex === index ? (
                      <div className="d-flex gap-2 align-items-center">
                        <CFormInput
                          size="sm"
                          type="number"
                          min={0}
                          value={med.duration || ""}
                          onChange={(e) => handleUpdate(index, "duration", e.target.value)}
                          style={{ width: "70px" }}
                        />
                        <CFormSelect
                          size="sm"
                          value={med.durationUnit || ""} // empty string fallback
                          onChange={(e) => handleUpdate(index, "durationUnit", e.target.value)}
                        >
                          <option value="">Unit</option>
                          <option value="Hour">Hour</option>
                          <option value="Day">Day</option>
                          <option value="Week">Week</option>
                          <option value="Month">Month</option>
                        </CFormSelect>
                      </div>
                    ) : (
                      med.duration
                        ? `${med.duration} ${med.durationUnit ? (med.duration > 1 ? med.durationUnit + "s" : med.durationUnit) : ""}`
                        : "NA"
                    )}
                  </CTableDataCell>

                  <CTableDataCell>
                    {editingIndex === index ? (
                      <CFormSelect
                        size="sm"
                        value={med.food || "NA"} // fallback to NA
                        onChange={(e) => handleUpdate(index, "food", e.target.value)}
                      >
                        {foodOptions.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </CFormSelect>
                    ) : (
                      med.food || "NA"
                    )}
                  </CTableDataCell>

                  {/* Note */}
                  <CTableDataCell style={{ maxWidth: 200 }}>
                    {editingIndex === index ? (
                      <CFormInput
                        size="sm"
                        value={med.note}
                        onChange={(e) => handleUpdate(index, 'note', e.target.value)}
                      />
                    ) : (
                      // Ellipsis + tooltip
                      <CTooltip content={med.note || 'NA'}>
                        <div
                          style={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={med.note} // fallback tooltip
                        >
                          {med.note || 'NA'}
                        </div>
                      </CTooltip>
                    )}
                  </CTableDataCell>

                  {/* Timings */}
                  <CTableDataCell style={{ minWidth: 180 }}>
                    {editingIndex === index ? (
                      <div className="d-flex flex-column gap-1">
                        {(Array.isArray(med.times) ? med.times : ["", "", ""]).map((time, i) => {
                          const taken = new Set(
                            (Array.isArray(med.times) ? med.times : ["", "", ""])
                              .filter((_, idx) => idx !== i)
                              .filter(Boolean)
                          );

                          return (
                            <CFormSelect
                              key={i}
                              size="sm"
                              value={time || ""}
                              onChange={(e) => {
                                const updated = Array.isArray(med.times) ? [...med.times] : ["", "", ""];
                                updated[i] = e.target.value;
                                handleUpdate(index, 'times', updated);
                              }}
                            >
                              <option value="">Select Time…</option>
                              {slotOptions.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  disabled={taken.has(opt.value)}
                                >
                                  {opt.label} {/* Show full label in dropdown */}
                                </option>
                              ))}
                            </CFormSelect>
                          );
                        })}
                      </div>
                    ) : (
                      (Array.isArray(med.times) ? med.times : [])
                        .filter((t) => t && t.trim())
                        .map((t) => slotLegendMap[t] || t) // Show legend in view mode
                        .join(", ") || "NA"
                    )}
                  </CTableDataCell>
                  {/* Action */}
                  <CTableDataCell className="text-end" style={{ whiteSpace: 'nowrap' }}>
                    {editingIndex === index ? (
                      <CButton
                        color="success"
                        size="sm"
                        className="me-1"
                        onClick={() => setEditingIndex(null)}
                      >
                        <CIcon icon={cilCheck} />
                      </CButton>
                    ) : (
                      <CButton
                        color="primary"
                        variant="outline"
                        size="sm"
                        className="me-1"
                        onClick={() => setEditingIndex(index)}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                    )}
                    <CButton
                      color="danger"
                      variant="outline"
                      size="sm"
                      onClick={() => setMedicines(medicines.filter((_, i) => i !== index))}
                    >
                      <CIcon icon={cilTrash} />
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </div>
      )}

      {selectedPrescriptionMedicines.length > 0 && (
        <div className="d-flex flex-wrap gap-3 pb-5">
          {selectedPrescriptionMedicines.map((med, idx) => (
            <div key={med.id || idx} style={{ flex: '1 1 48%' }}>
              <MedicineCard
                index={idx}
                medicine={med}
                isDuplicateName={isDuplicateName}
                updateMedicine={(updated) => {
                  const updatedList = [...selectedPrescriptionMedicines]
                  updatedList[idx] = updated
                  setSelectedPrescriptionMedicines(updatedList)
                }}
                removeMedicine={() => {
                  const updatedList = selectedPrescriptionMedicines.filter((_, i) => i !== idx)
                  setSelectedPrescriptionMedicines(updatedList)
                }}
                onAdd={(m) => {
                  if (isDuplicateName(m?.name)) {
                    info('Medicine already added', { title: 'Duplicate' })
                    return
                  }
                  setMedicines([...medicines, m])
                  setSelectedPrescriptionMedicines(
                    selectedPrescriptionMedicines.filter((_, i) => i !== idx),
                  )
                }}
              />
            </div>
          ))}
        </div>
      )}

      {activeMedicine && (
        <div className="d-flex flex-wrap gap-3 pb-5">
          <div style={{ flex: '1 1 48%' }}>
            <MedicineCard
              index={medicines.length}
              medicine={activeMedicine}
              updateMedicine={(updated) => setActiveMedicine(updated)}
              removeMedicine={() => setActiveMedicine(null)}
              isDuplicateName={isDuplicateName}
              onAdd={(m) => {
                if (isDuplicateName(m?.name)) {
                  info('Medicine already added', { title: 'Duplicate' })
                  return
                }
                setMedicines([...medicines, m])
                setActiveMedicine(null)
              }}
            />
          </div>
        </div>
      )}

      {!search && (
        <div
          className="position-fixed bottom-0 rigth-0 p-3  "
          style={{ zIndex: 1000, width: '75%', backgroundColor: '#F3f3f7' }}
        >
          <div className="d-flex justify-content-between align-items-end w-100  ">
            <div className="d-flex gap-4">
              <Button
                customColor={COLORS.bgcolor}
                color={COLORS.black}
                className="ms-2"
                size="medium"
                onClick={() => {
                  if (hasPendingCards) {
                    warning('Please add the medicine to the table before saving/going next.', { title: 'Info' })
                  } else {
                    saveTemplate()
                  }
                }}
                style={{
                  opacity: hasPendingCards ? 0.5 : 1,   // looks disabled
                  pointerEvents: 'auto',                // clickable even when "disabled"
                  cursor: hasPendingCards ? 'not-allowed' : 'pointer',
                }}
              >
                Save Medicine Template
              </Button>

              {/* <Button
                className="ms-2"
                size="medium"
                customColor={COLORS.success}
                onClick={() => setShowTemplateModal(true)}
              >
                Load Medicine Template
              </Button> */}
            </div>
            <div>
              <Button
                size="medium"
                customColor={COLORS.bgcolor}
                color={COLORS.black}
                onClick={() => {
                  if (hasPendingCards) {
                    warning('Please add the medicine to the table before saving/going next.', { title: 'Info' })
                  } else {
                    handleNext()
                  }
                }}
                style={{
                  opacity: hasPendingCards ? 0.5 : 1,
                  pointerEvents: 'auto',
                  cursor: hasPendingCards ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </Button>

            </div>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <TemplateModal
          templates={templates}
          onClose={() => setShowTemplateModal(false)}
          onSelect={loadTemplate}
        />
      )}
    </div>
  )
}

export default PrescriptionTab
