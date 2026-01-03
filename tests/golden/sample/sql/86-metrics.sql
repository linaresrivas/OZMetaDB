/* Generated Metrics & KPIs */
CREATE SCHEMA kpi;
GO

IF OBJECT_ID('kpi.Metric','U') IS NULL
BEGIN
  CREATE TABLE kpi.Metric (
    MT_ID uniqueidentifier NOT NULL CONSTRAINT pk_MT PRIMARY KEY,
    MT_Code nvarchar(120) NOT NULL,
    MT_Name nvarchar(300) NULL,
    MT_Formula nvarchar(max) NULL,
    MT_CompiledSQL nvarchar(max) NULL,
    MT_CompiledDAX nvarchar(max) NULL,
    MT_Unit nvarchar(60) NULL,
    MT_Direction nvarchar(20) NULL,
    _CreateDate datetime2(3) NOT NULL DEFAULT (sysutcdatetime()),
    _CreatedBy nvarchar(128) NULL
  );
  CREATE UNIQUE INDEX ix_MT_Code ON kpi.Metric(MT_Code);
END
GO

IF OBJECT_ID('kpi.Threshold','U') IS NULL
BEGIN
  CREATE TABLE kpi.Threshold (
    TH_ID uniqueidentifier NOT NULL CONSTRAINT pk_TH PRIMARY KEY,
    MT_ID uniqueidentifier NOT NULL,
    TH_Level nvarchar(40) NOT NULL,
    TH_Operator nvarchar(10) NOT NULL,
    TH_Value decimal(18,4) NOT NULL,
    TH_Color nvarchar(20) NULL,
    CONSTRAINT fk_TH_MT FOREIGN KEY (MT_ID) REFERENCES kpi.Metric(MT_ID)
  );
END
GO

GO