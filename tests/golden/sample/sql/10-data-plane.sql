/* Generated Data Plane DDL (starter) */
/* Extend: PK/FK, indexes, soft-delete, archive, tenancy, security */

CREATE SCHEMA dp;
GO

IF OBJECT_ID('dp.Transaction','U') IS NULL
BEGIN
  CREATE TABLE [dp].[Transaction] (
    [TR_ID] uniqueidentifier NOT NULL,
    [TREM_ID] uniqueidentifier NOT NULL,
    [TREM_ApprovedBy] uniqueidentifier NULL,
    [_TenantID] uniqueidentifier NOT NULL,
    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),
    _CreatedBy nvarchar(128) NULL,
    _UpdateDate datetime2(3) NULL,
    _UpdatedBy nvarchar(128) NULL,
    _DeleteDate datetime2(3) NULL,
    _DeletedBy nvarchar(128) NULL
  );
END
GO
