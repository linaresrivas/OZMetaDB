/* Immutable Audit Journal (starter) */
CREATE SCHEMA aud;
GO

IF OBJECT_ID('aud.AuditEvent','U') IS NULL
BEGIN
  CREATE TABLE aud.AuditEvent (
    AE_ID uniqueidentifier NOT NULL CONSTRAINT pk_AE PRIMARY KEY,
    AE_AtUTC datetime2(3) NOT NULL,
    AE_Actor nvarchar(200) NULL,
    AE_Action nvarchar(120) NOT NULL,
    AE_ObjectType nvarchar(80) NULL,
    AE_ObjectID uniqueidentifier NULL,
    AE_CorrelationID nvarchar(80) NULL,
    AE_PayloadJSON nvarchar(max) NULL
  );
  CREATE INDEX ix_AE_At ON aud.AuditEvent(AE_AtUTC);
END
GO
