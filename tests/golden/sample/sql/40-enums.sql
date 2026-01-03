/* Generated Enums (starter) */
CREATE SCHEMA lkp;
GO

IF OBJECT_ID('lkp.CaseStatus','U') IS NULL
BEGIN
  CREATE TABLE lkp.CaseStatus (
    CaseStatus_Code nvarchar(80) NOT NULL,
    SortOrder int NOT NULL CONSTRAINT df_Sort DEFAULT (0),
    IsDefault bit NOT NULL CONSTRAINT df_IsDefault DEFAULT (0),
    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),
    _CreatedBy nvarchar(128) NULL,
    _DeleteDate datetime2(3) NULL,
    _DeletedBy nvarchar(128) NULL,
    CONSTRAINT pk_CaseStatus PRIMARY KEY (CaseStatus_Code)
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM lkp.CaseStatus WHERE CaseStatus_Code = 'NEW') INSERT INTO lkp.CaseStatus(CaseStatus_Code, SortOrder, IsDefault) VALUES ('NEW', 10, 1);
IF NOT EXISTS (SELECT 1 FROM lkp.CaseStatus WHERE CaseStatus_Code = 'REVIEW') INSERT INTO lkp.CaseStatus(CaseStatus_Code, SortOrder, IsDefault) VALUES ('REVIEW', 20, 0);
IF NOT EXISTS (SELECT 1 FROM lkp.CaseStatus WHERE CaseStatus_Code = 'CLOSED') INSERT INTO lkp.CaseStatus(CaseStatus_Code, SortOrder, IsDefault) VALUES ('CLOSED', 30, 0);
GO
