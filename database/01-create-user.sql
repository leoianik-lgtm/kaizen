-- Create application user for Kaizen app
-- Run this as sqladmin in database 'tmaportal'

-- Create login (server level)
CREATE LOGIN kaizen_app_user WITH PASSWORD = 'Volvo2026#Secure$';

-- Create user in database tmaportal
USE tmaportal;
CREATE USER kaizen_app_user FOR LOGIN kaizen_app_user;

-- Grant permissions using GRANT approach
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO kaizen_app_user;
GRANT CREATE TABLE, ALTER ON SCHEMA::dbo TO kaizen_app_user;
GRANT EXECUTE ON SCHEMA::dbo TO kaizen_app_user;