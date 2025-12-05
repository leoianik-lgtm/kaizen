-- Test database connection and basic operations
-- Run this with the new kaizen_app_user in database 'tmaportal'

USE tmaportal;

-- Test 1: Check if user can read data
SELECT 'Connection Test - READ' as TestType, COUNT(*) as RecordCount FROM KaizenTypes;

-- Test 2: Check if user can insert data
INSERT INTO Departments (DepartmentName) VALUES ('Test Department');

-- Test 3: Check if user can update data
UPDATE Departments SET DepartmentName = 'Test Department Updated' WHERE DepartmentName = 'Test Department';

-- Test 4: Check if user can delete data
DELETE FROM Departments WHERE DepartmentName = 'Test Department Updated';

-- Test 5: Complex query to verify relationships
SELECT 
    k.KaizenNumber,
    kt.TypeName,
    d.DepartmentName,
    k.Leader,
    s.CategoryName as SQDCEPCategory,
    k.Status,
    COUNT(ap.ID) as ActionCount
FROM Kaizens k
    INNER JOIN KaizenTypes kt ON k.TypeID = kt.ID
    INNER JOIN Departments d ON k.DepartmentID = d.ID
    INNER JOIN SQDCEPCategories s ON k.SQDCEPCategoryID = s.ID
    LEFT JOIN ActionPlans ap ON k.ID = ap.KaizenID
GROUP BY k.KaizenNumber, kt.TypeName, d.DepartmentName, k.Leader, s.CategoryName, k.Status;

-- Test 6: Check permissions
SELECT 
    'Database Connection Successful' as Status,
    USER_NAME() as CurrentUser,
    GETUTCDATE() as TestTime;