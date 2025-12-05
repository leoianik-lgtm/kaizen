-- Kaizen Application Database Schema
-- Modern structure with improvements
-- Run this as sqladmin in database 'tmaportal'

USE tmaportal;

-- 1. Kaizen Types lookup table
CREATE TABLE KaizenTypes (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TypeName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- 2. Departments lookup table
CREATE TABLE Departments (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentName NVARCHAR(100) NOT NULL UNIQUE,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- 3. SQDCEP Categories lookup table
CREATE TABLE SQDCEPCategories (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryCode NCHAR(1) NOT NULL UNIQUE, -- S, Q, D, C, E, P
    CategoryName NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255),
    IsActive BIT DEFAULT 1
);

-- 4. Main Kaizen table (improved structure)
CREATE TABLE Kaizens (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    KaizenNumber AS ('KZ-' + FORMAT(ID, '000000')), -- Auto-generated kaizen number
    TypeID INT NOT NULL,
    DepartmentID INT NOT NULL,
    ApplicationArea NVARCHAR(255) NOT NULL,
    Leader NVARCHAR(100) NOT NULL,
    Team NVARCHAR(500),
    SQDCEPCategoryID INT NOT NULL,
    
    -- Problem & Solution
    ProblemDescription NVARCHAR(MAX) NOT NULL,
    ImprovementDescription NVARCHAR(MAX) NOT NULL,
    Results NVARCHAR(MAX),
    
    -- Financial Impact
    Cost DECIMAL(15,2) DEFAULT 0,
    Benefit DECIMAL(15,2) DEFAULT 0,
    CostBenefitRatio AS (CASE WHEN Cost > 0 THEN Benefit / Cost ELSE NULL END),
    
    -- Standardization
    IsStandardized BIT DEFAULT 0,
    StandardizationNotes NVARCHAR(MAX),
    
    -- Status & Dates
    Status NVARCHAR(50) DEFAULT 'Draft', -- Draft, In Progress, Completed, Cancelled
    SubmittedDate DATETIME2,
    CompletedDate DATETIME2,
    
    -- Audit fields
    CreatedBy NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedBy NVARCHAR(255),
    UpdatedAt DATETIME2,
    
    -- Foreign Keys
    CONSTRAINT FK_Kaizens_Type FOREIGN KEY (TypeID) REFERENCES KaizenTypes(ID),
    CONSTRAINT FK_Kaizens_Department FOREIGN KEY (DepartmentID) REFERENCES Departments(ID),
    CONSTRAINT FK_Kaizens_SQDCEP FOREIGN KEY (SQDCEPCategoryID) REFERENCES SQDCEPCategories(ID)
);

-- 5. Action Plan table (improved structure)
CREATE TABLE ActionPlans (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    KaizenID INT NOT NULL,
    ActionDescription NVARCHAR(MAX) NOT NULL,
    ResponsiblePerson NVARCHAR(100) NOT NULL,
    StartDate DATE,
    DueDate DATE NOT NULL,
    CompletedDate DATE,
    Status NVARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Completed, Overdue
    Notes NVARCHAR(MAX),
    
    -- Audit fields
    CreatedBy NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedBy NVARCHAR(255),
    UpdatedAt DATETIME2,
    
    -- Foreign Key
    CONSTRAINT FK_ActionPlans_Kaizen FOREIGN KEY (KaizenID) REFERENCES Kaizens(ID) ON DELETE CASCADE
);

-- 6. Create indexes for performance
CREATE INDEX IX_Kaizens_Status ON Kaizens(Status);
CREATE INDEX IX_Kaizens_Department ON Kaizens(DepartmentID);
CREATE INDEX IX_Kaizens_CreatedAt ON Kaizens(CreatedAt);
CREATE INDEX IX_ActionPlans_KaizenID ON ActionPlans(KaizenID);
CREATE INDEX IX_ActionPlans_Status ON ActionPlans(Status);
CREATE INDEX IX_ActionPlans_DueDate ON ActionPlans(DueDate);