/* Generated Documents/Evidence Tables (starter) */
CREATE SCHEMA doc;
GO

IF OBJECT_ID('doc.Document','U') IS NULL
BEGIN
  CREATE TABLE doc.Document (
    DOC_ID uniqueidentifier NOT NULL CONSTRAINT pk_DOC PRIMARY KEY,
    DOC_TypeCode nvarchar(120) NOT NULL,
    DOC_Title nvarchar(300) NULL,
    DOC_MimeType nvarchar(120) NULL,
    DOC_SizeBytes bigint NULL,
    DOC_StorageUri nvarchar(1000) NULL,
    DOC_ContentHash nvarchar(200) NULL,
    DOC_IntegrityMode nvarchar(40) NULL,
    DOC_Class nvarchar(60) NULL,
    _TenantID uniqueidentifier NULL,
    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),
    _CreatedBy nvarchar(128) NULL,
    _DeleteDate datetime2(3) NULL,
    _DeletedBy nvarchar(128) NULL
  );
  CREATE INDEX ix_DOC_Type ON doc.Document(DOC_TypeCode, _TenantID) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('doc.ChainOfCustodyEvent','U') IS NULL
BEGIN
  CREATE TABLE doc.ChainOfCustodyEvent (
    COC_ID uniqueidentifier NOT NULL CONSTRAINT pk_COC PRIMARY KEY,
    DOC_ID uniqueidentifier NOT NULL,
    COC_AtUTC datetime2(3) NOT NULL,
    COC_Action nvarchar(120) NOT NULL,
    COC_Actor nvarchar(200) NULL,
    COC_PayloadJSON nvarchar(max) NULL,
    CONSTRAINT fk_COC_DOC FOREIGN KEY (DOC_ID) REFERENCES doc.Document(DOC_ID)
  );
  CREATE INDEX ix_COC_DOC ON doc.ChainOfCustodyEvent(DOC_ID, COC_AtUTC);
END
GO

-- Document types present in snapshot:
-- - EvidencePhoto