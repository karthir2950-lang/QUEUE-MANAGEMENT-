export const mockUsers = [
  { id: 'u1', name: 'Karthi', email: 'karthi@example.com', phone: '9876543210', role: 'User', status: 'Active', joinedDate: '2026-01-15' },
  { id: 'u2', name: 'Arun Kumar', email: 'arun@example.com', phone: '9876543211', role: 'User', status: 'Active', joinedDate: '2026-02-20' },
  { id: 'u3', name: 'Priya', email: 'priya@example.com', phone: '9876543212', role: 'User', status: 'Active', joinedDate: '2026-03-10' }
];

export const mockStaff = [
  { id: 's1', name: 'Dr. Ramesh', department: 'General Consultation', service: 'Healthcare', branch: 'Main Branch', status: 'Active', todaysQueue: 12 },
  { id: 's2', name: 'Officer Suresh', department: 'Visa Processing', service: 'Government', branch: 'City Center', status: 'Active', todaysQueue: 45 }
];

export const mockOrganizations = [
  { id: 'org1', name: 'City Care Hospital', category: 'Healthcare', branch: 'Main Branch', services: 5, staff: 15, status: 'Active' },
  { id: 'org2', name: 'Global Bank', category: 'Banking', branch: 'Downtown', services: 4, staff: 10, status: 'Active' },
  { id: 'org3', name: 'Passport Office', category: 'Government', branch: 'City Center', services: 2, staff: 20, status: 'Active' }
];

export const mockServices = [
  { id: 'srv1', name: 'General Consultation', organizationId: 'org1', organizationName: 'City Care Hospital', category: 'Healthcare', averageServiceTime: 8, activeQueue: 15, status: 'Active', availableSlots: 12 },
  { id: 'srv2', name: 'Dental Checkup', organizationId: 'org1', organizationName: 'City Care Hospital', category: 'Healthcare', averageServiceTime: 20, activeQueue: 5, status: 'Active', availableSlots: 8 },
  { id: 'srv3', name: 'Cash Deposit/Withdrawal', organizationId: 'org2', organizationName: 'Global Bank', category: 'Banking', averageServiceTime: 5, activeQueue: 22, status: 'Active', availableSlots: 50 },
  { id: 'srv4', name: 'Visa Processing', organizationId: 'org3', organizationName: 'Passport Office', category: 'Government', averageServiceTime: 15, activeQueue: 45, status: 'Active', availableSlots: 30 }
];

export const mockAppointments = [
  { id: 'SQ-2026-00125', userId: 'u1', customerName: 'Karthi', serviceId: 'srv1', serviceName: 'General Consultation', organizationName: 'City Care Hospital', date: '2026-09-30', time: '10:30 AM', token: 'A025', status: 'Confirmed', type: 'Upcoming' },
  { id: 'SQ-2026-00089', userId: 'u1', customerName: 'Karthi', serviceId: 'srv3', serviceName: 'Cash Deposit/Withdrawal', organizationName: 'Global Bank', date: '2026-09-28', time: '11:15 AM', token: 'B112', status: 'Completed', type: 'Completed' },
  { id: 'SQ-2026-00130', userId: 'u2', customerName: 'Arun Kumar', serviceId: 'srv1', serviceName: 'General Consultation', organizationName: 'City Care Hospital', date: '2026-09-30', time: '10:15 AM', token: 'A023', status: 'Serving', type: 'Today' }
];

export const mockQueueEntries = [
  { id: 'q1', organizationId: 'org1', serviceId: 'srv1', queueId: 'Q-SRV1', currentToken: 'A019', waitingCount: 15, servingCount: 2, averageWait: 22, status: 'Active' },
  { id: 'q2', organizationId: 'org2', serviceId: 'srv3', queueId: 'Q-SRV3', currentToken: 'B050', waitingCount: 22, servingCount: 5, averageWait: 15, status: 'Active' }
];

export const mockNotifications = [
  { id: 'n1', userId: 'u1', title: 'Appointment Confirmed', message: 'Your appointment for General Consultation is confirmed.', time: '2 hours ago', read: false },
  { id: 'n2', userId: 'u1', title: 'Token Generated', message: 'Your token A025 has been generated.', time: '1 hour ago', read: false },
  { id: 'n3', userId: 'u1', title: 'Queue Update', message: '5 people are ahead of you.', time: '10 mins ago', read: false }
];

export const mockAnalytics = {
  totalUsers: 10248,
  todaysAppointments: 326,
  activeQueues: 42,
  currentlyWaiting: 118,
  completedToday: 208,
  averageWaitingTime: 18,
  dailyAppointments: [
    { day: 'Mon', appointments: 250 },
    { day: 'Tue', appointments: 300 },
    { day: 'Wed', appointments: 326 },
    { day: 'Thu', appointments: 280 },
    { day: 'Fri', appointments: 310 },
    { day: 'Sat', appointments: 150 },
    { day: 'Sun', appointments: 100 }
  ],
  serviceDemand: [
    { name: 'Healthcare', value: 400 },
    { name: 'Banking', value: 300 },
    { name: 'Government', value: 200 },
    { name: 'Other', value: 100 }
  ]
};
