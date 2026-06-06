// export const ipUrl = 'http://3.111.28.174:9090'
// export const ipUrl = 'http://3.111.28.174:9090'
// export const ipUrl = 'http://3.7.165.97:9090'
// export const ipUrl = 'http://3.7.216.95:9090'
export const ipUrl = 'https://api.ccmstestserver.online'


export const baseUrl = `${ipUrl}/api/physiotherapy-doctor`

// Login
export const loginUrl = `${baseUrl}/PhysioDoctorlogin`
export const updatePasswordEndpoint = 'update-PhysioDoctorpassword'
export const updateAvailabilityEndpoint = 'update-PhysioDoctorAvailability'
export const getDoctorByIdEndpoint = 'getDoctorById'

// Admin
export const adminBaseUrl = `${ipUrl}/admin`
export const clinicbaseUrl = `${ipUrl}/admin/getClinicById`

// Doctor
export const doctorbaseUrl = `${ipUrl}/api/physiotherapy-doctor`
export const getdoctorSaveDetailsEndpoint = `${baseUrl}/getDoctorSaveDetailsById`
// export const getVisitHistoryByPatientIdAndDoctorIdEndpoint = `${ipUrl}/api/doctors/getVisitHistoryByPatientIdAndDoctorId`
export const visitHistoryBypatientIdAndBookingId = `${baseUrl}/visitHistoryBypatientIdAndBookingId`
export const getDoctorSlotsEndpoint = `${ipUrl}/clinic-admin/getDoctorslots`

// Appointments
export const todayappointmentsbaseUrl = `${baseUrl}/getTodaysAppointmentsByUsingClinicIdAndDoctorId`
export const todayfutureappointmentsbaseUrl = `${baseUrl}/getFutureDoctorappointmentsByDoctorId`
export const appointmentsbaseUrl = `${baseUrl}/getDoctorAppointmentsonStatus`
export const appointmentsCountbaseUrl = `${baseUrl}/appointments/completed`
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

// Ratings & Feedback
export const ratingsbaseUrl = `${ipUrl}/clinic-admin/getAverageRatingsByDoctorId`
export const getDoctorFeedbackSummaryUrl = `${ipUrl}/clinic-admin/getDoctorFeedbackSummaryByCinicIdAndDoctorId`

// Reports
export const reportbaseUrl = `${ipUrl}/clinic-admin`
export const AllReports = `getallreports`
export const SavingReports = `savereports`
export const Get_ReportsByBookingId = `getReportByBookingId`

// Physiotherapy — Prescription
export const savePrescriptionbaseUrl = `${baseUrl}/physiotherapy-record`

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

// Physiotherapy — In Progress Details
export const getInProgressDetailsEndpoint = `${baseUrl}/getIn-progressByUsingPatientIdAndBookingId`

export const visitHistoryByPatientIdAndBookingIdEndpoint = `${baseUrl}/visitHistoryByUsingPatientIdAndBooking`
export const getExerciseSessionsWithRecordsEndpoint = `${baseUrl}/payment/getExerciseSessionsWithRecords`