/* Generated Workflow Definitions (seed tables) */
CREATE SCHEMA wfd;
GO

IF OBJECT_ID('wfd.Workflow','U') IS NULL
BEGIN
  CREATE TABLE wfd.Workflow(
    WF_ID uniqueidentifier NOT NULL CONSTRAINT pk_wfd_WF PRIMARY KEY,
    WF_Code nvarchar(120) NOT NULL,
    WF_ConfigJSON nvarchar(max) NULL,
    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),
    _CreatedBy nvarchar(128) NULL,
    _DeleteDate datetime2(3) NULL,
    _DeletedBy nvarchar(128) NULL
  );
  CREATE UNIQUE INDEX ix_wfd_WF_Code ON wfd.Workflow(WF_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('wfd.State','U') IS NULL
BEGIN
  CREATE TABLE wfd.State(
    ST_ID uniqueidentifier NOT NULL CONSTRAINT pk_wfd_ST PRIMARY KEY,
    WF_ID uniqueidentifier NOT NULL,
    ST_Code nvarchar(120) NOT NULL,
    ST_IsInitial bit NOT NULL DEFAULT (0),
    ST_IsTerminal bit NOT NULL DEFAULT (0),
    ST_SlaMinutes int NULL,
    ST_ConfigJSON nvarchar(max) NULL,
    CONSTRAINT fk_wfd_ST_WF FOREIGN KEY (WF_ID) REFERENCES wfd.Workflow(WF_ID)
  );
  CREATE INDEX ix_wfd_ST_WF ON wfd.State(WF_ID, ST_Code);
END
GO

IF OBJECT_ID('wfd.Transition','U') IS NULL
BEGIN
  CREATE TABLE wfd.Transition(
    TRN_ID uniqueidentifier NOT NULL CONSTRAINT pk_wfd_TRN PRIMARY KEY,
    WF_ID uniqueidentifier NOT NULL,
    TRN_Code nvarchar(120) NOT NULL,
    FromST_ID uniqueidentifier NULL,
    ToST_ID uniqueidentifier NOT NULL,
    TRN_GuardDSL nvarchar(max) NULL,
    TRN_ActionDSL nvarchar(max) NULL,
    TRN_ApprovalPolicyID uniqueidentifier NULL,
    TRN_ConfigJSON nvarchar(max) NULL,
    CONSTRAINT fk_wfd_TRN_WF FOREIGN KEY (WF_ID) REFERENCES wfd.Workflow(WF_ID),
    CONSTRAINT fk_wfd_TRN_From FOREIGN KEY (FromST_ID) REFERENCES wfd.State(ST_ID),
    CONSTRAINT fk_wfd_TRN_To FOREIGN KEY (ToST_ID) REFERENCES wfd.State(ST_ID)
  );
  CREATE INDEX ix_wfd_TRN_WF ON wfd.Transition(WF_ID);
END
GO

-- No workflows in snapshot; definitions tables only.