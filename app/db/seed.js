require('dotenv').config();

const { pool, ensureDatabaseUrl } = require('../config/databases');

// Stable IDs make this script safe to re-run. Never use the sample passwords in production.
const rows = [
  ['User', ['id', 'username', 'email', 'passwordHash', 'role'], ['usr_admin', 'campus.admin', 'admin@smartcampus.edu', 'CHANGE_ME_BEFORE_PRODUCTION', 'ADMIN']],
  ['Department', ['id', 'departmentCode', 'departmentName', 'officeEmail', 'building'], ['dept_cse', 'CSE', 'Computer Science and Engineering', 'cse@smartcampus.edu', 'Academic Block A']],
  ['Program', ['id', 'programCode', 'programName', 'degreeType', 'departmentId', 'durationYears', 'totalSemesters'], ['prog_btech_cse', 'BTECH-CSE', 'B.Tech Computer Science and Engineering', 'UNDERGRADUATE', 'dept_cse', 4, 8]],
  ['User', ['id', 'username', 'email', 'passwordHash', 'role'], ['usr_faculty', 'priya.sharma', 'priya@smartcampus.edu', 'CHANGE_ME_BEFORE_PRODUCTION', 'FACULTY']],
  ['Faculty', ['id', 'userId', 'employeeId', 'firstName', 'lastName', 'mobileNo', 'email', 'departmentId', 'designation', 'joiningDate'], ['fac_priya', 'usr_faculty', 'FAC-001', 'Priya', 'Sharma', '9876500001', 'priya@smartcampus.edu', 'dept_cse', 'Associate Professor', '2020-07-01']],
  ['User', ['id', 'username', 'email', 'passwordHash', 'role'], ['usr_student', 'aarav.patel', 'aarav@smartcampus.edu', 'CHANGE_ME_BEFORE_PRODUCTION', 'STUDENT']],
  ['Student', ['id', 'userId', 'enrollmentNo', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'mobileNo', 'email', 'departmentId', 'programId', 'admissionYear', 'currentYear', 'currentSemester', 'section'], ['stu_aarav', 'usr_student', 'CSE-2024-001', 'Aarav', 'Patel', '2006-05-14', 'MALE', '9876500002', 'aarav@smartcampus.edu', 'dept_cse', 'prog_btech_cse', 2024, 2, 3, 'A']],
  ['Building', ['id', 'buildingCode', 'buildingName', 'numberOfFloors'], ['bld_academic_a', 'A', 'Academic Block A', 4]],
  ['Classroom', ['id', 'buildingId', 'roomNumber', 'roomName', 'floor', 'capacity', 'roomType', 'hasProjector', 'hasWifi'], ['room_a101', 'bld_academic_a', 'A101', 'CSE Smart Classroom', 1, 60, 'CLASSROOM', true, true]],
  ['Course', ['id', 'courseCode', 'courseName', 'departmentId', 'programId', 'semester', 'credits', 'lectureHours'], ['course_ds', 'CS201', 'Data Structures', 'dept_cse', 'prog_btech_cse', 3, 4, 4]],
  ['CourseFaculty', ['id', 'courseId', 'facultyId', 'academicYear', 'semester', 'section'], ['cf_ds_priya', 'course_ds', 'fac_priya', '2025-2026', 3, 'A']],
  ['AttendanceSession', ['id', 'courseId', 'facultyId', 'classroomId', 'date', 'startTime', 'endTime', 'attendanceMethod', 'status'], ['as_ds_001', 'course_ds', 'fac_priya', 'room_a101', '2025-08-04', '2025-08-04T09:00:00.000Z', '2025-08-04T10:00:00.000Z', 'QR', 'COMPLETED']],
  ['AttendanceRecord', ['id', 'sessionId', 'studentId', 'status', 'verificationMethod'], ['ar_aarav_001', 'as_ds_001', 'stu_aarav', 'PRESENT', 'QR']],
  ['Bus', ['id', 'busNumber', 'registrationNumber', 'vehicleModel', 'capacity', 'seatingCapacity', 'busType', 'fuelType'], ['bus_001', 'BUS-01', 'KA-01-AB-1234', 'Tata Starbus', 50, 45, 'NON_AC', 'DIESEL']],
  ['Route', ['id', 'routeCode', 'routeName', 'startPoint', 'endPoint', 'totalDistance', 'estimatedDuration'], ['route_001', 'R-01', 'Central City Route', 'Central Station', 'Smart Campus', 18.5, 55]],
  ['BusStop', ['id', 'stopCode', 'stopName', 'latitude', 'longitude', 'stopOrder', 'routeId'], ['stop_001', 'R01-01', 'Central Station', 12.9716, 77.5946, 1, 'route_001']],
  ['Book', ['id', 'isbn', 'title', 'author', 'category', 'totalCopies', 'availableCopies'], ['book_ds', '9780132576277', 'Data Structures and Algorithms', 'Michael T. Goodrich', 'Computer Science', 3, 3]],
  ['BookCopy', ['id', 'bookId', 'accessionNumber', 'condition', 'status'], ['copy_ds_001', 'book_ds', 'ACC-CS-001', 'GOOD', 'AVAILABLE']],
  ['FeeStructure', ['id', 'programId', 'academicYear', 'semester', 'tuitionFee', 'totalFee', 'dueDate'], ['fee_cse_s3', 'prog_btech_cse', '2025-2026', 3, 75000, 75000, '2025-09-30']],
  ['StudentFee', ['id', 'studentId', 'feeStructureId', 'amountDue', 'amountPaid', 'balance', 'dueDate', 'status'], ['sf_aarav_s3', 'stu_aarav', 'fee_cse_s3', 75000, 0, 75000, '2025-09-30', 'PENDING']],
  ['Notice', ['id', 'title', 'content', 'createdById', 'targetRole', 'publishedAt'], ['notice_001', 'Welcome to Smart Campus', 'The Smart Campus portal is ready for students and staff.', 'usr_admin', 'ALL', '2025-07-01']],
  ['MenuItem', ['id', 'name', 'category', 'price'], ['menu_tea', 'Masala Tea', 'BEVERAGES', 15]],
  ['Company', ['id', 'companyName', 'industry', 'website'], ['company_001', 'TechNova Solutions', 'Information Technology', 'https://example.com']],
  ['JobDrive', ['id', 'companyId', 'jobTitle', 'location', 'salaryPackage', 'minimumCgpa', 'status'], ['job_001', 'company_001', 'Software Engineer Intern', 'Bengaluru', '₹6 LPA', 7, 'OPEN']],
  ['CampusLocation', ['id', 'name', 'category', 'buildingId', 'floor', 'description'], ['loc_library', 'Central Library', 'LIBRARY', 'bld_academic_a', 1, 'First floor, Academic Block A']],
];

const quote = (identifier) => `"${identifier.replace(/"/g, '""')}"`;
const tablesWithUpdatedAt = new Set([
  'User', 'Department', 'Program', 'Faculty', 'Student', 'Course', 'Book',
  'StudentFee', 'Notice', 'CampusLocation', 'Bus', 'Route',
]);

async function seed() {
  ensureDatabaseUrl();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [table, columns, values] of rows) {
      const seedColumns = tablesWithUpdatedAt.has(table) ? [...columns, 'updatedAt'] : columns;
      const seedValues = tablesWithUpdatedAt.has(table) ? [...values, new Date()] : values;
      const placeholders = seedValues.map((_, index) => `$${index + 1}`).join(', ');
      await client.query(`INSERT INTO ${quote(table)} (${seedColumns.map(quote).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, seedValues);
    }
    await client.query('COMMIT');
    console.info(`Smart Campus seed complete: ${rows.length} representative records processed.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error.message || 'Unable to connect to the database.');
  process.exitCode = 1;
});
