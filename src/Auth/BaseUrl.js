export const ipUrl = 'http://3.111.28.174:9090'
export const baseUrl = `${ipUrl}/api/doctors`

// Login
export const loginEndpoint = 'login'
export const updateLoginEndpoint = 'update-password'

// Admin
export const adminBaseUrl = `${ipUrl}/admin`
export const clinicbaseUrl = `${ipUrl}/admin/getClinicById`

// Doctor
export const doctorbaseUrl = `${ipUrl}/clinic-admin/doctor`
export const getdoctorSaveDetailsEndpoint = `${ipUrl}/api/doctors/getDoctorSaveDetailsById`
export const getVisitHistoryByPatientIdAndDoctorIdEndpoint = `${ipUrl}/api/doctors/getVisitHistoryByPatientIdAndDoctorId`
export const visitHistoryBypatientIdAndBookingId = `${ipUrl}/api/doctors/visitHistoryBypatientIdAndBookingId`
export const getDoctorSlotsEndpoint = `${ipUrl}/clinic-admin/getDoctorslots`

// Appointments
export const todayappointmentsbaseUrl = `${ipUrl}/api/doctors/appointments/today`
export const todayfutureappointmentsbaseUrl = `${ipUrl}/api/doctors/getFutureDoctorappointmentsByDoctorId`
export const appointmentsbaseUrl = `${ipUrl}/api/doctors/appointments/filter`
export const appointmentsCountbaseUrl = `${ipUrl}/api/doctors/appointments/completed`
export const bookingDetailsUrl = `${ipUrl}/clinic-admin/getAllbookingsDetailsByClinicAndBranchId`

// Lab Tests
export const testsbaseUrl = `${ipUrl}/clinic-admin/labtest/getAllLabTests`
export const labtestsbase = `${ipUrl}/clinic-admin/labtests`
export const labtestsupdatedbase = `${ipUrl}/clinic-admin/addOrGetTest`

// Diseases
export const diseasesbaseUrl = `${ipUrl}/clinic-admin/diseases`
export const addDiseaseUrl = `${ipUrl}/clinic-admin`

// Treatments
export const treatmentsbaseUrl = `${ipUrl}/clinic-admin/treatment/getAllTreatments`
export const treatmentUrl = `${ipUrl}/clinic-admin/treatments`
export const addtreatmentUrl = `${ipUrl}/clinic-admin/addOrGetTreatment`

// Ratings
export const ratingsbaseUrl = `${ipUrl}/clinic-admin/getAverageRatingsByDoctorId`

// Reports
export const reportbaseUrl = `${ipUrl}/clinic-admin`
export const AllReports = `getallreports`
export const SavingReports = `savereports`
export const Get_ReportsByBookingId = `getReportByBookingId`

// Physiotherapy — Prescription
export const savePrescriptionbaseUrl = `${ipUrl}/api/physiotherapy-doctor/physiotherapy-record`

// Physiotherapy — Therapist & Exercises
export const therapistUrl = `${ipUrl}/clinic-admin/getByTherapistClinicIdAndBranchId`
export const therapyExercisesUrl = `${ipUrl}/clinic-admin/getBytherapyExercisesClinicIdAndBranchId`

// ✅ Programs (by clinicId & branchId)
export const programUrl = `${ipUrl}/clinic-admin/program/getBycIdAndbId`
export const programUrlId = `${ipUrl}/clinic-admin/program/getBycIdAndbIdAndId`

export const packageUrl = `${ipUrl}/clinic-admin/getPackageByClinicIdAndBranchId`
export const packageUrlId = `${ipUrl}/clinic-admin/getPackageWithProgramsByUsingClinicIdBranchIdAndPackageId`

export const therapyUrl = `${ipUrl}/clinic-admin/getByTherapyServiceClinicIdAndBranchId`
export const therapyUrlId = `${ipUrl}/clinic-admin/getTherapyServiceWithExercises`

export const exerciseUrl = `${ipUrl}/clinic-admin/getBytherapyExercisesClinicIdAndBranchId`
export const exerciseUrlId = `${ipUrl}/clinic-admin/getBytherapyExercisesClinicIdAndBranchIdAndtherapyExercisesId`

// ✅ Programs — getAll
export const programAllUrl = `${ipUrl}/clinic-admin/program/getAll`