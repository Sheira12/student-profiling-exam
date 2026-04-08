export const CURRICULUM = [
  {
    year: 'First Year', semester: 'First Semester',
    subjects: [
      { code: 'CCS101', desc: 'Introduction to Computing',           units: 3, prereq: 'none' },
      { code: 'CCS102', desc: 'Computer Programming 1',              units: 3, prereq: 'none' },
      { code: 'ETH101', desc: 'Ethics',                              units: 3, prereq: 'none' },
      { code: 'MAT101', desc: 'Mathematics in the Modern World',     units: 3, prereq: 'none' },
      { code: 'NSTP1',  desc: 'National Service Training Program 1', units: 3, prereq: 'none' },
      { code: 'PED101', desc: 'Physical Education 1',                units: 2, prereq: 'none' },
      { code: 'PSY100', desc: 'Understanding the Self',              units: 3, prereq: 'none' },
    ]
  },
  {
    year: 'First Year', semester: 'Second Semester',
    subjects: [
      { code: 'CCS103', desc: 'Computer Programming 2',              units: 3, prereq: 'CCS102' },
      { code: 'CCS104', desc: 'Discrete Structures 1',               units: 3, prereq: 'MAT101' },
      { code: 'CCS105', desc: 'Human Computer Interaction 1',        units: 3, prereq: 'CCS101' },
      { code: 'CCS106', desc: 'Social and Professional Issues',      units: 3, prereq: 'ETH101' },
      { code: 'COM101', desc: 'Purposive Communication',             units: 3, prereq: 'none' },
      { code: 'GAD101', desc: 'Gender and Development',              units: 3, prereq: 'none' },
      { code: 'NSTP2',  desc: 'National Service Training Program 2', units: 3, prereq: 'NSTP1' },
      { code: 'PED102', desc: 'Physical Education 2',                units: 2, prereq: 'PED101' },
    ]
  },
  {
    year: 'Second Year', semester: 'First Semester',
    subjects: [
      { code: 'ACT101', desc: 'Principles of Accounting',            units: 3, prereq: 'none' },
      { code: 'CCS107', desc: 'Data Structures and Algorithms 1',    units: 3, prereq: 'CCS103' },
      { code: 'CCS108', desc: 'Object-Oriented Programming',         units: 3, prereq: 'CCS103' },
      { code: 'CCS109', desc: 'System Analysis and Design',          units: 3, prereq: 'CCS101' },
      { code: 'ITEW1',  desc: 'Electronic Commerce',                 units: 3, prereq: 'none' },
      { code: 'PED103', desc: 'Physical Education 3',                units: 2, prereq: 'PED102' },
      { code: 'STS101', desc: 'Science, Technology and Society',     units: 3, prereq: 'none' },
    ]
  },
  {
    year: 'Second Year', semester: 'Second Semester',
    subjects: [
      { code: 'CCS110', desc: 'Information Management 1',            units: 3, prereq: 'CCS101' },
      { code: 'CCS111', desc: 'Networking and Communication 1',      units: 3, prereq: 'CCS103, CCS104, CCS105, CCS106' },
      { code: 'ENT101', desc: 'The Entrepreneurial Mind',            units: 3, prereq: 'none' },
      { code: 'ITEW2',  desc: 'Client Side Scripting',               units: 3, prereq: 'ITEW1' },
      { code: 'ITP101', desc: 'Quantitative Methods',                units: 3, prereq: 'CCS104' },
      { code: 'ITP102', desc: 'Integrative Programming and Technologies', units: 3, prereq: 'CCS109' },
      { code: 'PED104', desc: 'Physical Education 4',                units: 2, prereq: 'PED103' },
    ]
  },
  {
    year: 'Third Year', semester: 'First Semester',
    subjects: [
      { code: 'HIS101', desc: 'Readings in Philippine History',      units: 3, prereq: 'none' },
      { code: 'ITEW3',  desc: 'Server Side Scripting',               units: 3, prereq: 'ITEW2' },
      { code: 'ITP103', desc: 'System Integration and Architecture', units: 3, prereq: 'ITP102' },
      { code: 'ITP104', desc: 'Information Management 2',            units: 3, prereq: 'CCS110' },
      { code: 'ITP105', desc: 'Networking and Communication 2',      units: 3, prereq: 'CCS111' },
      { code: 'ITP106', desc: 'Human Computer Interaction 2',        units: 3, prereq: 'CCS105' },
      { code: 'SOC101', desc: 'The Contemporary World',              units: 3, prereq: 'none' },
      { code: 'TEC101', desc: 'Technopreneurship',                   units: 3, prereq: 'ENT101' },
    ]
  },
  {
    year: 'Third Year', semester: 'Second Semester',
    subjects: [
      { code: 'CCS112', desc: 'Applications Development and Emerging Technologies', units: 3, prereq: 'CCS103' },
      { code: 'CCS113', desc: 'Information Assurance and Security',  units: 3, prereq: '3rd Year Standing' },
      { code: 'HMN101', desc: 'Art Appreciation',                    units: 3, prereq: 'none' },
      { code: 'ITEW4',  desc: 'Responsive Web Design',               units: 3, prereq: 'ITEW3' },
      { code: 'ITP107', desc: 'Mobile Application Development',      units: 3, prereq: 'CCS108' },
      { code: 'ITP108', desc: 'Capstone Project 1',                  units: 3, prereq: 'ITP104, CCS108, ITP103, ITP105, ITP106, ITEW3' },
      { code: 'ITP109', desc: 'Platform Technologies',               units: 3, prereq: 'ITP106' },
    ]
  },
  {
    year: 'Fourth Year', semester: 'First Semester',
    subjects: [
      { code: 'ENV101', desc: 'Environmental Science',               units: 3, prereq: 'none' },
      { code: 'ITEW5',  desc: 'Web Security and Optimization',       units: 3, prereq: 'ITEW4' },
      { code: 'ITP110', desc: 'Web Technologies',                    units: 3, prereq: 'ITP106' },
      { code: 'ITP111', desc: 'System Administration and Maintenance', units: 3, prereq: 'ITP105, ITP109' },
      { code: 'ITP112', desc: 'Capstone Project 2',                  units: 3, prereq: 'ITP108' },
      { code: 'RIZ101', desc: 'Life and Works of Rizal',             units: 3, prereq: 'none' },
    ]
  },
  {
    year: 'Fourth Year', semester: 'Second Semester',
    subjects: [
      { code: 'ITEW6',  desc: 'Web Development Frameworks',          units: 3, prereq: 'ITEW5' },
      { code: 'ITP113', desc: 'IT Practicum (500 hours)',            units: 9, prereq: 'ITP108' },
    ]
  },
]
