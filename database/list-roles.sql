-- List all database roles
SELECT 
    r.name AS RoleName,
    r.type_desc AS RoleType,
    r.is_fixed_role AS IsFixedRole
FROM sys.database_principals r
WHERE r.type = 'R'
ORDER BY r.name;

-- List all permissions for current user
SELECT 
    p.permission_name,
    p.state_desc AS PermissionState,
    p.class_desc AS PermissionClass,
    OBJECT_NAME(p.major_id) AS ObjectName
FROM sys.database_permissions p
WHERE p.grantee_principal_id = USER_ID();

-- Check current user info
SELECT 
    USER_NAME() AS CurrentUser,
    IS_MEMBER('db_owner') AS IsDbOwner,
    IS_MEMBER('db_datareader') AS IsDataReader,
    IS_MEMBER('db_datawriter') AS IsDataWriter;