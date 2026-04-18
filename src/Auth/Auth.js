import axios from 'axios'
import api from './axiosInterceptor'
import {
  appointmentsbaseUrl,
  appointmentsCountbaseUrl,
  clinicbaseUrl,
  doctorbaseUrl,
  updateLoginEndpoint,
  testsbaseUrl,
  diseasesbaseUrl,
  treatmentsbaseUrl,
  ratingsbaseUrl,
  savePrescriptionbaseUrl,
  todayappointmentsbaseUrl,
  addDiseaseUrl, getVisitHistoryByPatientIdAndDoctorIdEndpoint,
  getdoctorSaveDetailsEndpoint,
  Get_ReportsByBookingId,
  reportbaseUrl,
  AllReports, getDoctorSlotsEndpoint,
  adminBaseUrl,
  treatmentUrl,
  labtestsbase,
  baseUrl,
  labtestsupdatedbase,
  addtreatmentUrl,
  visitHistoryBypatientIdAndBookingId,
  todayfutureappointmentsbaseUrl,
  bookingDetailsUrl,
  therapistUrl,
  therapyExercisesUrl,
  programUrl,
  programAllUrl,
  therapyUrl,
  exerciseUrl,
  packageUrl,
  programUrlId,
  therapyUrlId,
  exerciseUrlId,
  packageUrlId,
} from './BaseUrl'

export const postLogin = async (payload, endpoint) => {
  try {
    const response = await api.post(`${endpoint}`, payload, {
      validateStatus: () => true,
    })
    console.log('Login Response:', response.data)
    return response.data
  } catch (error) {
    console.error('Login Failed:', error.response?.data || error.message)
    return {
      success: false,
      message: error.response?.data?.message || 'Login error occurred',
    }
  }
}

export const getDoctorDetails = async () => {
  const doctorId = localStorage.getItem('doctorId')
  try {
    const response = await api.get(`${doctorbaseUrl}/${doctorId}`)
    const doctorData = response.data.data
    console.log('✅ Doctor Details:', doctorData)
    return doctorData
  } catch (error) {
    console.error('❌ Error fetching doctor details:', error)
    throw error
  }
}

export const getClinicDetails = async () => {
  const hospitalId = localStorage.getItem('hospitalId')
  try {
    const response = await api.get(`${clinicbaseUrl}/${hospitalId}`, {})
    console.log(response.data.data)
    return response.data.data
  } catch (error) {
    console.error('❌ Error fetching clinic details:', error)
    throw error
  }
}

export const getTodayAppointments = async () => {
  const doctorId = localStorage.getItem("doctorId")
  const hospitalId = localStorage.getItem("hospitalId")
  try {
    const response = await api.get(
      `${todayappointmentsbaseUrl}/${hospitalId}/${doctorId}`,
      { responseType: 'json' }
    )
    return {
      statusCode: response.data?.statusCode ?? response.status ?? 500,
      data: Array.isArray(response.data?.data) ? response.data.data : [],
      message: response.data?.message ?? "No message from server",
    }
  } catch (error) {
    return {
      statusCode: error.response?.status ?? 500,
      data: [],
      message: error.message ?? "Network Error",
    }
  }
}

export const getTodayFutureAppointments = async () => {
  const doctorId = localStorage.getItem("doctorId")
  const hospitalId = localStorage.getItem("hospitalId")
  try {
    const response = await api.get(
      `${todayfutureappointmentsbaseUrl}/${doctorId}`,
      { responseType: 'json' }
    )
    return {
      statusCode: response.data?.statusCode ?? response.status ?? 500,
      data: Array.isArray(response.data?.data) ? response.data.data : [],
      message: response.data?.message ?? "No message from server",
    }
  } catch (error) {
    return {
      statusCode: error.response?.status ?? 500,
      data: [],
      message: error.message ?? "Network Error",
    }
  }
}

