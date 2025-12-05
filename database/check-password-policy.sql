-- Check password policy requirements
SELECT 
    name,
    is_policy_checked,
    is_expiration_checked
FROM sys.sql_logins 
WHERE name = 'sqladmin';

-- Check server-level password policy
SELECT 
    'Password Policy Info' as Info,
    'Minimum 8 characters' as Requirement1,
    'Must contain 3 of 4: uppercase, lowercase, numbers, symbols' as Requirement2,
    'Cannot contain username or parts of it' as Requirement3,
    'Cannot be common passwords' as Requirement4;