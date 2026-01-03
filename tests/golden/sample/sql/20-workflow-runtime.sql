/* Workflow Runtime (starter) */
CREATE SCHEMA wf;
GO

IF OBJECT_ID('wf.WorkflowInstance','U') IS NULL
BEGIN
  CREATE TABLE wf.WorkflowInstance (
    WI_ID uniqueidentifier NOT NULL CONSTRAINT pk_WI PRIMARY KEY,
    WI_WorkflowCode nvarchar(120) NOT NULL,
    WI_EntityID uniqueidentifier NULL,
    WI_CurrentState nvarchar(120) NOT NULL,
    WI_SlaDueUTC datetime2(3) NULL,
    WI_SlaBreached bit NOT NULL DEFAULT (0),
    WI_EscalationLevel int NOT NULL DEFAULT (0),
    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),
    _CreatedBy nvarchar(128) NULL,
    _UpdateDate datetime2(3) NULL,
    _UpdatedBy nvarchar(128) NULL
  );
END
GO

IF OBJECT_ID('wf.WorkflowEvent','U') IS NULL
BEGIN
  CREATE TABLE wf.WorkflowEvent (
    WE_ID uniqueidentifier NOT NULL CONSTRAINT pk_WE PRIMARY KEY,
    WI_ID uniqueidentifier NOT NULL,
    WE_AtUTC datetime2(3) NOT NULL,
    WE_EventType nvarchar(60) NOT NULL,
    WE_FromState nvarchar(120) NULL,
    WE_ToState nvarchar(120) NULL,
    WE_Actor nvarchar(200) NULL,
    WE_PayloadJSON nvarchar(max) NULL,
    CONSTRAINT fk_WE_WI FOREIGN KEY (WI_ID) REFERENCES wf.WorkflowInstance(WI_ID)
  );
  CREATE INDEX ix_WE_WI ON wf.WorkflowEvent(WI_ID, WE_AtUTC);
END
GO