export const getAppointments = async (number) => {
  const doctorId = localStorage.getItem('doctorId')
  const hospitalId = localStorage.getItem('hospitalId')
  try {
    const response = await api.get(`${appointmentsbaseUrl}/${hospitalId}/${doctorId}/${number}`)
    const appointments = response?.data?.data
    return Array.isArray(appointments) ? appointments : []
  } catch (error) {
    console.error('❌ Error fetching appointment details:', error)
    return []
  }
}

export const getAppointmentsCount = async (number) => {
  const doctorId = localStorage.getItem('doctorId')
  const hospitalId = localStorage.getItem('hospitalId')
  try {
    const response = await api.get(`${appointmentsCountbaseUrl}/${hospitalId}/${doctorId}`)
    return response?.data ?? { completedAppointmentsCount: 0 }
  } catch (error) {
    console.error('Error fetching completed appointments count:', error)
    return { completedAppointmentsCount: 0 }
  }
}

export const SavePrescription = async (prescriptionData) => {
  try {
    const response = await api.post(
      `${savePrescriptionbaseUrl}/createPrescription`,
      prescriptionData,
    )
    const result = response?.data
    return result?.success ? result.data : null
  } catch (error) {
    console.error('❌ Error saving prescription:', error)
    return null
  }
}

export const SearchPrescription = async () => {
  try {
    const response = await api.get(`${savePrescriptionbaseUrl}/searchMedicines`)
    const result = response?.data
    return result?.success ? result.data : []
  } catch (error) {
    console.error('❌ Error fetching prescriptions:', error)
    return []
  }
}

export const SavePatientPrescription = async (prescriptionData) => {
  try {
    if (Array.isArray(prescriptionData)) {
      throw new Error('Expected a single object, but received an array.')
    }
    const response = await axios.post(
      `${savePrescriptionbaseUrl}/create`,
      prescriptionData,
    )
    const result = response?.data
    console.log(result)
    return result ? result : null
  } catch (error) {
    console.error('❌ Error saving prescription:', error)
    return null
  }
}

export const getDoctorSaveDetails = async (disease) => {
  console.log(disease)
  const hospitalId = localStorage.getItem('hospitalId')
  try {
    const response = await api.get(
      `${savePrescriptionbaseUrl}/getTemplatesByClinicIdAndTitle/${hospitalId}/${disease}`,
    )
    console.log(response?.data)
    const result = response?.data
    if (response.status == 200) {
      return result ? result.data : null
    }
  } catch (error) {
    console.error('❌ Error getting prescription:', error)
    return null
  }
}

export const medicineTemplate = async () => {
  const clinicId = localStorage.getItem('hospitalId')
  try {
    const response = await api.get(
      `${savePrescriptionbaseUrl}/getPrescriptionsByClinicId/${clinicId}`,
    )
    const result = response?.data
    return result?.success ? result.data : null
  } catch (error) {
    console.error('❌ Error saving prescription:', error)
    return null
  }
}

export const getAllLabTests = async () => {
  try {
    const response = await api.get(`${testsbaseUrl}`)
    if (response.data.success) {
      console.log('Lab tests:', response.data.data)
      return response.data.data
    } else {
      console.error('Failed to fetch lab tests:')
    }
  } catch (error) { }
}

export const getLabTests = async () => {
  const hospitalId = localStorage.getItem("hospitalId")
  if (!hospitalId) {
    console.warn("⚠️ No hospitalId found in localStorage")
    return []
  }
  try {
    const response = await api.get(`${labtestsbase}/${hospitalId}`)
    if (response.data?.success) {
      console.log("✅ Lab tests:", response.data.data)
      return response.data.data
    } else {
      console.error("❌ Failed to fetch lab tests:", response.data?.message || "Unknown error")
      return []
    }
  } catch (error) {
    console.error("🚨 Error fetching lab tests:", error)
    return []
  }
}

export const addLabTest = async (testName) => {
  const hospitalId = localStorage.getItem("hospitalId")
  if (!hospitalId || !testName) return null
  try {
    const response = await api.post(`${labtestsupdatedbase}`, { hospitalId, testName })
    return response.data?.data?.[0] || testName
  } catch (error) {
    console.error("Error adding lab test:", error)
    return testName
  }
}

