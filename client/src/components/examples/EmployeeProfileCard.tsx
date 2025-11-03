import EmployeeProfileCard from '../EmployeeProfileCard';

export default function EmployeeProfileCardExample() {
  const mockEmployee = {
    name: "John Anderson",
    role: "Senior Software Engineer",
    department: "Engineering",
    email: "john.anderson@company.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    status: "active" as const
  };
  
  return <EmployeeProfileCard employee={mockEmployee} />;
}
