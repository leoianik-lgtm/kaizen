-- Insert sample data for testing
-- Run this as sqladmin in database 'tmaportal'

USE tmaportal;

-- Insert Kaizen Types
INSERT INTO KaizenTypes (TypeName, Description) VALUES
('Quick', 'Quick improvement kaizen - simple solutions'),
('Standard', 'Standard kaizen - complex improvements requiring detailed analysis');

-- Insert Departments
INSERT INTO Departments (DepartmentName) VALUES
('Manufacturing'),
('Quality'),
('Logistics'),
('Maintenance'),
('Engineering'),
('Safety'),
('Administration');

-- Insert SQDCEP Categories
INSERT INTO SQDCEPCategories (CategoryCode, CategoryName, Description) VALUES
('S', 'Safety', 'Safety improvements and risk reduction'),
('Q', 'Quality', 'Quality improvements and defect reduction'),
('D', 'Delivery', 'Delivery time and schedule improvements'),
('C', 'Cost', 'Cost reduction and efficiency improvements'),
('E', 'Environment', 'Environmental impact and sustainability'),
('P', 'People', 'People development and engagement');

-- Insert sample Kaizen
INSERT INTO Kaizens (
    TypeID, DepartmentID, ApplicationArea, Leader, Team, SQDCEPCategoryID,
    ProblemDescription, ImprovementDescription, Results,
    Cost, Benefit, Status, CreatedBy
) VALUES
(1, 1, 'Assembly Line A', 'John Smith', 'Team Alpha', 4,
'High setup time on machine X causing delays',
'Implemented quick-change tooling system',
'Reduced setup time from 30min to 5min',
500.00, 2000.00, 'Completed', 'john.smith@volvo.com');

-- Insert sample Action Plan
INSERT INTO ActionPlans (
    KaizenID, ActionDescription, ResponsiblePerson, StartDate, DueDate, Status, CreatedBy
) VALUES
(1, 'Purchase quick-change tooling kit', 'Mike Johnson', '2024-01-15', '2024-01-30', 'Completed', 'john.smith@volvo.com'),
(1, 'Train operators on new system', 'Sarah Wilson', '2024-02-01', '2024-02-15', 'Completed', 'john.smith@volvo.com'),
(1, 'Document new procedure', 'John Smith', '2024-02-10', '2024-02-20', 'Completed', 'john.smith@volvo.com');