export const getAllDiseases = async () => {
  const hospitalId = localStorage.getItem("hospitalId")
  if (!hospitalId) {
    console.warn("⚠️ No hospitalId found in localStorage")
    return []
  }
  try {
    const response = await api.get(`${diseasesbaseUrl}/${hospitalId}`)
    console.log("✅ All Diseases Response:", response.data)
    if (response?.data?.success) {
      return Array.isArray(response.data.data) ? response.data.data : []
    } else {
      console.error("❌ Failed to fetch diseases:", response?.data?.message)
      return []
    }
  } catch (error) {
    console.error("❌ Error fetching diseases:", error.response?.data || error.message)
    return []
  }
}

export const getAllTreatments = async () => {
  const hospitalId = localStorage.getItem("hospitalId")
  if (!hospitalId) {
    console.warn("⚠️ No hospitalId found in localStorage")
    return []
  }
  try {
    const response = await api.get(`${treatmentsbaseUrl}`)
    if (response.data.success) {
      console.log('Treatments:', response.data.data)
      return response.data.data
    } else {
      console.error('Failed to fetch treatments:', response.data.message)
      return []
    }
  } catch (error) {
    console.error('Error fetching treatments:', error)
    return []
  }
}

export const getAllTreatmentsByHospital = async () => {
  const hospitalId = localStorage.getItem("hospitalId")
  if (!hospitalId) {
    console.warn("⚠️ No hospitalId found in localStorage")
    return []
  }
  try {
    const response = await api.get(`${treatmentUrl}/${hospitalId}`)
    console.log("✅ All Treatments Response:", response.data)
    if (response?.data?.success) {
      return Array.isArray(response.data.data) ? response.data.data : []
    } else {
      console.error("❌ Failed to fetch treatments:", response?.data?.message)
      return []
    }
  } catch (error) {
    console.error("❌ Error fetching treatments:", error.response?.data || error.message)
    return []
  }
}

export const addTreatmentByHospital = async (treatmentName) => {
  const hospitalId = localStorage.getItem("hospitalId")
  if (!hospitalId || !treatmentName) return null
  try {
    const response = await api.post(`${addtreatmentUrl}`, { hospitalId, treatmentName })
    return response.data?.data?.[0] || treatmentName
  } catch (error) {
    console.error("Error adding treatment:", error)
    return treatmentName
  }
}

export const getTreatmentStatusByVisitId = async (patientId, bookingId) => {
  try {
    const response = await fetch(`${visitHistoryBypatientIdAndBookingId}/${patientId}/${bookingId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch treatment status (HTTP ${response.status})`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching treatment status:", error)
    throw error
  }
}

export const averageRatings = async (doctorId) => {
  try {
    const response = await api.get(`${ratingsbaseUrl}/${doctorId}`)
    if (response.data?.success && response.data?.data) {
      const {
        overallDoctorRating = 0,
        overallHospitalRating = 0,
        comments = [],
        ratingCategoryStats = [],
      } = response.data.data
      return {
        doctorRating: overallDoctorRating,
        hospitalRating: overallHospitalRating,
        comments,
        ratingStats: ratingCategoryStats,
        message: response.data?.message || "No patient ratings available",
      }
    } else {
      return {
        doctorRating: 0,
        hospitalRating: 0,
        comments: [],
        ratingStats: [],
        message: response.data?.message || "No patient ratings available",
      }
    }
  } catch (error) {
    console.error("Error fetching ratings:", error)
    return {
      doctorRating: 0,
      hospitalRating: 0,
      comments: [],
      ratingStats: [],
      message: "No patient ratings available",
    }
  }
}

export const updateLogin = async (payload, userName) => {
  try {
    const response = await api.put(`/api/doctors/update-password/${userName}`, payload)
    return response.data
  } catch (err) {
    console.error('Update login error:', err)
    throw err
  }
}

export const addDisease = async ({ diseaseName, probableSymptoms, notes }) => {
  const clinicId = localStorage.getItem('hospitalId')
  const payload = {
    diseaseName,
    probableSymptoms,
    notes,
    hospitalId: clinicId,
  }
  try {
    const response = await api.post(`${addDiseaseUrl}/addDiseases`, payload)
    return response.data
  } catch (err) {
    console.error('addDisease error:', err)
    throw err
  }
}

export const getVisitHistoryByPatientIdAndDoctorId = async (patientId, doctorId) => {
  console.log(patientId)
  console.log(doctorId)
  try {
    const url = `${getVisitHistoryByPatientIdAndDoctorIdEndpoint}/${patientId}/${doctorId}`
    console.log(url)
    const response = await api.get(url)
    console.log("visithistory response", response.data)
    return {
      success: response.data?.success ?? false,
      status: response.status,
      message: response.data?.message ?? "",
      data: response.data?.data ?? {},
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.error("HTTP error:", error.response.status, error.response.data)
      throw new Error("No visit history available")
    } else if (error.request) {
      console.error("No response received:", error.request)
      throw new Error("No response received from server")
    } else {
      console.error("Error", error.message)
      throw error
    }
  }
}

export const ReportsData = async () => {
  try {
    const response = await api.get(`${reportbaseUrl}/${AllReports}`)
    const reports = response.data.data
    console.log(reports)
    return reports
  } catch (error) {
    console.error('Error fetching report by ID:', error.message)
    return null
  }
}

export const Get_ReportsByBookingIdData = async (bookingId) => {
  try {
    const response = await api.get(`${reportbaseUrl}/${Get_ReportsByBookingId}/${bookingId}`)
    console.log(response)
    return response.data.data
  } catch (error) {
    console.error('Error fetching report by ID:', error.message)
    return null
  }
}

export const getAdImages = async () => {
  try {
    const response = await api.get(`${adminBaseUrl}/categoryAdvertisement/getAll`)
    if (Array.isArray(response?.data) && response.data.length > 0) {
      return response.data
        .filter(item => item?.mediaUrlOrImage)
        .map(item => item.mediaUrlOrImage)
    }
    console.warn("⚠ No ad media found in API response:", response.data)
    return []
  } catch (error) {
    console.error("❌ Error fetching ad images:", error)
    return []
  }
}

export const getAdImagesView = async () => {
  try {
    const response = await api.get(`${adminBaseUrl}/doctorWebAds/getAll`)
    console.log("📌 API Raw Response:", response.data)
    if (Array.isArray(response?.data) && response.data.length > 0) {
      return response.data
        .filter((item) => item?.mediaUrlOrImage)
        .map((item) => ({
          id: item.id,
          url: item.mediaUrlOrImage,
          type: item.type || (item.mediaUrlOrImage.endsWith(".mp4") ? "video" : "image"),
        }))
    }
    console.warn("⚠️ No ad media found in API response:", response.data)
    return []
  } catch (error) {
    console.error("❌ Error fetching ads:", error)
    return []
  }
}

export const saveImagesToServer = async (files) => {
  try {
    console.log("📤 Sending files to server:", files.map(f => f.name))
    const formData = new FormData()
    files.forEach((file) => {
      formData.append("images", file, file.name)
    })
    const response = await api.post(`${adminBaseUrl}/images/save`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    console.log("✅ Save API Response:", response.data)
    return response.data
  } catch (error) {
    console.error("❌ Error saving images:", error)
    throw error
  }
}

export const loadImagesFromServer = async () => {
  try {
    console.log("📥 Requesting saved images...")
    const response = await api.get(`${adminBaseUrl}/images/getAll`)
    console.log("✅ Load API Response:", response.data)
    if (Array.isArray(response?.data) && response.data.length > 0) {
      return response.data.map((item) => ({
        id: item.id,
        url: item.url,
        type: item.type || (item.url.endsWith(".mp4") ? "video" : "image"),
        savedAt: item.savedAt || null,
      }))
    }
    console.warn("⚠️ No images found:", response.data)
    return []
  } catch (error) {
    console.error("❌ Error loading images:", error)
    return []
  }
}

export const clearImagesOnServer = async () => {
  try {
    console.log("🗑️ Requesting server to clear all images...")
    const response = await api.delete(`${adminBaseUrl}/images/clearAll`)
    console.log("✅ Clear API Response:", response.data)
    return response.data
  } catch (error) {
    console.error("❌ Error clearing images:", error)
    throw error
  }
}

export const getAvailableSlots = async (hospitalId, doctorId) => {
  try {
    const response = await api.get(`${getDoctorSlotsEndpoint}/${hospitalId}/${doctorId}`)
    console.log("Slots API response:", response.data)
    if (response.data && response.data.success) {
      const rawData = response.data.data
      const slotsData = Array.isArray(rawData)
        ? rawData.map(item => ({
          id: item.id,
          doctorId: item.doctorId,
          hospitalId: item.hospitalId,
          date: item.date,
          availableSlots: item.availableSlots || [],
          createdAt: item.createdAt,
        }))
        : []
      return {
        slots: slotsData,
        message: response.data.message,
        status: response.data.status,
      }
    } else {
      throw new Error(response.data?.message || 'Failed to fetch slots')
    }
  } catch (error) {
    console.error('Error fetching slots:', error)
    return {
      slots: [],
      message: error.message || 'Something went wrong',
      status: 'error',
    }
  }
}

export const getInProgressDetails = async (patientId, bookingId) => {
  try {
    const response = await api.get(
      `${baseUrl}/doctor In-progressDetails/${patientId}/${bookingId}`
    )
    console.log("✅ In-progress details:", response.data.data)
    return response.data.data
  } catch (error) {
    console.error("❌ Error fetching in-progress details:", error)
    throw error
  }
}

export const getMedicineTypes = async () => {
  const clinicId = localStorage.getItem("hospitalId")
  try {
    const response = await api.get(`${baseUrl}/getMedicineTypes/${clinicId}`)
    console.log("Fetched MedicineTypes:", response.data)
    return response.data?.data?.medicineTypes || []
  } catch (error) {
    console.error("Failed to fetch medicine types:")
    if (error.response) {
      console.error("Status:", error.response.status)
      console.error("Data:", error.response.data)
    } else {
      console.error(error.message)
    }
    return []
  }
}

export const addMedicineType = async (newType) => {
  const clinicId = localStorage.getItem("hospitalId")
  try {
    const response = await api.post(`${baseUrl}/search-or-add`, {
      clinicId,
      medicineTypes: [newType],
    })
    console.log("✅ Add MedicineType Response:", response.data)
    return newType
  } catch (error) {
    console.error("❌ Failed to add medicine type:", error.response?.data || error.message)
    return newType
  }
}

export const getPatientVitals = async (bookingId, patientId) => {
  if (!bookingId || !patientId) {
    console.warn('Booking ID or Patient ID is missing');
    return null;
  }

  try {
    const response = await api.get(
      `${baseUrl}/getVitals/${bookingId}/${patientId}`
    );

    if (response?.data?.success) {
      const vitalsArray = response.data.data || [];

      console.log('Fetched Vitals Array:', vitalsArray);

      const vitals = vitalsArray[0] || {}; // ✅ FIX HERE

      console.log('Vitals Object:', vitals);

      return {
        height: vitals.height ?? '—',
        weight: vitals.weight ?? '—',
        bloodPressure: vitals.bloodPressure ?? '—',
        temperature: vitals.temperature ?? '—',
        bmi: vitals.bmi ?? '—',
      };
    } else {
      console.warn(
        'Vitals not found or API returned failure:',
        response?.data?.message
      );
      return null;
    }
  } catch (error) {
    console.error('Error fetching patient vitals:', error);
    return null;
  }
};

export const getBookedSlots = async (doctorId) => {
  try {
    const response = await api.get(`${baseUrl}/getDoctorFutureAppointments/${doctorId}`)
    console.log("API response for booked slots:", response)
    console.log("Appointments array:", response.data?.data)
    return response.data?.data || []
  } catch (error) {
    console.error("Failed to fetch appointments:", error)
    return []
  }
}

export const getAllMedicines = async () => {
  const clinicId = localStorage.getItem("hospitalId")
  if (!clinicId) {
    console.warn("⚠️ No hospitalId found in localStorage")
    return []
  }
  try {
    const url = `${baseUrl}/getListOfMedicinesByClinicId/${clinicId}`
    console.log("📡 Fetching medicines from:", url)
    const response = await api.get(url)
    console.log("✅ Raw Medicines Response:", response.data)
    if (response?.data?.success && Array.isArray(response.data.data)) {
      const medicines = response.data.data[0]?.listOfMedicines || []
      const normalized = medicines.map((name, index) => ({
        id: index,
        name,
      }))
      console.log("📋 Extracted Medicines:", normalized)
      return normalized
    } else {
      console.error("❌ Failed to fetch medicines:", response?.data?.message)
      return []
    }
  } catch (error) {
    console.error("❌ Error fetching medicines:", error.response?.data || error.message)
    return []
  }
}

export const addOrSearchMedicine = async (medicineName) => {
  const clinicId = localStorage.getItem("hospitalId")
  if (!clinicId) {
    console.warn("⚠️ No hospitalId found in localStorage")
    return null
  }
  try {
    const url = `${baseUrl}/addOrSearchListOfMedicine`
    const payload = {
      clinicId,
      listOfMedicines: [medicineName],
    }
    console.log("📡 Adding medicine:", payload)
    const response = await api.post(url, payload)
    if (response?.data?.success) {
      console.log("✅ Medicine added:", response.data)
      return true
    } else {
      console.error("❌ Failed to add medicine:", response?.data?.message)
      return false
    }
  } catch (error) {
    console.error("❌ Error adding medicine:", error.response?.data || error.message)
    return false
  }
}

export const getBookingDetails = async (clinicId, branchId) => {
  try {
    const response = await api.get(`${bookingDetailsUrl}/${clinicId}/${branchId}`)
    return response.data
  } catch (error) {
    console.error('❌ Booking API Error:', error)
    throw error
  }
}

export const getTherapists = async (clinicId, branchId) => {
  try {
    const response = await api.get(`${therapistUrl}/${clinicId}/${branchId}`)
    console.log("✅ Therapist API:", response.data)
    return response.data?.data || []
  } catch (error) {
    console.error("❌ Therapist API Error:", error)
    return []
  }
}

export const getTherapyExercises = async (clinicId, branchId) => {
  try {
    const response = await api.get(`${therapyExercisesUrl}/${clinicId}/${branchId}`)
    console.log('✅ Therapy Exercises API:', response.data)
    return response.data?.data || []
  } catch (error) {
    console.error('❌ Therapy Exercises API Error:', error)
    return []
  }
}

export const createDoctorSaveDetails = async (prescriptionData) => {
  try {
    if (!prescriptionData || typeof prescriptionData !== 'object' || Array.isArray(prescriptionData)) {
      throw new Error('Expected a single object, but received invalid data.')
    }
    console.log("📦 Sending Payload:", prescriptionData)
    const response = await api.post(
      `${savePrescriptionbaseUrl}/create`,
      prescriptionData
    )
    console.log("✅ API Response:", response.data)
    const result = response?.data
    return result?.success ? result.data : result
  } catch (error) {
    console.error('❌ Error saving prescription:', error?.response || error.message)
    return null
  }
}

// =============================
// ✅ Get packages by clinicId & branchId (list)
export const getPackagesByBranch = async (clinicId, branchId) => {
  try {
    const response = await api.get(`${packageUrl}/${clinicId}/${branchId}`)
    console.log('✅ Packages by Branch API:', response.data)
    const raw = response.data?.data ?? response.data ?? []
    return Array.isArray(raw) ? raw : []
  } catch (error) {
    console.error('❌ Packages by Branch API Error:', error)
    return []
  }
}

// ✅ FIX: Get single package detail by ID — returns the full object, NOT forced into array
export const getPackagesByBranchAndId = async (clinicId, branchId, packagesId) => {
  try {
    const response = await api.get(`${packageUrlId}/${clinicId}/${branchId}/${packagesId}`)
    console.log('✅ Package Detail API (full response):', response.data)
    // The API returns { success, data: { packageId, programs: [...], ... }, message, status }
    // We must return the data object directly — NOT coerce it to an array
    const raw = response.data?.data ?? response.data ?? null
    // If raw is an array (unexpected), take the first element; otherwise return as-is
    return Array.isArray(raw) ? (raw[0] ?? null) : raw
  } catch (error) {
    console.error('❌ Package Detail API Error:', error)
    return null
  }
}

// ===============================
// ✅ Get programs by clinicId & branchId
export const getProgramsByBranch = async (clinicId, branchId) => {
  try {
    const response = await api.get(`${programUrl}/${clinicId}/${branchId}`)
    console.log('✅ Programs by Branch API:', response.data)
    const raw = response.data?.data ?? response.data ?? []
    return Array.isArray(raw) ? raw : []
  } catch (error) {
    console.error('❌ Programs by Branch API Error:', error)
    return []
  }
}

export const getProgramsByBranchAndId = async (clinicId, branchId, programId) => {
  try {
    const response = await api.post(`${programUrlId}/${clinicId}/${branchId}/${programId}`)
    console.log('✅ Programs by Branch+ID API:', response.data)
    const raw = response.data?.data ?? response.data ?? null
    return Array.isArray(raw) ? (raw[0] ?? null) : raw
  } catch (error) {
    console.error('❌ Programs by Branch+ID API Error:', error)
    return null
  }
}

// ==============================
// ✅ Get therapies by clinicId & branchId
export const getTherapiesByBranch = async (clinicId, branchId) => {
  try {
    const response = await api.get(`${therapyUrl}/${clinicId}/${branchId}`)
    console.log('✅ Therapies by Branch API:', response.data)
    const raw = response.data?.data ?? response.data ?? []
    return Array.isArray(raw) ? raw : []
  } catch (error) {
    console.error('❌ Therapies by Branch API Error:', error)
    return []
  }
}

export const getTherapiesByBranchAndId = async (clinicId, branchId, therapyId) => {
  try {
    const response = await api.get(`${therapyUrlId}/${therapyId}/${clinicId}/${branchId}`)
    console.log('✅ Therapy Detail API:', response.data)
    const raw = response.data?.data ?? response.data ?? null
    return Array.isArray(raw) ? (raw[0] ?? null) : raw
  } catch (error) {
    console.error('❌ Therapy Detail API Error:', error)
    return null
  }
}

// =============================
// ✅ Get exercises by clinicId & branchId
export const getExercisesByBranch = async (clinicId, branchId) => {
  try {
    const response = await api.get(`${exerciseUrl}/${clinicId}/${branchId}`)
    console.log('✅ Exercises by Branch API:', response.data)
    const raw = response.data?.data ?? response.data ?? []
    return Array.isArray(raw) ? raw : []
  } catch (error) {
    console.error('❌ Exercises by Branch API Error:', error)
    return []
  }
}

export const getExercisesByBranchAndIdAndId = async (clinicId, branchId, exerciseId) => {
  try {
    const response = await api.get(`${exerciseUrlId}/${clinicId}/${branchId}/${exerciseId}`)
    console.log('✅ Exercise Detail API:', response.data)
    const raw = response.data?.data ?? response.data ?? null
    return Array.isArray(raw) ? (raw[0] ?? null) : raw
  } catch (error) {
    console.error('❌ Exercise Detail API Error:', error)
    return null
  }
}

// =============================
// ✅ Get all programs (fallback)
export const getPrograms = async () => {
  try {
    const response = await api.get(`${programAllUrl}`)
    console.log('✅ All Programs API:', response.data)
    const raw = response.data?.data ?? response.data ?? []
    return Array.isArray(raw) ? raw : []
  } catch (error) {
    console.error('❌ All Programs API Error:', error)
    return []
  }
}