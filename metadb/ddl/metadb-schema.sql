/*
OZMetaDB - Meta Control Plane (Azure SQL / SQL Server) - MetaDB Schema v2
------------------------------------------------------------------------
Enhancements in v2:
- Full Localization + UI metadata model (multi-language, display names, help text)
- Enumerations/code lists for UI and data validation
- Versioning + approvals for model/mappings/metrics (Draft/Approved/Deprecated)
- Retention policies (soft delete / archive / purge rules) as metadata
- Lineage graph table (field-level edges)
- Slot switching stored procedure for ProdA/ProdB within a SwitchGroup
- Generic soft delete + undelete helpers for MetaDB entities

Notes:
- IDs are stored as uniqueidentifier. For true UUIDv7 semantics, generate IDs in application layer.
- MetaDB is control-plane: volumes are moderate; soft delete is preferred for governance history.
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* =========================
   Schemas
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'Meta')  EXEC('CREATE SCHEMA Meta');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'Audit') EXEC('CREATE SCHEMA Audit');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'Doc')   EXEC('CREATE SCHEMA Doc');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'Sec')   EXEC('CREATE SCHEMA Sec');
GO

/* =========================
   Shared internal fields pattern (applied to most tables)
   _CreateDate datetime2(3) default sysutcdatetime()
   _CreatedBy  nvarchar(128)
   _UpdateDate datetime2(3)
   _UpdatedBy  nvarchar(128)
   _DeleteDate datetime2(3)
   _DeletedBy  nvarchar(128)
   ========================= */

/* =========================
   Sec.Principal (optional)
   ========================= */
IF OBJECT_ID('Sec.Principal','U') IS NULL
BEGIN
  CREATE TABLE Sec.Principal (
    PR_ID           uniqueidentifier NOT NULL CONSTRAINT pk_PR PRIMARY KEY,
    PR_Name         nvarchar(200) NOT NULL,
    PR_Type         nvarchar(50)  NOT NULL, -- User/Service/Group
    PR_Email        nvarchar(320) NULL,
    PR_IsEnabled    bit NOT NULL CONSTRAINT df_PR_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_PR_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL
  );
  CREATE UNIQUE INDEX ix_PR_Name ON Sec.Principal(PR_Name) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   Meta.Client / Meta.Project
   ========================= */
IF OBJECT_ID('Meta.Client','U') IS NULL
BEGIN
  CREATE TABLE Meta.Client (
    CL_ID           uniqueidentifier NOT NULL CONSTRAINT pk_CL PRIMARY KEY,
    CL_Code         nvarchar(50) NOT NULL,
    CL_Name         nvarchar(200) NOT NULL,
    CL_Status       nvarchar(50) NOT NULL CONSTRAINT df_CL_Status DEFAULT ('Active'),
    CL_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_CL_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL
  );
  CREATE UNIQUE INDEX ix_CL_Code ON Meta.Client(CL_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.Project','U') IS NULL
BEGIN
  CREATE TABLE Meta.Project (
    PJ_ID           uniqueidentifier NOT NULL CONSTRAINT pk_PJ PRIMARY KEY,
    CL_ID           uniqueidentifier NOT NULL,
    PJ_Code         nvarchar(80) NOT NULL,   -- BI, Case, Risk
    PJ_Name         nvarchar(200) NOT NULL,
    PJ_Owner        nvarchar(200) NULL,
    PJ_Status       nvarchar(50) NOT NULL CONSTRAINT df_PJ_Status DEFAULT ('Active'),
    PJ_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_PJ_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_PJ_CL_ID FOREIGN KEY (CL_ID) REFERENCES Meta.Client(CL_ID)
  );
  CREATE UNIQUE INDEX ix_PJ_CL_Code ON Meta.Project(CL_ID, PJ_Code) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   Meta.Platform / Targets
   ========================= */
IF OBJECT_ID('Meta.Platform','U') IS NULL
BEGIN
  CREATE TABLE Meta.Platform (
    PL_ID           uniqueidentifier NOT NULL CONSTRAINT pk_PL PRIMARY KEY,
    PL_Code         nvarchar(50) NOT NULL,   -- Fabric, SQLMI, BigQuery, Redshift...
    PL_Cloud        nvarchar(50) NOT NULL,   -- Azure, GCP, AWS, OnPrem
    PL_Category     nvarchar(50) NOT NULL,   -- OLTP, Warehouse, Lakehouse, Semantic, Orchestrator
    PL_IsEnabled    bit NOT NULL CONSTRAINT df_PL_IsEnabled DEFAULT (1),
    PL_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_PL_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL
  );
  CREATE UNIQUE INDEX ix_PL_Code ON Meta.Platform(PL_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.Target','U') IS NULL
BEGIN
  CREATE TABLE Meta.Target (
    TG_ID           uniqueidentifier NOT NULL CONSTRAINT pk_TG PRIMARY KEY,
    CL_ID           uniqueidentifier NOT NULL,
    PJ_ID           uniqueidentifier NOT NULL,
    TG_Env          nvarchar(20) NOT NULL,   -- Dev/Test/Uat/ProdA/ProdB
    TG_Platform     nvarchar(50) NOT NULL,   -- preferred canonical token
    TG_Domain       nvarchar(80) NOT NULL,   -- BI/Case/Risk/Core/Meta
    TG_Region       nvarchar(20) NOT NULL,   -- USW/USE/EUW...
    TG_SwitchGroup  nvarchar(120) NULL,
    TG_IsActive     bit NOT NULL CONSTRAINT df_TG_IsActive DEFAULT (0),
    TG_ActiveSince  datetime2(3) NULL,
    TG_PreviousTG_ID uniqueidentifier NULL,
    TG_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_TG_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_TG_CL_ID FOREIGN KEY (CL_ID) REFERENCES Meta.Client(CL_ID),
    CONSTRAINT fk_TG_PJ_ID FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_TG_Previous FOREIGN KEY (TG_PreviousTG_ID) REFERENCES Meta.Target(TG_ID)
  );
  CREATE INDEX ix_TG_SwitchGroup ON Meta.Target(TG_SwitchGroup, TG_Env, TG_IsActive) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.TargetPlatform','U') IS NULL
BEGIN
  CREATE TABLE Meta.TargetPlatform (
    TP_ID           uniqueidentifier NOT NULL CONSTRAINT pk_TP PRIMARY KEY,
    TG_ID           uniqueidentifier NOT NULL,
    PL_ID           uniqueidentifier NOT NULL,
    TP_Role         nvarchar(20) NOT NULL,   -- Primary/Secondary/DR
    TP_FailoverOrder int NULL,
    TP_IsActive     bit NOT NULL CONSTRAINT df_TP_IsActive DEFAULT (1),
    TP_PhysicalLocator nvarchar(max) NULL,   -- JSON locator (workspace/project/account)
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_TP_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_TP_TG_ID FOREIGN KEY (TG_ID) REFERENCES Meta.Target(TG_ID),
    CONSTRAINT fk_TP_PL_ID FOREIGN KEY (PL_ID) REFERENCES Meta.Platform(PL_ID)
  );
  CREATE UNIQUE INDEX ix_TP_Unique ON Meta.TargetPlatform(TG_ID, PL_ID) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   Localization (UI + docs)
   ========================= */
IF OBJECT_ID('Meta.Language','U') IS NULL
BEGIN
  CREATE TABLE Meta.Language (
    LG_Code         nvarchar(20) NOT NULL CONSTRAINT pk_LG PRIMARY KEY, -- en-US, es-ES, pt-BR
    LG_Name         nvarchar(100) NOT NULL,
    LG_IsDefault    bit NOT NULL CONSTRAINT df_LG_IsDefault DEFAULT (0),
    LG_IsEnabled    bit NOT NULL CONSTRAINT df_LG_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_LG_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL
  );
END
GO

IF OBJECT_ID('Meta.TextKey','U') IS NULL
BEGIN
  CREATE TABLE Meta.TextKey (
    TK_ID           uniqueidentifier NOT NULL CONSTRAINT pk_TK PRIMARY KEY,
    TK_Key          nvarchar(300) NOT NULL, -- stable key: table.Transaction, field.Transaction.TREM_ApprovedBy, metric.TotalSales
    TK_Context      nvarchar(100) NULL,     -- Table/Field/Metric/UI/etc.
    TK_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_TK_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL
  );
  CREATE UNIQUE INDEX ix_TK_Key ON Meta.TextKey(TK_Key) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.TextTranslation','U') IS NULL
BEGIN
  CREATE TABLE Meta.TextTranslation (
    TT_ID           uniqueidentifier NOT NULL CONSTRAINT pk_TT PRIMARY KEY,
    TK_ID           uniqueidentifier NOT NULL,
    LG_Code         nvarchar(20) NOT NULL,
    TT_DisplayName  nvarchar(300) NULL,
    TT_ShortDesc    nvarchar(1000) NULL,
    TT_LongDesc     nvarchar(max) NULL,
    TT_HelpText     nvarchar(max) NULL,
    TT_Example      nvarchar(500) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_TT_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_TT_TK FOREIGN KEY (TK_ID) REFERENCES Meta.TextKey(TK_ID),
    CONSTRAINT fk_TT_LG FOREIGN KEY (LG_Code) REFERENCES Meta.Language(LG_Code)
  );
  CREATE UNIQUE INDEX ix_TT_Unique ON Meta.TextTranslation(TK_ID, LG_Code) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   Enumerations / code lists (for UI + validation)
   ========================= */
IF OBJECT_ID('Meta.Enum','U') IS NULL
BEGIN
  CREATE TABLE Meta.Enum (
    EN_ID           uniqueidentifier NOT NULL CONSTRAINT pk_EN PRIMARY KEY,
    PJ_ID           uniqueidentifier NULL,
    EN_Code         nvarchar(120) NOT NULL, -- e.g., CaseStatus, EvidenceType
    EN_TextKeyID    uniqueidentifier NULL,  -- localized name/desc for enum
    EN_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_EN_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_EN_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_EN_TK FOREIGN KEY (EN_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_EN_Code ON Meta.Enum(ISNULL(PJ_ID, '00000000-0000-0000-0000-000000000000'), EN_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.EnumValue','U') IS NULL
BEGIN
  CREATE TABLE Meta.EnumValue (
    EV_ID           uniqueidentifier NOT NULL CONSTRAINT pk_EV PRIMARY KEY,
    EN_ID           uniqueidentifier NOT NULL,
    EV_Value        nvarchar(120) NOT NULL, -- stored value
    EV_SortOrder    int NULL,
    EV_TextKeyID    uniqueidentifier NULL,  -- localized label/desc
    EV_IsActive     bit NOT NULL CONSTRAINT df_EV_IsActive DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_EV_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_EV_EN FOREIGN KEY (EN_ID) REFERENCES Meta.Enum(EN_ID),
    CONSTRAINT fk_EV_TK FOREIGN KEY (EV_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_EV_Unique ON Meta.EnumValue(EN_ID, EV_Value) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   Canonical model + descriptions via TextKeys
   ========================= */
IF OBJECT_ID('Meta.Code','U') IS NULL
BEGIN
  CREATE TABLE Meta.Code (
    CD_Code         nchar(2) NOT NULL CONSTRAINT pk_CD PRIMARY KEY,
    CD_SchemaName   nvarchar(128) NULL,
    CD_TableName    nvarchar(128) NULL,
    CD_IsReserved   bit NOT NULL CONSTRAINT df_CD_IsReserved DEFAULT (0),
    CD_Notes        nvarchar(500) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_CD_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL
  );
END
GO

IF OBJECT_ID('Meta.Table','U') IS NULL
BEGIN
  CREATE TABLE Meta.Table (
    TB_ID           uniqueidentifier NOT NULL CONSTRAINT pk_TB PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    TB_SchemaName   nvarchar(128) NOT NULL,
    TB_TableName    nvarchar(128) NOT NULL,
    CD_Code         nchar(2) NOT NULL,
    TB_TableType    nvarchar(30) NOT NULL,
    TB_Grain        nvarchar(500) NULL,
    TB_IsActual     bit NOT NULL CONSTRAINT df_TB_IsActual DEFAULT (0),
    TB_IsForecast   bit NOT NULL CONSTRAINT df_TB_IsForecast DEFAULT (0),
    TB_RequiresTenant bit NOT NULL CONSTRAINT df_TB_RequiresTenant DEFAULT (1),
    TB_SoftDeleteEnabled bit NOT NULL CONSTRAINT df_TB_SoftDeleteEnabled DEFAULT (1),
    TB_SourceTrackingEnabled bit NOT NULL CONSTRAINT df_TB_SourceTrackingEnabled DEFAULT (1),
    TB_TextKeyID    uniqueidentifier NULL, -- localized display/desc for table
    TB_StandardVersion int NOT NULL CONSTRAINT df_TB_StandardVersion DEFAULT (1),
    TB_Description  nvarchar(2000) NULL, -- quick inline description (optional)
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_TB_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_TB_PJ_ID FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_TB_CD_Code FOREIGN KEY (CD_Code) REFERENCES Meta.Code(CD_Code),
    CONSTRAINT fk_TB_TK FOREIGN KEY (TB_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_TB_Unique ON Meta.Table(PJ_ID, TB_SchemaName, TB_TableName) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.LogicalType','U') IS NULL
BEGIN
  CREATE TABLE Meta.LogicalType (
    LT_Code         nvarchar(50) NOT NULL CONSTRAINT pk_LT PRIMARY KEY,
    LT_TextKeyID    uniqueidentifier NULL,
    LT_Description  nvarchar(500) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_LT_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_LT_TK FOREIGN KEY (LT_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

IF OBJECT_ID('Meta.PhysicalTypeMap','U') IS NULL
BEGIN
  CREATE TABLE Meta.PhysicalTypeMap (
    PTM_ID          uniqueidentifier NOT NULL CONSTRAINT pk_PTM PRIMARY KEY,
    PL_ID           uniqueidentifier NOT NULL,
    LT_Code         nvarchar(50) NOT NULL,
    PTM_PhysicalType nvarchar(100) NOT NULL,
    PTM_Notes       nvarchar(500) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_PTM_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_PTM_PL_ID FOREIGN KEY (PL_ID) REFERENCES Meta.Platform(PL_ID),
    CONSTRAINT fk_PTM_LT FOREIGN KEY (LT_Code) REFERENCES Meta.LogicalType(LT_Code)
  );
  CREATE UNIQUE INDEX ix_PTM_Unique ON Meta.PhysicalTypeMap(PL_ID, LT_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.Field','U') IS NULL
BEGIN
  CREATE TABLE Meta.Field (
    FD_ID           uniqueidentifier NOT NULL CONSTRAINT pk_FD PRIMARY KEY,
    TB_ID           uniqueidentifier NOT NULL,
    FD_FieldName    nvarchar(128) NOT NULL,
    LT_Code         nvarchar(50) NOT NULL,
    FD_IsPK         bit NOT NULL CONSTRAINT df_FD_IsPK DEFAULT (0),
    FD_IsFK         bit NOT NULL CONSTRAINT df_FD_IsFK DEFAULT (0),
    FD_IsInternal   bit NOT NULL CONSTRAINT df_FD_IsInternal DEFAULT (0),
    FD_IsNullable   bit NOT NULL CONSTRAINT df_FD_IsNullable DEFAULT (1),
    FD_DefaultRule  nvarchar(400) NULL,
    FD_Sensitivity  nvarchar(50) NOT NULL CONSTRAINT df_FD_Sensitivity DEFAULT ('None'),
    FD_TextKeyID    uniqueidentifier NULL, -- localized display/desc for field
    FD_EnumID       uniqueidentifier NULL, -- code list for dropdowns
    FD_Format       nvarchar(80) NULL,      -- UI formatting hint
    FD_Mask         nvarchar(80) NULL,      -- masking hint
    FD_Description  nvarchar(2000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_FD_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_FD_TB_ID FOREIGN KEY (TB_ID) REFERENCES Meta.Table(TB_ID),
    CONSTRAINT fk_FD_LT FOREIGN KEY (LT_Code) REFERENCES Meta.LogicalType(LT_Code),
    CONSTRAINT fk_FD_TK FOREIGN KEY (FD_TextKeyID) REFERENCES Meta.TextKey(TK_ID),
    CONSTRAINT fk_FD_EN FOREIGN KEY (FD_EnumID) REFERENCES Meta.Enum(EN_ID)
  );
  CREATE UNIQUE INDEX ix_FD_Unique ON Meta.Field(TB_ID, FD_FieldName) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.Relation','U') IS NULL
BEGIN
  CREATE TABLE Meta.Relation (
    RL_ID           uniqueidentifier NOT NULL CONSTRAINT pk_RL PRIMARY KEY,
    RL_FromFD_ID    uniqueidentifier NOT NULL,
    RL_ToFD_ID      uniqueidentifier NOT NULL,
    RL_RoleName     nvarchar(100) NULL,
    RL_Cardinality  nvarchar(20) NOT NULL CONSTRAINT df_RL_Cardinality DEFAULT ('N:1'),
    RL_EnforceInDB  bit NOT NULL CONSTRAINT df_RL_EnforceInDB DEFAULT (1),
    RL_TextKeyID    uniqueidentifier NULL,
    RL_Description  nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_RL_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_RL_FromFD FOREIGN KEY (RL_FromFD_ID) REFERENCES Meta.Field(FD_ID),
    CONSTRAINT fk_RL_ToFD FOREIGN KEY (RL_ToFD_ID) REFERENCES Meta.Field(FD_ID),
    CONSTRAINT fk_RL_TK FOREIGN KEY (RL_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

/* =========================
   UI metadata (metadata-driven screens/forms/grids)
   ========================= */
IF OBJECT_ID('Meta.UiEntity','U') IS NULL
BEGIN
  CREATE TABLE Meta.UiEntity (
    UE_ID           uniqueidentifier NOT NULL CONSTRAINT pk_UE PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    UE_Code         nvarchar(120) NOT NULL, -- e.g., Case, PersonProfile, Evidence
    UE_TextKeyID    uniqueidentifier NULL,
    UE_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_UE_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_UE_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_UE_TK FOREIGN KEY (UE_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_UE_Code ON Meta.UiEntity(PJ_ID, UE_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.UiField','U') IS NULL
BEGIN
  CREATE TABLE Meta.UiField (
    UF_ID           uniqueidentifier NOT NULL CONSTRAINT pk_UF PRIMARY KEY,
    UE_ID           uniqueidentifier NOT NULL,
    FD_ID           uniqueidentifier NULL,      -- canonical field
    ME_ID           uniqueidentifier NULL,      -- or metric
    UF_ControlType  nvarchar(50) NOT NULL,      -- TextBox, DatePicker, DropDown, FileUpload, Grid, etc.
    UF_Order        int NOT NULL,
    UF_IsRequired   bit NOT NULL CONSTRAINT df_UF_IsRequired DEFAULT (0),
    UF_IsReadOnly   bit NOT NULL CONSTRAINT df_UF_IsReadOnly DEFAULT (0),
    UF_TextKeyID    uniqueidentifier NULL,      -- label/help
    UF_VisibilityRule nvarchar(max) NULL,       -- JSON: role/sensitivity gates
    UF_ValidationRule nvarchar(max) NULL,       -- JSON: required/regex/range
    UF_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_UF_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_UF_UE FOREIGN KEY (UE_ID) REFERENCES Meta.UiEntity(UE_ID),
    CONSTRAINT fk_UF_FD FOREIGN KEY (FD_ID) REFERENCES Meta.Field(FD_ID),
    CONSTRAINT fk_UF_TK FOREIGN KEY (UF_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_UF_Unique ON Meta.UiField(UE_ID, UF_Order) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   Source model + mapping + versions + approvals
   ========================= */
IF OBJECT_ID('Meta.ApprovalStatus','U') IS NULL
BEGIN
  CREATE TABLE Meta.ApprovalStatus (
    AS_Code         nvarchar(30) NOT NULL CONSTRAINT pk_AS PRIMARY KEY, -- Draft/Approved/Deprecated
    AS_SortOrder    int NOT NULL
  );
  IF NOT EXISTS (SELECT 1 FROM Meta.ApprovalStatus WHERE AS_Code='Draft')
    INSERT INTO Meta.ApprovalStatus(AS_Code, AS_SortOrder) VALUES ('Draft', 1), ('Approved', 2), ('Deprecated', 3);
END
GO

IF OBJECT_ID('Meta.ModelVersion','U') IS NULL
BEGIN
  CREATE TABLE Meta.ModelVersion (
    MD_ID           uniqueidentifier NOT NULL CONSTRAINT pk_MD PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    MD_Version      int NOT NULL,
    AS_Code         nvarchar(30) NOT NULL CONSTRAINT df_MD_AS DEFAULT ('Draft'),
    MD_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_MD_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_MD_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_MD_AS FOREIGN KEY (AS_Code) REFERENCES Meta.ApprovalStatus(AS_Code)
  );
  CREATE UNIQUE INDEX ix_MD_Unique ON Meta.ModelVersion(PJ_ID, MD_Version) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.SourceSystem','U') IS NULL
BEGIN
  CREATE TABLE Meta.SourceSystem (
    SS_ID           uniqueidentifier NOT NULL CONSTRAINT pk_SS PRIMARY KEY,
    SS_Code         nvarchar(100) NOT NULL,
    SS_Name         nvarchar(200) NOT NULL,
    SS_Type         nvarchar(50) NULL,
    SS_RefreshCadence nvarchar(50) NULL,
    SS_Owner        nvarchar(200) NULL,
    SS_TextKeyID    uniqueidentifier NULL,
    SS_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_SS_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_SS_TK FOREIGN KEY (SS_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_SS_Code ON Meta.SourceSystem(SS_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.SourceObject','U') IS NULL
BEGIN
  CREATE TABLE Meta.SourceObject (
    SO_ID           uniqueidentifier NOT NULL CONSTRAINT pk_SO PRIMARY KEY,
    SS_ID           uniqueidentifier NOT NULL,
    SO_ObjectName   nvarchar(300) NOT NULL,
    SO_ObjectType   nvarchar(50) NOT NULL,
    SO_LocationRef  nvarchar(1000) NULL,
    SO_TextKeyID    uniqueidentifier NULL,
    SO_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_SO_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_SO_SS FOREIGN KEY (SS_ID) REFERENCES Meta.SourceSystem(SS_ID),
    CONSTRAINT fk_SO_TK FOREIGN KEY (SO_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

IF OBJECT_ID('Meta.SourceField','U') IS NULL
BEGIN
  CREATE TABLE Meta.SourceField (
    SF_ID           uniqueidentifier NOT NULL CONSTRAINT pk_SF PRIMARY KEY,
    SO_ID           uniqueidentifier NOT NULL,
    SF_FieldName    nvarchar(300) NOT NULL,
    SF_SourceType   nvarchar(120) NULL,
    SF_IsKey        bit NOT NULL CONSTRAINT df_SF_IsKey DEFAULT (0),
    SF_TextKeyID    uniqueidentifier NULL,
    SF_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_SF_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_SF_SO FOREIGN KEY (SO_ID) REFERENCES Meta.SourceObject(SO_ID),
    CONSTRAINT fk_SF_TK FOREIGN KEY (SF_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

IF OBJECT_ID('Meta.MapVersion','U') IS NULL
BEGIN
  CREATE TABLE Meta.MapVersion (
    MV_ID           uniqueidentifier NOT NULL CONSTRAINT pk_MV PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    MV_Version      int NOT NULL,
    AS_Code         nvarchar(30) NOT NULL CONSTRAINT df_MV_AS DEFAULT ('Draft'),
    MV_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_MV_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_MV_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_MV_AS FOREIGN KEY (AS_Code) REFERENCES Meta.ApprovalStatus(AS_Code)
  );
END
GO

IF OBJECT_ID('Meta.MapObject','U') IS NULL
BEGIN
  CREATE TABLE Meta.MapObject (
    MO_ID           uniqueidentifier NOT NULL CONSTRAINT pk_MO PRIMARY KEY,
    MV_ID           uniqueidentifier NOT NULL,
    SO_ID           uniqueidentifier NOT NULL,
    TB_ID           uniqueidentifier NOT NULL,
    MO_Strategy     nvarchar(30) NOT NULL, -- Append/Upsert/SCD1/SCD2
    MO_TextKeyID    uniqueidentifier NULL,
    MO_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_MO_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_MO_MV FOREIGN KEY (MV_ID) REFERENCES Meta.MapVersion(MV_ID),
    CONSTRAINT fk_MO_SO FOREIGN KEY (SO_ID) REFERENCES Meta.SourceObject(SO_ID),
    CONSTRAINT fk_MO_TB FOREIGN KEY (TB_ID) REFERENCES Meta.Table(TB_ID),
    CONSTRAINT fk_MO_TK FOREIGN KEY (MO_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

IF OBJECT_ID('Meta.MapField','U') IS NULL
BEGIN
  CREATE TABLE Meta.MapField (
    MF_ID           uniqueidentifier NOT NULL CONSTRAINT pk_MF PRIMARY KEY,
    MO_ID           uniqueidentifier NOT NULL,
    SF_ID           uniqueidentifier NOT NULL,
    FD_ID           uniqueidentifier NOT NULL,
    MF_TransformLogical nvarchar(max) NULL,   -- JSON/DSL
    MF_TransformSQL  nvarchar(max) NULL,
    MF_TransformSpark nvarchar(max) NULL,
    MF_IsKeyPart     bit NOT NULL CONSTRAINT df_MF_IsKeyPart DEFAULT (0),
    MF_TextKeyID     uniqueidentifier NULL,
    MF_Notes         nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_MF_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_MF_MO FOREIGN KEY (MO_ID) REFERENCES Meta.MapObject(MO_ID),
    CONSTRAINT fk_MF_SF FOREIGN KEY (SF_ID) REFERENCES Meta.SourceField(SF_ID),
    CONSTRAINT fk_MF_FD FOREIGN KEY (FD_ID) REFERENCES Meta.Field(FD_ID),
    CONSTRAINT fk_MF_TK FOREIGN KEY (MF_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

/* =========================
   Physical projection + reverse mapping
   ========================= */
IF OBJECT_ID('Meta.PhysicalObject','U') IS NULL
BEGIN
  CREATE TABLE Meta.PhysicalObject (
    PO_ID           uniqueidentifier NOT NULL CONSTRAINT pk_PO PRIMARY KEY,
    TP_ID           uniqueidentifier NOT NULL,
    PO_CanonicalType nvarchar(30) NOT NULL, -- Target/Schema/Table/View/Semantic
    PO_CanonicalID  uniqueidentifier NULL,
    PO_PhysicalContainer nvarchar(300) NULL,
    PO_PhysicalSchema nvarchar(300) NULL,
    PO_PhysicalName nvarchar(300) NOT NULL,
    PO_ConstraintsApplied nvarchar(300) NULL,
    PO_IsActive     bit NOT NULL CONSTRAINT df_PO_IsActive DEFAULT (1),
    PO_ReverseKey   nvarchar(600) NULL,      -- key to reverse-map from platform object to canonical
    PO_TextKeyID    uniqueidentifier NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_PO_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_PO_TP FOREIGN KEY (TP_ID) REFERENCES Meta.TargetPlatform(TP_ID),
    CONSTRAINT fk_PO_TK FOREIGN KEY (PO_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

IF OBJECT_ID('Meta.PhysicalField','U') IS NULL
BEGIN
  CREATE TABLE Meta.PhysicalField (
    PF_ID           uniqueidentifier NOT NULL CONSTRAINT pk_PF PRIMARY KEY,
    PO_ID           uniqueidentifier NOT NULL,
    FD_ID           uniqueidentifier NOT NULL,
    PF_PhysicalFieldName nvarchar(300) NOT NULL,
    PF_PhysicalType nvarchar(120) NULL,
    PF_IsEncrypted  bit NOT NULL CONSTRAINT df_PF_IsEncrypted DEFAULT (0),
    PF_IsMasked     bit NOT NULL CONSTRAINT df_PF_IsMasked DEFAULT (0),
    PF_TextKeyID    uniqueidentifier NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_PF_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_PF_PO FOREIGN KEY (PO_ID) REFERENCES Meta.PhysicalObject(PO_ID),
    CONSTRAINT fk_PF_FD FOREIGN KEY (FD_ID) REFERENCES Meta.Field(FD_ID),
    CONSTRAINT fk_PF_TK FOREIGN KEY (PF_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

/* =========================
   Jobs/pipelines (logical) + compilation targets
   ========================= */
IF OBJECT_ID('Meta.Job','U') IS NULL
BEGIN
  CREATE TABLE Meta.Job (
    JB_ID           uniqueidentifier NOT NULL CONSTRAINT pk_JB PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    JB_Code         nvarchar(200) NOT NULL, -- lowercase
    JB_Domain       nvarchar(80) NOT NULL,
    JB_Layer        nvarchar(30) NOT NULL,
    JB_TextKeyID    uniqueidentifier NULL,
    JB_Description  nvarchar(2000) NULL,
    JB_IsEnabled    bit NOT NULL CONSTRAINT df_JB_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_JB_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_JB_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_JB_TK FOREIGN KEY (JB_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

IF OBJECT_ID('Meta.JobStep','U') IS NULL
BEGIN
  CREATE TABLE Meta.JobStep (
    JS_ID           uniqueidentifier NOT NULL CONSTRAINT pk_JS PRIMARY KEY,
    JB_ID           uniqueidentifier NOT NULL,
    JS_Order        int NOT NULL,
    JS_Code         nvarchar(200) NOT NULL,
    JS_Type         nvarchar(50) NOT NULL,
    JS_InputRefs    nvarchar(max) NULL,
    JS_OutputRefs   nvarchar(max) NULL,
    JS_Parameters   nvarchar(max) NULL,
    JS_RetryPolicy  nvarchar(max) NULL,
    JS_TextKeyID    uniqueidentifier NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_JS_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_JS_JB FOREIGN KEY (JB_ID) REFERENCES Meta.Job(JB_ID),
    CONSTRAINT fk_JS_TK FOREIGN KEY (JS_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

IF OBJECT_ID('Meta.JobTarget','U') IS NULL
BEGIN
  CREATE TABLE Meta.JobTarget (
    JT_ID           uniqueidentifier NOT NULL CONSTRAINT pk_JT PRIMARY KEY,
    JB_ID           uniqueidentifier NOT NULL,
    TP_ID           uniqueidentifier NULL,
    PL_ID           uniqueidentifier NOT NULL,
    JT_ImplType     nvarchar(50) NOT NULL,
    JT_ArtifactRef  nvarchar(1000) NULL,
    JT_ArtifactVersion nvarchar(100) NULL,
    JT_TextKeyID    uniqueidentifier NULL,
    JT_IsEnabled    bit NOT NULL CONSTRAINT df_JT_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_JT_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_JT_JB FOREIGN KEY (JB_ID) REFERENCES Meta.Job(JB_ID),
    CONSTRAINT fk_JT_PL FOREIGN KEY (PL_ID) REFERENCES Meta.Platform(PL_ID),
    CONSTRAINT fk_JT_TP FOREIGN KEY (TP_ID) REFERENCES Meta.TargetPlatform(TP_ID),
    CONSTRAINT fk_JT_TK FOREIGN KEY (JT_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

/* =========================
   Lineage graph (field-level edges)
   ========================= */
IF OBJECT_ID('Meta.LineageEdge','U') IS NULL
BEGIN
  CREATE TABLE Meta.LineageEdge (
    LN_ID           uniqueidentifier NOT NULL CONSTRAINT pk_LN PRIMARY KEY,
    LN_FromType     nvarchar(50) NOT NULL, -- SourceField/CanonicalField/PhysicalField/SemanticMeasure
    LN_FromID       uniqueidentifier NOT NULL,
    LN_ToType       nvarchar(50) NOT NULL,
    LN_ToID         uniqueidentifier NOT NULL,
    LN_EvidenceRef  nvarchar(200) NULL,
    LN_TextKeyID    uniqueidentifier NULL,
    LN_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_LN_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_LN_TK FOREIGN KEY (LN_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE INDEX ix_LN_From ON Meta.LineageEdge(LN_FromType, LN_FromID) WHERE _DeleteDate IS NULL;
  CREATE INDEX ix_LN_To ON Meta.LineageEdge(LN_ToType, LN_ToID) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   Metrics/KPIs + translations via TextKeys
   ========================= */
IF OBJECT_ID('Meta.Metric','U') IS NULL
BEGIN
  CREATE TABLE Meta.Metric (
    ME_ID           uniqueidentifier NOT NULL CONSTRAINT pk_ME PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    ME_Code         nvarchar(120) NOT NULL,
    ME_TextKeyID    uniqueidentifier NULL,
    ME_Unit         nvarchar(50) NULL,
    ME_Format       nvarchar(50) NULL,
    ME_BaseTB_ID    uniqueidentifier NULL,
    ME_BaseFD_ID    uniqueidentifier NULL,
    ME_Grain        nvarchar(200) NULL,
    ME_GroupCode    nvarchar(80) NULL,
    ME_IsAdditive   bit NOT NULL CONSTRAINT df_ME_IsAdditive DEFAULT (1),
    ME_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_ME_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_ME_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_ME_BaseTB FOREIGN KEY (ME_BaseTB_ID) REFERENCES Meta.Table(TB_ID),
    CONSTRAINT fk_ME_BaseFD FOREIGN KEY (ME_BaseFD_ID) REFERENCES Meta.Field(FD_ID),
    CONSTRAINT fk_ME_TK FOREIGN KEY (ME_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_ME_Code ON Meta.Metric(PJ_ID, ME_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.MetricFormula','U') IS NULL
BEGIN
  CREATE TABLE Meta.MetricFormula (
    FM_ID           uniqueidentifier NOT NULL CONSTRAINT pk_FM PRIMARY KEY,
    ME_ID           uniqueidentifier NOT NULL,
    FM_Version      int NOT NULL,
    AS_Code         nvarchar(30) NOT NULL CONSTRAINT df_FM_AS DEFAULT ('Draft'),
    FM_ExpressionLogical nvarchar(max) NOT NULL,
    FM_EffDate      date NULL,
    FM_EndDate      date NULL,
    FM_TextKeyID    uniqueidentifier NULL,
    FM_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_FM_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_FM_ME FOREIGN KEY (ME_ID) REFERENCES Meta.Metric(ME_ID),
    CONSTRAINT fk_FM_AS FOREIGN KEY (AS_Code) REFERENCES Meta.ApprovalStatus(AS_Code),
    CONSTRAINT fk_FM_TK FOREIGN KEY (FM_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_FM_Unique ON Meta.MetricFormula(ME_ID, FM_Version) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.MetricPlatform','U') IS NULL
BEGIN
  CREATE TABLE Meta.MetricPlatform (
    MP_ID           uniqueidentifier NOT NULL CONSTRAINT pk_MP PRIMARY KEY,
    FM_ID           uniqueidentifier NOT NULL,
    PL_ID           uniqueidentifier NOT NULL,
    MP_ExpressionPhysical nvarchar(max) NOT NULL,
    MP_TextKeyID    uniqueidentifier NULL,
    MP_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_MP_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_MP_FM FOREIGN KEY (FM_ID) REFERENCES Meta.MetricFormula(FM_ID),
    CONSTRAINT fk_MP_PL FOREIGN KEY (PL_ID) REFERENCES Meta.Platform(PL_ID),
    CONSTRAINT fk_MP_TK FOREIGN KEY (MP_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_MP_Unique ON Meta.MetricPlatform(FM_ID, PL_ID) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.KPI','U') IS NULL
BEGIN
  CREATE TABLE Meta.KPI (
    KP_ID           uniqueidentifier NOT NULL CONSTRAINT pk_KP PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    KP_Code         nvarchar(120) NOT NULL,
    KP_TextKeyID    uniqueidentifier NULL,
    ME_ID           uniqueidentifier NOT NULL,
    KP_Direction    nvarchar(30) NOT NULL,
    KP_Thresholds   nvarchar(max) NULL,
    KP_TargetValue  nvarchar(100) NULL,
    KP_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_KP_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_KP_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_KP_ME FOREIGN KEY (ME_ID) REFERENCES Meta.Metric(ME_ID),
    CONSTRAINT fk_KP_TK FOREIGN KEY (KP_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_KP_Code ON Meta.KPI(PJ_ID, KP_Code) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   BI Dimensions/hierarchies/attributes
   ========================= */
IF OBJECT_ID('Meta.Dimension','U') IS NULL
BEGIN
  CREATE TABLE Meta.Dimension (
    DM_ID           uniqueidentifier NOT NULL CONSTRAINT pk_DM PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    DM_Code         nvarchar(80) NOT NULL,
    DM_TextKeyID    uniqueidentifier NULL,
    TB_ID           uniqueidentifier NULL,
    DM_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_DM_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_DM_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_DM_TB FOREIGN KEY (TB_ID) REFERENCES Meta.Table(TB_ID),
    CONSTRAINT fk_DM_TK FOREIGN KEY (DM_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_DM_Code ON Meta.Dimension(PJ_ID, DM_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.Hierarchy','U') IS NULL
BEGIN
  CREATE TABLE Meta.Hierarchy (
    HY_ID           uniqueidentifier NOT NULL CONSTRAINT pk_HY PRIMARY KEY,
    DM_ID           uniqueidentifier NOT NULL,
    HY_Code         nvarchar(80) NOT NULL,
    HY_TextKeyID    uniqueidentifier NULL,
    HY_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_HY_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_HY_DM FOREIGN KEY (DM_ID) REFERENCES Meta.Dimension(DM_ID),
    CONSTRAINT fk_HY_TK FOREIGN KEY (HY_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_HY_Code ON Meta.Hierarchy(DM_ID, HY_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.HierarchyLevel','U') IS NULL
BEGIN
  CREATE TABLE Meta.HierarchyLevel (
    HL_ID           uniqueidentifier NOT NULL CONSTRAINT pk_HL PRIMARY KEY,
    HY_ID           uniqueidentifier NOT NULL,
    HL_Order        int NOT NULL,
    HL_Code         nvarchar(80) NOT NULL,
    HL_TextKeyID    uniqueidentifier NULL,
    HL_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_HL_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_HL_HY FOREIGN KEY (HY_ID) REFERENCES Meta.Hierarchy(HY_ID),
    CONSTRAINT fk_HL_TK FOREIGN KEY (HL_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_HL_Unique ON Meta.HierarchyLevel(HY_ID, HL_Order) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.LevelAttribute','U') IS NULL
BEGIN
  CREATE TABLE Meta.LevelAttribute (
    LA_ID           uniqueidentifier NOT NULL CONSTRAINT pk_LA PRIMARY KEY,
    HL_ID           uniqueidentifier NOT NULL,
    FD_ID           uniqueidentifier NOT NULL,
    LA_IsKey        bit NOT NULL CONSTRAINT df_LA_IsKey DEFAULT (0),
    LA_TextKeyID    uniqueidentifier NULL,
    LA_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_LA_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_LA_HL FOREIGN KEY (HL_ID) REFERENCES Meta.HierarchyLevel(HL_ID),
    CONSTRAINT fk_LA_FD FOREIGN KEY (FD_ID) REFERENCES Meta.Field(FD_ID),
    CONSTRAINT fk_LA_TK FOREIGN KEY (LA_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

/* =========================
   Retention policy (metadata-driven archive/purge)
   ========================= */
IF OBJECT_ID('Meta.RetentionPolicy','U') IS NULL
BEGIN
  CREATE TABLE Meta.RetentionPolicy (
    RP_ID           uniqueidentifier NOT NULL CONSTRAINT pk_RP PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    TB_ID           uniqueidentifier NULL,     -- optional: applies to specific table
    RP_Scope        nvarchar(30) NOT NULL,     -- Table/Domain/Project
    RP_SoftDeleteDays int NULL,                -- how long after _DeleteDate before archive
    RP_ArchiveDays  int NULL,                  -- how long after archive before purge
    RP_PurgeEnabled bit NOT NULL CONSTRAINT df_RP_PurgeEnabled DEFAULT (0),
    RP_ArchiveTarget nvarchar(200) NULL,       -- archive store name/uri logical ref
    RP_TextKeyID    uniqueidentifier NULL,
    RP_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_RP_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_RP_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_RP_TB FOREIGN KEY (TB_ID) REFERENCES Meta.Table(TB_ID),
    CONSTRAINT fk_RP_TK FOREIGN KEY (RP_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

/* =========================
   Doc.Artifact (blob + URI + hash)
   ========================= */
IF OBJECT_ID('Doc.Artifact','U') IS NULL
BEGIN
  CREATE TABLE Doc.Artifact (
    AR_ID           uniqueidentifier NOT NULL CONSTRAINT pk_AR PRIMARY KEY,
    PJ_ID           uniqueidentifier NULL,
    AR_Type         nvarchar(50) NOT NULL,
    AR_Name         nvarchar(300) NOT NULL,
    AR_Version      nvarchar(50) NULL,
    AR_ContentType  nvarchar(120) NULL,
    AR_Uri          nvarchar(2000) NULL,
    AR_Hash         nvarchar(200) NULL,
    AR_Content      varbinary(max) NULL,
    AR_Text         nvarchar(max) NULL, -- searchable text for markdown/json (optional)
    AR_TextKeyID    uniqueidentifier NULL,
    AR_Description  nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_AR_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_AR_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_AR_TK FOREIGN KEY (AR_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
END
GO

/* =========================
   Audit (runs/objects/checks/errors)
   ========================= */
IF OBJECT_ID('Audit.LoadRun','U') IS NULL
BEGIN
  CREATE TABLE Audit.LoadRun (
    LR_ID           uniqueidentifier NOT NULL CONSTRAINT pk_LR PRIMARY KEY,
    TG_ID           uniqueidentifier NULL,
    TP_ID           uniqueidentifier NULL,
    JB_ID           uniqueidentifier NULL,
    LR_RunID        uniqueidentifier NOT NULL,
    LR_StartDate    datetime2(3) NOT NULL CONSTRAINT df_LR_Start DEFAULT (sysutcdatetime()),
    LR_EndDate      datetime2(3) NULL,
    LR_Status       nvarchar(30) NOT NULL CONSTRAINT df_LR_Status DEFAULT ('Running'),
    LR_StdVer       int NULL,
    LR_MapVer       int NULL,
    LR_ModelVer     int NULL,
    LR_Message      nvarchar(2000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_LR_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_LR_TG FOREIGN KEY (TG_ID) REFERENCES Meta.Target(TG_ID),
    CONSTRAINT fk_LR_TP FOREIGN KEY (TP_ID) REFERENCES Meta.TargetPlatform(TP_ID),
    CONSTRAINT fk_LR_JB FOREIGN KEY (JB_ID) REFERENCES Meta.Job(JB_ID)
  );
  CREATE INDEX ix_LR_RunID ON Audit.LoadRun(LR_RunID);
END
GO

IF OBJECT_ID('Audit.LoadObject','U') IS NULL
BEGIN
  CREATE TABLE Audit.LoadObject (
    LO_ID           uniqueidentifier NOT NULL CONSTRAINT pk_LO PRIMARY KEY,
    LR_ID           uniqueidentifier NOT NULL,
    LO_ObjectRef    nvarchar(500) NOT NULL,
    LO_StepCode     nvarchar(200) NULL,
    LO_InCount      bigint NULL,
    LO_OutCount     bigint NULL,
    LO_RejectCount  bigint NULL,
    LO_DurationMs   bigint NULL,
    LO_Status       nvarchar(30) NOT NULL CONSTRAINT df_LO_Status DEFAULT ('OK'),
    LO_Message      nvarchar(2000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_LO_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_LO_LR FOREIGN KEY (LR_ID) REFERENCES Audit.LoadRun(LR_ID)
  );
END
GO

IF OBJECT_ID('Audit.QualityCheck','U') IS NULL
BEGIN
  CREATE TABLE Audit.QualityCheck (
    QC_ID           uniqueidentifier NOT NULL CONSTRAINT pk_QC PRIMARY KEY,
    LR_ID           uniqueidentifier NOT NULL,
    QC_CheckCode    nvarchar(200) NOT NULL,
    QC_ObjectRef    nvarchar(500) NULL,
    QC_Result       nvarchar(30) NOT NULL,
    QC_Details      nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_QC_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_QC_LR FOREIGN KEY (LR_ID) REFERENCES Audit.LoadRun(LR_ID)
  );
END
GO

IF OBJECT_ID('Audit.DriftCheck','U') IS NULL
BEGIN
  CREATE TABLE Audit.DriftCheck (
    DC_ID           uniqueidentifier NOT NULL CONSTRAINT pk_DC PRIMARY KEY,
    LR_ID           uniqueidentifier NULL,
    TG_ID           uniqueidentifier NULL,
    TP_ID           uniqueidentifier NULL,
    DC_ObjectRef    nvarchar(500) NOT NULL,
    DC_Result       nvarchar(30) NOT NULL,
    DC_Details      nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_DC_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_DC_LR FOREIGN KEY (LR_ID) REFERENCES Audit.LoadRun(LR_ID),
    CONSTRAINT fk_DC_TG FOREIGN KEY (TG_ID) REFERENCES Meta.Target(TG_ID),
    CONSTRAINT fk_DC_TP FOREIGN KEY (TP_ID) REFERENCES Meta.TargetPlatform(TP_ID)
  );
END
GO

IF OBJECT_ID('Audit.Error','U') IS NULL
BEGIN
  CREATE TABLE Audit.Error (
    ER_ID           uniqueidentifier NOT NULL CONSTRAINT pk_ER PRIMARY KEY,
    LR_ID           uniqueidentifier NULL,
    ER_Code         nvarchar(100) NULL,
    ER_Message      nvarchar(max) NOT NULL,
    ER_ObjectRef    nvarchar(500) NULL,
    ER_Stack        nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_ER_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_ER_LR FOREIGN KEY (LR_ID) REFERENCES Audit.LoadRun(LR_ID)
  );
END
GO

/* =========================
   Stored procedures (governed helpers)
   ========================= */

IF OBJECT_ID('Meta.textkey_upsert','P') IS NULL
EXEC('
CREATE PROCEDURE Meta.textkey_upsert
  @TK_ID uniqueidentifier = NULL,
  @TK_Key nvarchar(300),
  @TK_Context nvarchar(100) = NULL,
  @TK_Notes nvarchar(1000) = NULL,
  @Actor nvarchar(128) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  IF @TK_ID IS NULL SET @TK_ID = NEWID();

  MERGE Meta.TextKey AS t
  USING (SELECT @TK_ID AS TK_ID, @TK_Key AS TK_Key) AS s
  ON (t.TK_ID = s.TK_ID OR (t.TK_Key=s.TK_Key AND t._DeleteDate IS NULL))
  WHEN MATCHED THEN UPDATE SET TK_Context=@TK_Context, TK_Notes=@TK_Notes, _UpdateDate=sysutcdatetime(), _UpdatedBy=@Actor
  WHEN NOT MATCHED THEN
    INSERT (TK_ID, TK_Key, TK_Context, TK_Notes, _CreateDate, _CreatedBy)
    VALUES (@TK_ID, @TK_Key, @TK_Context, @TK_Notes, sysutcdatetime(), @Actor);

  SELECT @TK_ID AS TK_ID;
END
');
GO

IF OBJECT_ID('Meta.translation_upsert','P') IS NULL
EXEC('
CREATE PROCEDURE Meta.translation_upsert
  @TK_Key nvarchar(300),
  @LG_Code nvarchar(20),
  @DisplayName nvarchar(300) = NULL,
  @ShortDesc nvarchar(1000) = NULL,
  @LongDesc nvarchar(max) = NULL,
  @HelpText nvarchar(max) = NULL,
  @Example nvarchar(500) = NULL,
  @Actor nvarchar(128) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @TK_ID uniqueidentifier;
  SELECT @TK_ID = TK_ID FROM Meta.TextKey WHERE TK_Key=@TK_Key AND _DeleteDate IS NULL;
  IF @TK_ID IS NULL
  BEGIN
    SET @TK_ID = NEWID();
    INSERT INTO Meta.TextKey(TK_ID, TK_Key, _CreateDate, _CreatedBy) VALUES (@TK_ID, @TK_Key, sysutcdatetime(), @Actor);
  END

  MERGE Meta.TextTranslation AS t
  USING (SELECT @TK_ID AS TK_ID, @LG_Code AS LG_Code) AS s
  ON (t.TK_ID=s.TK_ID AND t.LG_Code=s.LG_Code AND t._DeleteDate IS NULL)
  WHEN MATCHED THEN UPDATE SET
    TT_DisplayName=@DisplayName, TT_ShortDesc=@ShortDesc, TT_LongDesc=@LongDesc, TT_HelpText=@HelpText, TT_Example=@Example,
    _UpdateDate=sysutcdatetime(), _UpdatedBy=@Actor
  WHEN NOT MATCHED THEN
    INSERT (TT_ID, TK_ID, LG_Code, TT_DisplayName, TT_ShortDesc, TT_LongDesc, TT_HelpText, TT_Example, _CreateDate, _CreatedBy)
    VALUES (NEWID(), @TK_ID, @LG_Code, @DisplayName, @ShortDesc, @LongDesc, @HelpText, @Example, sysutcdatetime(), @Actor);
END
');
GO

IF OBJECT_ID('Meta.softdelete','P') IS NULL
EXEC('
CREATE PROCEDURE Meta.softdelete
  @SchemaName nvarchar(128),
  @TableName nvarchar(128),
  @IDColumn nvarchar(128),
  @IDValue uniqueidentifier,
  @Actor nvarchar(128) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @sql nvarchar(max) =
    N''UPDATE ''+QUOTENAME(@SchemaName)+N''.''+QUOTENAME(@TableName)+
    N'' SET _DeleteDate=sysutcdatetime(), _DeletedBy=@Actor WHERE ''+QUOTENAME(@IDColumn)+N''=@IDValue AND _DeleteDate IS NULL;'';
  EXEC sp_executesql @sql, N''@IDValue uniqueidentifier, @Actor nvarchar(128)'', @IDValue=@IDValue, @Actor=@Actor;
END
');
GO

IF OBJECT_ID('Meta.undelete','P') IS NULL
EXEC('
CREATE PROCEDURE Meta.undelete
  @SchemaName nvarchar(128),
  @TableName nvarchar(128),
  @IDColumn nvarchar(128),
  @IDValue uniqueidentifier,
  @Actor nvarchar(128) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @sql nvarchar(max) =
    N''UPDATE ''+QUOTENAME(@SchemaName)+N''.''+QUOTENAME(@TableName)+
    N'' SET _DeleteDate=NULL, _DeletedBy=NULL, _UpdateDate=sysutcdatetime(), _UpdatedBy=@Actor WHERE ''+QUOTENAME(@IDColumn)+N''=@IDValue;'';
  EXEC sp_executesql @sql, N''@IDValue uniqueidentifier, @Actor nvarchar(128)'', @IDValue=@IDValue, @Actor=@Actor;
END
');
GO

IF OBJECT_ID('Meta.target_switch_active_slot','P') IS NULL
EXEC('
CREATE PROCEDURE Meta.target_switch_active_slot
  @CL_Code nvarchar(50),
  @PJ_Code nvarchar(80),
  @SwitchGroup nvarchar(120),
  @MakeEnv nvarchar(20), -- ProdA or ProdB
  @Actor nvarchar(128) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @CL_ID uniqueidentifier, @PJ_ID uniqueidentifier;
  SELECT @CL_ID=CL_ID FROM Meta.Client WHERE CL_Code=@CL_Code AND _DeleteDate IS NULL;
  IF @CL_ID IS NULL THROW 51001, ''Client not found'', 1;

  SELECT @PJ_ID=PJ_ID FROM Meta.Project WHERE CL_ID=@CL_ID AND PJ_Code=@PJ_Code AND _DeleteDate IS NULL;
  IF @PJ_ID IS NULL THROW 51002, ''Project not found'', 1;

  IF @MakeEnv NOT IN (''ProdA'',''ProdB'') THROW 51003, ''MakeEnv must be ProdA or ProdB'', 1;

  -- deactivate current
  UPDATE Meta.Target
     SET TG_IsActive=0, _UpdateDate=sysutcdatetime(), _UpdatedBy=@Actor
   WHERE CL_ID=@CL_ID AND PJ_ID=@PJ_ID AND TG_SwitchGroup=@SwitchGroup AND TG_IsActive=1 AND _DeleteDate IS NULL;

  -- activate requested
  UPDATE Meta.Target
     SET TG_IsActive=1, TG_ActiveSince=sysutcdatetime(), _UpdateDate=sysutcdatetime(), _UpdatedBy=@Actor
   WHERE CL_ID=@CL_ID AND PJ_ID=@PJ_ID AND TG_SwitchGroup=@SwitchGroup AND TG_Env=@MakeEnv AND _DeleteDate IS NULL;

  IF @@ROWCOUNT=0 THROW 51004, ''Target slot row not found for requested env'', 1;
END
');
GO

/* =========================
   Seed minimal languages + logical types (optional)
   ========================= */
IF NOT EXISTS (SELECT 1 FROM Meta.Language WHERE LG_Code='en-US')
  INSERT INTO Meta.Language(LG_Code, LG_Name, LG_IsDefault) VALUES ('en-US','English (US)',1);
IF NOT EXISTS (SELECT 1 FROM Meta.Language WHERE LG_Code='es-ES')
  INSERT INTO Meta.Language(LG_Code, LG_Name, LG_IsDefault) VALUES ('es-ES','Spanish (Spain)',0);
IF NOT EXISTS (SELECT 1 FROM Meta.Language WHERE LG_Code='pt-BR')
  INSERT INTO Meta.Language(LG_Code, LG_Name, LG_IsDefault) VALUES ('pt-BR','Portuguese (Brazil)',0);
GO

IF NOT EXISTS (SELECT 1 FROM Meta.LogicalType WHERE LT_Code='UUIDv7')
  INSERT INTO Meta.LogicalType(LT_Code, LT_Description) VALUES ('UUIDv7','UUID version 7 semantics (generate in app layer)');
IF NOT EXISTS (SELECT 1 FROM Meta.LogicalType WHERE LT_Code='String')
  INSERT INTO Meta.LogicalType(LT_Code, LT_Description) VALUES ('String','Unicode string');
IF NOT EXISTS (SELECT 1 FROM Meta.LogicalType WHERE LT_Code='DateTimeUTC')
  INSERT INTO Meta.LogicalType(LT_Code, LT_Description) VALUES ('DateTimeUTC','UTC timestamp');
IF NOT EXISTS (SELECT 1 FROM Meta.LogicalType WHERE LT_Code='Int64')
  INSERT INTO Meta.LogicalType(LT_Code, LT_Description) VALUES ('Int64','64-bit integer');
IF NOT EXISTS (SELECT 1 FROM Meta.LogicalType WHERE LT_Code='Decimal')
  INSERT INTO Meta.LogicalType(LT_Code, LT_Description) VALUES ('Decimal','Arbitrary precision decimal');
GO



/* =========================
   Security & Governance (metadata-driven)
   - Row-level security (RLS) policies
   - Field-level security (FLS) / visibility
   - Encryption / masking policies
   - Classification and access rationale
   ========================= */

IF OBJECT_ID('Meta.SecurityClassification','U') IS NULL
BEGIN
  CREATE TABLE Meta.SecurityClassification (
    SC_Code         nvarchar(50) NOT NULL CONSTRAINT pk_SC PRIMARY KEY, -- Public/Internal/Confidential/Restricted/Sealed
    SC_SortOrder    int NOT NULL,
    SC_TextKeyID    uniqueidentifier NULL,
    SC_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_SC_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_SC_TK FOREIGN KEY (SC_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );

  IF NOT EXISTS (SELECT 1 FROM Meta.SecurityClassification WHERE SC_Code='Public')
    INSERT INTO Meta.SecurityClassification(SC_Code, SC_SortOrder) VALUES
      ('Public',1),('Internal',2),('Confidential',3),('Restricted',4),('Sealed',5);
END
GO

-- Row-level security policy definition (logical)
IF OBJECT_ID('Meta.SecurityPolicy','U') IS NULL
BEGIN
  CREATE TABLE Meta.SecurityPolicy (
    SP_ID           uniqueidentifier NOT NULL CONSTRAINT pk_SP PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    SP_Code         nvarchar(120) NOT NULL,     -- e.g., Case_RLS_Default
    SP_Type         nvarchar(30) NOT NULL,      -- RLS/FLS/ABAC
    SP_TextKeyID    uniqueidentifier NULL,
    SP_ExpressionLogical nvarchar(max) NOT NULL, -- JSON/DSL (portable)
    SP_Notes        nvarchar(1000) NULL,
    SP_IsEnabled    bit NOT NULL CONSTRAINT df_SP_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_SP_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_SP_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_SP_TK FOREIGN KEY (SP_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_SP_Code ON Meta.SecurityPolicy(PJ_ID, SP_Code) WHERE _DeleteDate IS NULL;
END
GO

-- Apply policy to canonical tables (RLS) and/or fields (FLS)
IF OBJECT_ID('Meta.TableSecurity','U') IS NULL
BEGIN
  CREATE TABLE Meta.TableSecurity (
    TS_ID           uniqueidentifier NOT NULL CONSTRAINT pk_TS PRIMARY KEY,
    TB_ID           uniqueidentifier NOT NULL,
    SP_ID           uniqueidentifier NOT NULL,
    TS_Mode         nvarchar(30) NOT NULL,  -- Filter/Block/Both (for SQL Server semantics) or Enforce
    TS_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_TS_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_TS_TB FOREIGN KEY (TB_ID) REFERENCES Meta.Table(TB_ID),
    CONSTRAINT fk_TS_SP FOREIGN KEY (SP_ID) REFERENCES Meta.SecurityPolicy(SP_ID)
  );
  CREATE UNIQUE INDEX ix_TS_Unique ON Meta.TableSecurity(TB_ID, SP_ID) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.FieldSecurity','U') IS NULL
BEGIN
  CREATE TABLE Meta.FieldSecurity (
    FS_ID           uniqueidentifier NOT NULL CONSTRAINT pk_FS PRIMARY KEY,
    FD_ID           uniqueidentifier NOT NULL,
    SP_ID           uniqueidentifier NOT NULL, -- FLS policy or ABAC rule
    FS_Action       nvarchar(30) NOT NULL,     -- Hide/Mask/Deny/ReadOnly
    FS_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_FS_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_FS_FD FOREIGN KEY (FD_ID) REFERENCES Meta.Field(FD_ID),
    CONSTRAINT fk_FS_SP FOREIGN KEY (SP_ID) REFERENCES Meta.SecurityPolicy(SP_ID)
  );
  CREATE UNIQUE INDEX ix_FS_Unique ON Meta.FieldSecurity(FD_ID, SP_ID) WHERE _DeleteDate IS NULL;
END
GO

-- Roles (portable logical roles) and role membership mapping for apps/services
IF OBJECT_ID('Meta.Role','U') IS NULL
BEGIN
  CREATE TABLE Meta.Role (
    RO_ID           uniqueidentifier NOT NULL CONSTRAINT pk_RO PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    RO_Code         nvarchar(120) NOT NULL, -- e.g., Investigator, Clerk, Supervisor, Admin
    RO_TextKeyID    uniqueidentifier NULL,
    RO_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_RO_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_RO_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_RO_TK FOREIGN KEY (RO_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_RO_Code ON Meta.Role(PJ_ID, RO_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.PrincipalRole','U') IS NULL
BEGIN
  CREATE TABLE Meta.PrincipalRole (
    PRR_ID          uniqueidentifier NOT NULL CONSTRAINT pk_PRR PRIMARY KEY,
    PR_ID           uniqueidentifier NOT NULL,
    RO_ID           uniqueidentifier NOT NULL,
    PRR_Notes       nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_PRR_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_PRR_PR FOREIGN KEY (PR_ID) REFERENCES Sec.Principal(PR_ID),
    CONSTRAINT fk_PRR_RO FOREIGN KEY (RO_ID) REFERENCES Meta.Role(RO_ID)
  );
  CREATE UNIQUE INDEX ix_PRR_Unique ON Meta.PrincipalRole(PR_ID, RO_ID) WHERE _DeleteDate IS NULL;
END
GO

-- Encryption and masking rules (portable)
IF OBJECT_ID('Meta.DataProtectionPolicy','U') IS NULL
BEGIN
  CREATE TABLE Meta.DataProtectionPolicy (
    DP_ID           uniqueidentifier NOT NULL CONSTRAINT pk_DP PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    DP_Code         nvarchar(120) NOT NULL,     -- e.g., PII_Default, Sealed_Strong
    DP_Type         nvarchar(30) NOT NULL,      -- Encrypt/Mask/Tokenize/Hash
    DP_TextKeyID    uniqueidentifier NULL,
    DP_Algorithm    nvarchar(80) NULL,          -- AES256, AlwaysEncrypted, etc.
    DP_KeyRef       nvarchar(500) NULL,         -- KeyVault ref / KMS ref
    DP_ExpressionLogical nvarchar(max) NULL,    -- JSON/DSL for portability
    DP_Notes        nvarchar(1000) NULL,
    DP_IsEnabled    bit NOT NULL CONSTRAINT df_DP_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_DP_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_DP_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_DP_TK FOREIGN KEY (DP_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_DP_Code ON Meta.DataProtectionPolicy(PJ_ID, DP_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.FieldProtection','U') IS NULL
BEGIN
  CREATE TABLE Meta.FieldProtection (
    FP_ID           uniqueidentifier NOT NULL CONSTRAINT pk_FP PRIMARY KEY,
    FD_ID           uniqueidentifier NOT NULL,
    DP_ID           uniqueidentifier NOT NULL,
    FP_Mode         nvarchar(30) NOT NULL, -- AtRest/InUse/Transit (logical)
    FP_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_FP_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_FP_FD FOREIGN KEY (FD_ID) REFERENCES Meta.Field(FD_ID),
    CONSTRAINT fk_FP_DP FOREIGN KEY (DP_ID) REFERENCES Meta.DataProtectionPolicy(DP_ID)
  );
  CREATE UNIQUE INDEX ix_FP_Unique ON Meta.FieldProtection(FD_ID, DP_ID) WHERE _DeleteDate IS NULL;
END
GO

-- Classification at table/field level
IF OBJECT_ID('Meta.ObjectClassification','U') IS NULL
BEGIN
  CREATE TABLE Meta.ObjectClassification (
    OC_ID           uniqueidentifier NOT NULL CONSTRAINT pk_OC PRIMARY KEY,
    OC_ObjectType   nvarchar(30) NOT NULL,  -- Table/Field/Metric/Doc
    OC_ObjectID     uniqueidentifier NOT NULL,
    SC_Code         nvarchar(50) NOT NULL,
    OC_Justification nvarchar(1000) NULL,
    OC_TextKeyID    uniqueidentifier NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_OC_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_OC_SC FOREIGN KEY (SC_Code) REFERENCES Meta.SecurityClassification(SC_Code),
    CONSTRAINT fk_OC_TK FOREIGN KEY (OC_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE INDEX ix_OC_Object ON Meta.ObjectClassification(OC_ObjectType, OC_ObjectID) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   Stored procedures for policies (upsert helpers)
   ========================= */
IF OBJECT_ID('Meta.securitypolicy_upsert','P') IS NULL
EXEC('
CREATE PROCEDURE Meta.securitypolicy_upsert
  @SP_ID uniqueidentifier = NULL,
  @CL_Code nvarchar(50),
  @PJ_Code nvarchar(80),
  @SP_Code nvarchar(120),
  @SP_Type nvarchar(30),
  @SP_ExpressionLogical nvarchar(max),
  @Actor nvarchar(128) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @CL_ID uniqueidentifier, @PJ_ID uniqueidentifier;
  SELECT @CL_ID=CL_ID FROM Meta.Client WHERE CL_Code=@CL_Code AND _DeleteDate IS NULL;
  IF @CL_ID IS NULL THROW 52001, ''Client not found'', 1;
  SELECT @PJ_ID=PJ_ID FROM Meta.Project WHERE CL_ID=@CL_ID AND PJ_Code=@PJ_Code AND _DeleteDate IS NULL;
  IF @PJ_ID IS NULL THROW 52002, ''Project not found'', 1;

  IF @SP_ID IS NULL SET @SP_ID = NEWID();

  MERGE Meta.SecurityPolicy AS t
  USING (SELECT @SP_ID AS SP_ID, @PJ_ID AS PJ_ID, @SP_Code AS SP_Code) AS s
  ON (t.SP_ID=s.SP_ID OR (t.PJ_ID=s.PJ_ID AND t.SP_Code=s.SP_Code AND t._DeleteDate IS NULL))
  WHEN MATCHED THEN UPDATE SET SP_Type=@SP_Type, SP_ExpressionLogical=@SP_ExpressionLogical,
                              _UpdateDate=sysutcdatetime(), _UpdatedBy=@Actor
  WHEN NOT MATCHED THEN
    INSERT (SP_ID, PJ_ID, SP_Code, SP_Type, SP_ExpressionLogical, _CreateDate, _CreatedBy)
    VALUES (@SP_ID, @PJ_ID, @SP_Code, @SP_Type, @SP_ExpressionLogical, sysutcdatetime(), @Actor);

  SELECT @SP_ID AS SP_ID;
END
');
GO



/* =========================
   Workflow / State Machine / Approvals / SLA (metadata-driven)
   ========================= */

-- Workflow defines lifecycle rules for an entity (table) or UI entity
IF OBJECT_ID('Meta.Workflow','U') IS NULL
BEGIN
  CREATE TABLE Meta.Workflow (
    WF_ID           uniqueidentifier NOT NULL CONSTRAINT pk_WF PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    WF_Code         nvarchar(120) NOT NULL,      -- e.g., CaseLifecycle, InvoiceLifecycle
    WF_ObjectType   nvarchar(30) NOT NULL,       -- Table/UiEntity
    WF_ObjectID     uniqueidentifier NULL,       -- TB_ID or UE_ID (optional, if scoped)
    WF_TextKeyID    uniqueidentifier NULL,       -- localized name/desc
    WF_Notes        nvarchar(1000) NULL,
    WF_IsEnabled    bit NOT NULL CONSTRAINT df_WF_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_WF_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_WF_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_WF_TK FOREIGN KEY (WF_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_WF_Code ON Meta.Workflow(PJ_ID, WF_Code) WHERE _DeleteDate IS NULL;
END
GO

-- States in a workflow
IF OBJECT_ID('Meta.WorkflowState','U') IS NULL
BEGIN
  CREATE TABLE Meta.WorkflowState (
    WS_ID           uniqueidentifier NOT NULL CONSTRAINT pk_WS PRIMARY KEY,
    WF_ID           uniqueidentifier NOT NULL,
    WS_Code         nvarchar(120) NOT NULL,      -- e.g., Draft, Submitted, Approved, Closed
    WS_IsStart      bit NOT NULL CONSTRAINT df_WS_IsStart DEFAULT (0),
    WS_IsTerminal   bit NOT NULL CONSTRAINT df_WS_IsTerminal DEFAULT (0),
    WS_TextKeyID    uniqueidentifier NULL,
    WS_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_WS_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_WS_WF FOREIGN KEY (WF_ID) REFERENCES Meta.Workflow(WF_ID),
    CONSTRAINT fk_WS_TK FOREIGN KEY (WS_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_WS_Unique ON Meta.WorkflowState(WF_ID, WS_Code) WHERE _DeleteDate IS NULL;
END
GO

-- Transitions between states, with optional guard/condition and required roles
IF OBJECT_ID('Meta.WorkflowTransition','U') IS NULL
BEGIN
  CREATE TABLE Meta.WorkflowTransition (
    WT_ID           uniqueidentifier NOT NULL CONSTRAINT pk_WT PRIMARY KEY,
    WF_ID           uniqueidentifier NOT NULL,
    WT_FromWS_ID    uniqueidentifier NOT NULL,
    WT_ToWS_ID      uniqueidentifier NOT NULL,
    WT_Code         nvarchar(120) NOT NULL,      -- e.g., submit, approve, reject, close
    WT_TextKeyID    uniqueidentifier NULL,
    WT_GuardLogical nvarchar(max) NULL,          -- JSON/DSL condition (portable)
    WT_ActionLogical nvarchar(max) NULL,         -- JSON/DSL side effects (portable)
    WT_Notes        nvarchar(1000) NULL,
    WT_IsEnabled    bit NOT NULL CONSTRAINT df_WT_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_WT_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_WT_WF FOREIGN KEY (WF_ID) REFERENCES Meta.Workflow(WF_ID),
    CONSTRAINT fk_WT_From FOREIGN KEY (WT_FromWS_ID) REFERENCES Meta.WorkflowState(WS_ID),
    CONSTRAINT fk_WT_To FOREIGN KEY (WT_ToWS_ID) REFERENCES Meta.WorkflowState(WS_ID),
    CONSTRAINT fk_WT_TK FOREIGN KEY (WT_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_WT_Unique ON Meta.WorkflowTransition(WF_ID, WT_Code, WT_FromWS_ID, WT_ToWS_ID) WHERE _DeleteDate IS NULL;
END
GO

-- Roles allowed to execute a transition
IF OBJECT_ID('Meta.WorkflowTransitionRole','U') IS NULL
BEGIN
  CREATE TABLE Meta.WorkflowTransitionRole (
    WTR_ID          uniqueidentifier NOT NULL CONSTRAINT pk_WTR PRIMARY KEY,
    WT_ID           uniqueidentifier NOT NULL,
    RO_ID           uniqueidentifier NOT NULL,
    WTR_Notes       nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_WTR_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_WTR_WT FOREIGN KEY (WT_ID) REFERENCES Meta.WorkflowTransition(WT_ID),
    CONSTRAINT fk_WTR_RO FOREIGN KEY (RO_ID) REFERENCES Meta.Role(RO_ID)
  );
  CREATE UNIQUE INDEX ix_WTR_Unique ON Meta.WorkflowTransitionRole(WT_ID, RO_ID) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   Approvals (multi-step, multi-actor)
   ========================= */
IF OBJECT_ID('Meta.ApprovalFlow','U') IS NULL
BEGIN
  CREATE TABLE Meta.ApprovalFlow (
    AF_ID           uniqueidentifier NOT NULL CONSTRAINT pk_AF PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    AF_Code         nvarchar(120) NOT NULL,        -- e.g., CaseApproval, PurchaseApproval
    AF_TextKeyID    uniqueidentifier NULL,
    AF_Notes        nvarchar(1000) NULL,
    AF_IsEnabled    bit NOT NULL CONSTRAINT df_AF_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_AF_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_AF_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_AF_TK FOREIGN KEY (AF_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_AF_Code ON Meta.ApprovalFlow(PJ_ID, AF_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.ApprovalStep','U') IS NULL
BEGIN
  CREATE TABLE Meta.ApprovalStep (
    AS_ID           uniqueidentifier NOT NULL CONSTRAINT pk_AFS PRIMARY KEY,
    AF_ID           uniqueidentifier NOT NULL,
    AS_Order        int NOT NULL,
    AS_Code         nvarchar(120) NOT NULL,         -- e.g., supervisor, legal, finance
    AS_TextKeyID    uniqueidentifier NULL,
    AS_RuleLogical  nvarchar(max) NULL,             -- JSON/DSL: required approvers, quorum, etc.
    AS_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_AFS_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_AFS_AF FOREIGN KEY (AF_ID) REFERENCES Meta.ApprovalFlow(AF_ID),
    CONSTRAINT fk_AFS_TK FOREIGN KEY (AS_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_AFS_Unique ON Meta.ApprovalStep(AF_ID, AS_Order) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.ApprovalStepRole','U') IS NULL
BEGIN
  CREATE TABLE Meta.ApprovalStepRole (
    ASR_ID          uniqueidentifier NOT NULL CONSTRAINT pk_ASR PRIMARY KEY,
    AS_ID           uniqueidentifier NOT NULL,
    RO_ID           uniqueidentifier NOT NULL,
    ASR_Notes       nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_ASR_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_ASR_AS FOREIGN KEY (AS_ID) REFERENCES Meta.ApprovalStep(AS_ID),
    CONSTRAINT fk_ASR_RO FOREIGN KEY (RO_ID) REFERENCES Meta.Role(RO_ID)
  );
  CREATE UNIQUE INDEX ix_ASR_Unique ON Meta.ApprovalStepRole(AS_ID, RO_ID) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   SLA (timers, targets, escalations) - metadata-driven
   ========================= */
IF OBJECT_ID('Meta.SlaPolicy','U') IS NULL
BEGIN
  CREATE TABLE Meta.SlaPolicy (
    SL_ID           uniqueidentifier NOT NULL CONSTRAINT pk_SL PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    SL_Code         nvarchar(120) NOT NULL,       -- e.g., CaseResponse, EvidenceReview
    SL_ObjectType   nvarchar(30) NOT NULL,        -- Workflow/Transition/ApprovalStep/Table/UiEntity
    SL_ObjectID     uniqueidentifier NULL,
    SL_TextKeyID    uniqueidentifier NULL,
    SL_TargetMinutes int NOT NULL,
    SL_WarnMinutes  int NULL,
    SL_EscalationRule nvarchar(max) NULL,         -- JSON/DSL: who to notify, how, severity
    SL_Notes        nvarchar(1000) NULL,
    SL_IsEnabled    bit NOT NULL CONSTRAINT df_SL_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_SL_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_SL_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_SL_TK FOREIGN KEY (SL_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_SL_Code ON Meta.SlaPolicy(PJ_ID, SL_Code) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   Event Journal / Immutable Audit Templates (DATA PLANE PATTERNS)
   NOTE: These are templates stored in MetaDB as artifacts; actual data-plane tables are generated.
   ========================= */

IF OBJECT_ID('Meta.EventTemplate','U') IS NULL
BEGIN
  CREATE TABLE Meta.EventTemplate (
    ET_ID           uniqueidentifier NOT NULL CONSTRAINT pk_ET PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    ET_Code         nvarchar(120) NOT NULL,      -- e.g., EventJournal_v1, EntityAudit_v1
    ET_TextKeyID    uniqueidentifier NULL,
    ET_TemplateType nvarchar(50) NOT NULL,       -- EventJournal/AuditTrail/Outbox
    ET_SpecJSON     nvarchar(max) NOT NULL,      -- JSON spec used by generators
    ET_Notes        nvarchar(1000) NULL,
    ET_IsEnabled    bit NOT NULL CONSTRAINT df_ET_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_ET_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_ET_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_ET_TK FOREIGN KEY (ET_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_ET_Code ON Meta.EventTemplate(PJ_ID, ET_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.EventType','U') IS NULL
BEGIN
  CREATE TABLE Meta.EventType (
    EVTT_ID         uniqueidentifier NOT NULL CONSTRAINT pk_EVTT PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    EVTT_Code       nvarchar(200) NOT NULL,      -- e.g., Case.Created, Case.StatusChanged, Person.Merged
    EVTT_Category   nvarchar(80) NULL,           -- Domain category
    EVTT_TextKeyID  uniqueidentifier NULL,
    EVTT_SchemaJSON nvarchar(max) NULL,          -- JSON schema for payload (portable)
    EVTT_DefaultRetentionDays int NULL,
    EVTT_Notes      nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_EVTT_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_EVTT_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_EVTT_TK FOREIGN KEY (EVTT_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_EVTT_Code ON Meta.EventType(PJ_ID, EVTT_Code) WHERE _DeleteDate IS NULL;
END
GO

-- Bind workflow transitions to events (so every change is journaled)
IF OBJECT_ID('Meta.TransitionEvent','U') IS NULL
BEGIN
  CREATE TABLE Meta.TransitionEvent (
    TE_ID           uniqueidentifier NOT NULL CONSTRAINT pk_TE PRIMARY KEY,
    WT_ID           uniqueidentifier NOT NULL,
    EVTT_ID         uniqueidentifier NOT NULL,
    TE_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_TE_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_TE_WT FOREIGN KEY (WT_ID) REFERENCES Meta.WorkflowTransition(WT_ID),
    CONSTRAINT fk_TE_EVTT FOREIGN KEY (EVTT_ID) REFERENCES Meta.EventType(EVTT_ID)
  );
  CREATE UNIQUE INDEX ix_TE_Unique ON Meta.TransitionEvent(WT_ID, EVTT_ID) WHERE _DeleteDate IS NULL;
END
GO



/* =========================
   Workflow runtime tracking bindings (control-plane)
   These define how to generate/attach data-plane runtime tables for live entities.
   ========================= */

-- Runtime binding links a canonical entity (Table/UI) to runtime tracking pattern
IF OBJECT_ID('Meta.RuntimeBinding','U') IS NULL
BEGIN
  CREATE TABLE Meta.RuntimeBinding (
    RB_ID           uniqueidentifier NOT NULL CONSTRAINT pk_RB PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    RB_ObjectType   nvarchar(30) NOT NULL,        -- Table/UiEntity
    RB_ObjectID     uniqueidentifier NULL,        -- TB_ID or UE_ID
    WF_ID           uniqueidentifier NULL,        -- lifecycle to track
    AF_ID           uniqueidentifier NULL,        -- approval flow to track
    RB_RuntimeMode  nvarchar(30) NOT NULL,        -- None/Inline/Sidecar (recommended Sidecar)
    RB_InstanceKeyStrategy nvarchar(30) NOT NULL, -- ObjectID/Tenant+ObjectID/Composite
    RB_TextKeyID    uniqueidentifier NULL,
    RB_Notes        nvarchar(1000) NULL,
    RB_IsEnabled    bit NOT NULL CONSTRAINT df_RB_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_RB_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_RB_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_RB_WF FOREIGN KEY (WF_ID) REFERENCES Meta.Workflow(WF_ID),
    CONSTRAINT fk_RB_AF FOREIGN KEY (AF_ID) REFERENCES Meta.ApprovalFlow(AF_ID),
    CONSTRAINT fk_RB_TK FOREIGN KEY (RB_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE INDEX ix_RB_Object ON Meta.RuntimeBinding(PJ_ID, RB_ObjectType, RB_ObjectID) WHERE _DeleteDate IS NULL;
END
GO

-- Defines which runtime templates to use (workflow instance, SLA tracking, escalation queue, etc.)
IF OBJECT_ID('Meta.RuntimeTemplateBinding','U') IS NULL
BEGIN
  CREATE TABLE Meta.RuntimeTemplateBinding (
    RTB_ID          uniqueidentifier NOT NULL CONSTRAINT pk_RTB PRIMARY KEY,
    RB_ID           uniqueidentifier NOT NULL,
    ET_ID           uniqueidentifier NOT NULL,      -- Meta.EventTemplate (reused as generator template store)
    RTB_Purpose     nvarchar(50) NOT NULL,          -- WorkflowInstance/SlaTracking/ApprovalTracking/EscalationQueue
    RTB_TargetLayer nvarchar(30) NOT NULL,          -- OLTP/Lakehouse/Warehouse/Semantic
    RTB_Notes       nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_RTB_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_RTB_RB FOREIGN KEY (RB_ID) REFERENCES Meta.RuntimeBinding(RB_ID),
    CONSTRAINT fk_RTB_ET FOREIGN KEY (ET_ID) REFERENCES Meta.EventTemplate(ET_ID)
  );
  CREATE UNIQUE INDEX ix_RTB_Unique ON Meta.RuntimeTemplateBinding(RB_ID, ET_ID, RTB_Purpose) WHERE _DeleteDate IS NULL;
END
GO

-- Runtime signals catalog (portable)
IF OBJECT_ID('Meta.RuntimeSignalType','U') IS NULL
BEGIN
  CREATE TABLE Meta.RuntimeSignalType (
    RST_ID          uniqueidentifier NOT NULL CONSTRAINT pk_RST PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    RST_Code        nvarchar(200) NOT NULL,      -- SLA.Breached, SLA.Warned, Approval.Requested, Escalation.Raised
    RST_TextKeyID   uniqueidentifier NULL,
    RST_Severity    nvarchar(30) NULL,           -- Info/Warning/Critical
    RST_DefaultRetentionDays int NULL,
    RST_Notes       nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_RST_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_RST_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_RST_TK FOREIGN KEY (RST_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_RST_Code ON Meta.RuntimeSignalType(PJ_ID, RST_Code) WHERE _DeleteDate IS NULL;
END
GO

-- Bind SLA policies to runtime binding (so the generator knows which SLAs to track for an entity)
IF OBJECT_ID('Meta.RuntimeSlaBinding','U') IS NULL
BEGIN
  CREATE TABLE Meta.RuntimeSlaBinding (
    RSB_ID          uniqueidentifier NOT NULL CONSTRAINT pk_RSB PRIMARY KEY,
    RB_ID           uniqueidentifier NOT NULL,
    SL_ID           uniqueidentifier NOT NULL,
    RSB_StartRule   nvarchar(max) NULL,          -- JSON/DSL: when SLA timer starts (on state/transition/event)
    RSB_StopRule    nvarchar(max) NULL,          -- JSON/DSL: when SLA timer stops
    RSB_Notes       nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_RSB_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_RSB_RB FOREIGN KEY (RB_ID) REFERENCES Meta.RuntimeBinding(RB_ID),
    CONSTRAINT fk_RSB_SL FOREIGN KEY (SL_ID) REFERENCES Meta.SlaPolicy(SL_ID)
  );
  CREATE UNIQUE INDEX ix_RSB_Unique ON Meta.RuntimeSlaBinding(RB_ID, SL_ID) WHERE _DeleteDate IS NULL;
END
GO

/* =========================
   Seed runtime templates (stored as Meta.EventTemplate specs)
   ========================= */



/* =====================================================================
   UI/UX Generation (advanced)
   ===================================================================== */
IF OBJECT_ID('Meta.UiApp','U') IS NULL
BEGIN
  CREATE TABLE Meta.UiApp (
    UA_ID           uniqueidentifier NOT NULL CONSTRAINT pk_UA PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    UA_Code         nvarchar(120) NOT NULL, -- e.g., CasePortal, AdminConsole
    UA_TextKeyID    uniqueidentifier NULL,
    UA_ThemeJSON    nvarchar(max) NULL,
    UA_ConfigJSON   nvarchar(max) NULL,
    UA_IsEnabled    bit NOT NULL CONSTRAINT df_UA_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_UA_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_UA_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_UA_TK FOREIGN KEY (UA_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_UA_Code ON Meta.UiApp(PJ_ID, UA_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.UiPage','U') IS NULL
BEGIN
  CREATE TABLE Meta.UiPage (
    UP_ID           uniqueidentifier NOT NULL CONSTRAINT pk_UP PRIMARY KEY,
    UA_ID           uniqueidentifier NOT NULL,
    UP_Code         nvarchar(200) NOT NULL, -- e.g., Case.List, Case.Detail
    UP_Route        nvarchar(300) NULL,     -- /cases/:id
    UP_LayoutJSON   nvarchar(max) NULL,     -- grid layout, tabs, sections
    UP_TextKeyID    uniqueidentifier NULL,
    UP_IsEnabled    bit NOT NULL CONSTRAINT df_UP_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_UP_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_UP_UA FOREIGN KEY (UA_ID) REFERENCES Meta.UiApp(UA_ID),
    CONSTRAINT fk_UP_TK FOREIGN KEY (UP_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_UP_Code ON Meta.UiPage(UA_ID, UP_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.UiComponent','U') IS NULL
BEGIN
  CREATE TABLE Meta.UiComponent (
    UC_ID           uniqueidentifier NOT NULL CONSTRAINT pk_UC PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    UC_Code         nvarchar(200) NOT NULL, -- reusable component library token
    UC_Type         nvarchar(80) NOT NULL,  -- Table, Form, Card, Chart, Timeline, Map
    UC_SpecJSON     nvarchar(max) NOT NULL, -- component props, bindings
    UC_TextKeyID    uniqueidentifier NULL,
    UC_IsEnabled    bit NOT NULL CONSTRAINT df_UC_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_UC_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_UC_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_UC_TK FOREIGN KEY (UC_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_UC_Code ON Meta.UiComponent(PJ_ID, UC_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.UiPageComponent','U') IS NULL
BEGIN
  CREATE TABLE Meta.UiPageComponent (
    UPC_ID          uniqueidentifier NOT NULL CONSTRAINT pk_UPC PRIMARY KEY,
    UP_ID           uniqueidentifier NOT NULL,
    UC_ID           uniqueidentifier NOT NULL,
    UPC_Order       int NOT NULL,
    UPC_Region      nvarchar(80) NULL,      -- header/body/sidebar/footer
    UPC_VisibilityDSL nvarchar(max) NULL,   -- conditional show/hide
    UPC_TextKeyID   uniqueidentifier NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_UPC_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_UPC_UP FOREIGN KEY (UP_ID) REFERENCES Meta.UiPage(UP_ID),
    CONSTRAINT fk_UPC_UC FOREIGN KEY (UC_ID) REFERENCES Meta.UiComponent(UC_ID),
    CONSTRAINT fk_UPC_TK FOREIGN KEY (UPC_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_UPC_Order ON Meta.UiPageComponent(UP_ID, UPC_Order) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.UiValidationRule','U') IS NULL
BEGIN
  CREATE TABLE Meta.UiValidationRule (
    UV_ID           uniqueidentifier NOT NULL CONSTRAINT pk_UV PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    UV_Code         nvarchar(200) NOT NULL,
    UV_ObjectType   nvarchar(30) NOT NULL, -- UiField/Field/UiComponent
    UV_ObjectID     uniqueidentifier NULL,
    UV_RuleDSL      nvarchar(max) NOT NULL, -- portable DSL
    UV_MessageTextKeyID uniqueidentifier NULL,
    UV_Severity     nvarchar(30) NOT NULL, -- Info/Warning/Error
    UV_IsEnabled    bit NOT NULL CONSTRAINT df_UV_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_UV_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_UV_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_UV_TK FOREIGN KEY (UV_MessageTextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_UV_Code ON Meta.UiValidationRule(PJ_ID, UV_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.UiSearchFacet','U') IS NULL
BEGIN
  CREATE TABLE Meta.UiSearchFacet (
    UFAC_ID         uniqueidentifier NOT NULL CONSTRAINT pk_UFAC PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    UFAC_Code       nvarchar(200) NOT NULL,
    UFAC_ObjectType nvarchar(30) NOT NULL, -- Table/UiEntity
    UFAC_ObjectID   uniqueidentifier NULL, -- TB_ID/UE_ID
    UFAC_FieldPath  nvarchar(300) NOT NULL, -- object.field or json path
    UFAC_FacetType  nvarchar(50) NOT NULL,  -- Term/Range/Date/Geo
    UFAC_SortOrder  int NOT NULL CONSTRAINT df_UFAC_Sort DEFAULT (0),
    UFAC_TextKeyID  uniqueidentifier NULL,
    UFAC_ConfigJSON nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_UFAC_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_UFAC_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_UFAC_TK FOREIGN KEY (UFAC_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_UFAC_Code ON Meta.UiSearchFacet(PJ_ID, UFAC_Code) WHERE _DeleteDate IS NULL;
END
GO

/* =====================================================================
   Document/Evidence Chain of Custody (integrity templates)
   ===================================================================== */
IF OBJECT_ID('Meta.RetentionPolicy','U') IS NULL
BEGIN
  CREATE TABLE Meta.RetentionPolicy (
    RTN_ID          uniqueidentifier NOT NULL CONSTRAINT pk_RTN PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    RTN_Code        nvarchar(120) NOT NULL,
    RTN_RetentionDays int NULL,
    RTN_Disposition nvarchar(50) NULL, -- Archive/Purge/LegalHold
    RTN_TextKeyID   uniqueidentifier NULL,
    RTN_ConfigJSON  nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_RTN_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_RTN_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_RTN_TK FOREIGN KEY (RTN_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_RTN_Code ON Meta.RetentionPolicy(PJ_ID, RTN_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.DocumentPolicy','U') IS NULL
BEGIN
  CREATE TABLE Meta.DocumentPolicy (
    DPL_ID          uniqueidentifier NOT NULL CONSTRAINT pk_DPL PRIMARY KEY,
    DT_ID           uniqueidentifier NOT NULL,
    RTN_ID          uniqueidentifier NULL,
    DPL_IntegrityMode nvarchar(50) NOT NULL, -- Hash/Signed/HashChain/WORM
    DPL_RedactionPolicyID uniqueidentifier NULL,
    DPL_WatermarkPolicyJSON nvarchar(max) NULL,
    DPL_ConfigJSON  nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_DPL_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_DPL_DT FOREIGN KEY (DT_ID) REFERENCES Meta.DocumentType(DT_ID),
    CONSTRAINT fk_DPL_RTN FOREIGN KEY (RTN_ID) REFERENCES Meta.RetentionPolicy(RTN_ID),
    CONSTRAINT fk_DPL_RP FOREIGN KEY (DPL_RedactionPolicyID) REFERENCES Meta.RedactionPolicy(RP_ID)
  );
  CREATE UNIQUE INDEX ix_DPL_DT ON Meta.DocumentPolicy(DT_ID) WHERE _DeleteDate IS NULL;
END
GO

/* =====================================================================
   Lineage / Observability / Job Runs (deterministic audit for pipelines)
   ===================================================================== */
IF OBJECT_ID('Meta.DataAsset','U') IS NULL
BEGIN
  CREATE TABLE Meta.DataAsset (
    DA_ID           uniqueidentifier NOT NULL CONSTRAINT pk_DA PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    DA_AssetType    nvarchar(30) NOT NULL, -- Table/View/File/Topic/Semantic
    DA_LogicalName  nvarchar(400) NOT NULL, -- canonical name
    DA_PhysicalRef  nvarchar(600) NULL,     -- platform ref
    DA_TextKeyID    uniqueidentifier NULL,
    DA_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_DA_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_DA_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_DA_TK FOREIGN KEY (DA_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_DA_Name ON Meta.DataAsset(PJ_ID, DA_AssetType, DA_LogicalName) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.LineageEdge','U') IS NULL
BEGIN
  CREATE TABLE Meta.LineageEdge (
    LE_ID           uniqueidentifier NOT NULL CONSTRAINT pk_LE PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    LE_FromDA_ID    uniqueidentifier NOT NULL,
    LE_ToDA_ID      uniqueidentifier NOT NULL,
    LE_TransformDSL nvarchar(max) NULL, -- field-level mapping / sql / dsl
    LE_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_LE_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_LE_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_LE_From FOREIGN KEY (LE_FromDA_ID) REFERENCES Meta.DataAsset(DA_ID),
    CONSTRAINT fk_LE_To FOREIGN KEY (LE_ToDA_ID) REFERENCES Meta.DataAsset(DA_ID)
  );
  CREATE INDEX ix_LE_FromTo ON Meta.LineageEdge(PJ_ID, LE_FromDA_ID, LE_ToDA_ID) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.JobRun','U') IS NULL
BEGIN
  CREATE TABLE Meta.JobRun (
    JR_ID           uniqueidentifier NOT NULL CONSTRAINT pk_JR PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    JB_ID           uniqueidentifier NULL, -- Meta.Job (if exists) or external
    JR_RunKey       nvarchar(200) NOT NULL, -- external run id
    JR_Status       nvarchar(30) NOT NULL,  -- Running/Succeeded/Failed/Cancelled
    JR_StartUTC     datetime2(3) NOT NULL,
    JR_EndUTC       datetime2(3) NULL,
    JR_MetricsJSON  nvarchar(max) NULL, -- rows read/written, bytes, costs
    JR_ErrorJSON    nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_JR_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_JR_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID)
  );
  CREATE INDEX ix_JR_Status ON Meta.JobRun(PJ_ID, JR_Status, JR_StartUTC) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.JobRunAsset','U') IS NULL
BEGIN
  CREATE TABLE Meta.JobRunAsset (
    JRA_ID          uniqueidentifier NOT NULL CONSTRAINT pk_JRA PRIMARY KEY,
    JR_ID           uniqueidentifier NOT NULL,
    DA_ID           uniqueidentifier NOT NULL,
    JRA_Role        nvarchar(30) NOT NULL, -- Input/Output
    JRA_StatsJSON   nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_JRA_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_JRA_JR FOREIGN KEY (JR_ID) REFERENCES Meta.JobRun(JR_ID),
    CONSTRAINT fk_JRA_DA FOREIGN KEY (DA_ID) REFERENCES Meta.DataAsset(DA_ID)
  );
  CREATE INDEX ix_JRA_JR ON Meta.JobRunAsset(JR_ID, JRA_Role) WHERE _DeleteDate IS NULL;
END
GO

/* =====================================================================
   Offline Sync / Conflict Resolution (policy-driven)
   ===================================================================== */
IF OBJECT_ID('Meta.SyncPolicy','U') IS NULL
BEGIN
  CREATE TABLE Meta.SyncPolicy (
    SY_ID           uniqueidentifier NOT NULL CONSTRAINT pk_SY PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    SY_Code         nvarchar(120) NOT NULL,
    SY_ObjectType   nvarchar(30) NOT NULL, -- Table/UiEntity
    SY_ObjectID     uniqueidentifier NULL,
    SY_Mode         nvarchar(30) NOT NULL, -- OfflineFirst/OnlineOnly/Hybrid
    SY_MergeDSL     nvarchar(max) NULL,    -- conflict resolution policy
    SY_IdempotencyKeySpec nvarchar(300) NULL,
    SY_Notes        nvarchar(1000) NULL,
    SY_IsEnabled    bit NOT NULL CONSTRAINT df_SY_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_SY_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_SY_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID)
  );
  CREATE UNIQUE INDEX ix_SY_Code ON Meta.SyncPolicy(PJ_ID, SY_Code) WHERE _DeleteDate IS NULL;
END
GO

/* =====================================================================
   BI deep model: Facts/Dimensions/Grain/SCD/Partitions/Aggregations
   ===================================================================== */
IF OBJECT_ID('Meta.FactTable','U') IS NULL
BEGIN
  CREATE TABLE Meta.FactTable (
    FTBL_ID         uniqueidentifier NOT NULL CONSTRAINT pk_FTBL PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    FTBL_Code       nvarchar(120) NOT NULL,
    TB_ID           uniqueidentifier NOT NULL,
    FTBL_GrainJSON  nvarchar(max) NOT NULL, -- grain definition
    FTBL_IsSnapshot bit NOT NULL CONSTRAINT df_FTBL_IsSnapshot DEFAULT (0),
    FTBL_TextKeyID  uniqueidentifier NULL,
    FTBL_Notes      nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_FTBL_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_FTBL_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_FTBL_TB FOREIGN KEY (TB_ID) REFERENCES Meta.Table(TB_ID),
    CONSTRAINT fk_FTBL_TK FOREIGN KEY (FTBL_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_FTBL_Code ON Meta.FactTable(PJ_ID, FTBL_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.DimensionTable','U') IS NULL
BEGIN
  CREATE TABLE Meta.DimensionTable (
    DMT_ID          uniqueidentifier NOT NULL CONSTRAINT pk_DMT PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    DMT_Code        nvarchar(120) NOT NULL,
    TB_ID           uniqueidentifier NOT NULL,
    DMT_ScdType     nvarchar(20) NULL, -- Type1/Type2/Type3
    DMT_NaturalKeySpec nvarchar(300) NULL,
    DMT_TextKeyID   uniqueidentifier NULL,
    DMT_Notes       nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_DMT_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_DMT_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_DMT_TB FOREIGN KEY (TB_ID) REFERENCES Meta.Table(TB_ID),
    CONSTRAINT fk_DMT_TK FOREIGN KEY (DMT_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_DMT_Code ON Meta.DimensionTable(PJ_ID, DMT_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.PartitionSpec','U') IS NULL
BEGIN
  CREATE TABLE Meta.PartitionSpec (
    PS_ID           uniqueidentifier NOT NULL CONSTRAINT pk_PS PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    PS_ObjectType   nvarchar(30) NOT NULL, -- Table/Fact/Dimension
    PS_ObjectID     uniqueidentifier NULL,
    PS_Strategy     nvarchar(30) NOT NULL, -- Date/Hash/Range/List
    PS_SpecJSON     nvarchar(max) NOT NULL,
    PS_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_PS_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_PS_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID)
  );
  CREATE INDEX ix_PS_Object ON Meta.PartitionSpec(PJ_ID, PS_ObjectType, PS_ObjectID) WHERE _DeleteDate IS NULL;
END
GO



/* =====================================================================
   Localization Governance (required languages per project) + explicit TextUsage
   ===================================================================== */
IF OBJECT_ID('Meta.ProjectLanguage','U') IS NULL
BEGIN
  CREATE TABLE Meta.ProjectLanguage (
    PL_ID           uniqueidentifier NOT NULL CONSTRAINT pk_PL PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    LG_Code         nvarchar(20) NOT NULL,
    PL_IsDefault    bit NOT NULL CONSTRAINT df_PL_IsDefault DEFAULT (0),
    PL_IsRequired   bit NOT NULL CONSTRAINT df_PL_IsRequired DEFAULT (1),
    PL_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_PL_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_PL_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_PL_LG FOREIGN KEY (LG_Code) REFERENCES Meta.Language(LG_Code)
  );
  CREATE UNIQUE INDEX ix_PL_Unique ON Meta.ProjectLanguage(PJ_ID, LG_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.TextUsage','U') IS NULL
BEGIN
  CREATE TABLE Meta.TextUsage (
    TU_ID           uniqueidentifier NOT NULL CONSTRAINT pk_TU PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    TU_ObjectType   nvarchar(50) NOT NULL,      -- Table/Field/Workflow/UiPage/etc
    TU_ObjectID     uniqueidentifier NULL,
    TU_PropertyName nvarchar(80) NOT NULL,      -- Name/Description/Label/Message
    TK_ID           uniqueidentifier NOT NULL,
    TU_Notes        nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_TU_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_TU_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_TU_TK FOREIGN KEY (TK_ID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE INDEX ix_TU_Object ON Meta.TextUsage(PJ_ID, TU_ObjectType, TU_ObjectID) WHERE _DeleteDate IS NULL;
  CREATE INDEX ix_TU_TK ON Meta.TextUsage(PJ_ID, TK_ID) WHERE _DeleteDate IS NULL;
END
GO

/* =====================================================================
   Deep Search / Intelligence (search indexes + graph)
   ===================================================================== */
IF OBJECT_ID('Meta.SearchIndex','U') IS NULL
BEGIN
  CREATE TABLE Meta.SearchIndex (
    SI_ID           uniqueidentifier NOT NULL CONSTRAINT pk_SI PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    SI_Code         nvarchar(120) NOT NULL,     -- PersonSearch, CaseSearch
    SI_Platform     nvarchar(30) NOT NULL,      -- AzureSearch/Elastic/OpenSearch/Neo4j
    SI_ConfigJSON   nvarchar(max) NULL,
    SI_TextKeyID    uniqueidentifier NULL,
    SI_IsEnabled    bit NOT NULL CONSTRAINT df_SI_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_SI_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_SI_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_SI_TK FOREIGN KEY (SI_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_SI_Code ON Meta.SearchIndex(PJ_ID, SI_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.SearchField','U') IS NULL
BEGIN
  CREATE TABLE Meta.SearchField (
    SFN_ID          uniqueidentifier NOT NULL CONSTRAINT pk_SFN PRIMARY KEY,
    SI_ID           uniqueidentifier NOT NULL,
    SFN_FieldPath   nvarchar(300) NOT NULL,     -- canonical path e.g., Person.LastName
    SFN_FieldType   nvarchar(30) NOT NULL,      -- Text/Keyword/Number/Date/Geo/Vector
    SFN_IsKey       bit NOT NULL CONSTRAINT df_SFN_IsKey DEFAULT (0),
    SFN_IsFilterable bit NOT NULL CONSTRAINT df_SFN_IsFilter DEFAULT (1),
    SFN_IsSortable  bit NOT NULL CONSTRAINT df_SFN_IsSortable DEFAULT (0),
    SFN_IsFacetable bit NOT NULL CONSTRAINT df_SFN_IsFacet DEFAULT (0),
    SFN_Analyzer    nvarchar(80) NULL,
    SFN_Boost       decimal(9,4) NULL,
    SFN_TextKeyID   uniqueidentifier NULL,
    SFN_ConfigJSON  nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_SFN_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_SFN_SI FOREIGN KEY (SI_ID) REFERENCES Meta.SearchIndex(SI_ID),
    CONSTRAINT fk_SFN_TK FOREIGN KEY (SFN_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE INDEX ix_SFN_Path ON Meta.SearchField(SI_ID, SFN_FieldPath) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.GraphModel','U') IS NULL
BEGIN
  CREATE TABLE Meta.GraphModel (
    GM_ID           uniqueidentifier NOT NULL CONSTRAINT pk_GM PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    GM_Code         nvarchar(120) NOT NULL,     -- RiskGraph, HRGraph
    GM_Platform     nvarchar(30) NOT NULL,      -- Neo4j/CosmosGremlin/JanusGraph
    GM_ConfigJSON   nvarchar(max) NULL,
    GM_TextKeyID    uniqueidentifier NULL,
    GM_IsEnabled    bit NOT NULL CONSTRAINT df_GM_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_GM_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_GM_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_GM_TK FOREIGN KEY (GM_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_GM_Code ON Meta.GraphModel(PJ_ID, GM_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.GraphNodeType','U') IS NULL
BEGIN
  CREATE TABLE Meta.GraphNodeType (
    GNT_ID          uniqueidentifier NOT NULL CONSTRAINT pk_GNT PRIMARY KEY,
    GM_ID           uniqueidentifier NOT NULL,
    GNT_Code        nvarchar(120) NOT NULL,     -- Person/Org/Case/Device
    GNT_SourceTB_ID uniqueidentifier NULL,      -- optional canonical table
    GNT_KeySpec     nvarchar(300) NULL,
    GNT_TextKeyID   uniqueidentifier NULL,
    GNT_ConfigJSON  nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_GNT_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_GNT_GM FOREIGN KEY (GM_ID) REFERENCES Meta.GraphModel(GM_ID),
    CONSTRAINT fk_GNT_TB FOREIGN KEY (GNT_SourceTB_ID) REFERENCES Meta.Table(TB_ID),
    CONSTRAINT fk_GNT_TK FOREIGN KEY (GNT_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_GNT_Code ON Meta.GraphNodeType(GM_ID, GNT_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.GraphEdgeType','U') IS NULL
BEGIN
  CREATE TABLE Meta.GraphEdgeType (
    GET_ID          uniqueidentifier NOT NULL CONSTRAINT pk_GET PRIMARY KEY,
    GM_ID           uniqueidentifier NOT NULL,
    GET_Code        nvarchar(120) NOT NULL,    -- Knows/WorksAt/LinkedTo/LocatedAt
    GET_FromGNT_ID  uniqueidentifier NOT NULL,
    GET_ToGNT_ID    uniqueidentifier NOT NULL,
    GET_Direction   nvarchar(20) NOT NULL,     -- Directed/Undirected
    GET_ScoreSpecDSL nvarchar(max) NULL,       -- confidence scoring DSL
    GET_TextKeyID   uniqueidentifier NULL,
    GET_ConfigJSON  nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_GET_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_GET_GM FOREIGN KEY (GM_ID) REFERENCES Meta.GraphModel(GM_ID),
    CONSTRAINT fk_GET_From FOREIGN KEY (GET_FromGNT_ID) REFERENCES Meta.GraphNodeType(GNT_ID),
    CONSTRAINT fk_GET_To FOREIGN KEY (GET_ToGNT_ID) REFERENCES Meta.GraphNodeType(GNT_ID),
    CONSTRAINT fk_GET_TK FOREIGN KEY (GET_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_GET_Code ON Meta.GraphEdgeType(GM_ID, GET_Code) WHERE _DeleteDate IS NULL;
END
GO

/* =====================================================================
   Governance: Consent / Purpose / Residency (high-assurance)
   ===================================================================== */
IF OBJECT_ID('Meta.Purpose','U') IS NULL
BEGIN
  CREATE TABLE Meta.Purpose (
    PRP_ID          uniqueidentifier NOT NULL CONSTRAINT pk_PRP PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    PRP_Code        nvarchar(120) NOT NULL,   -- CaseMgmt, Fraud, Analytics, NationalSecurity
    PRP_TextKeyID   uniqueidentifier NULL,
    PRP_Notes       nvarchar(1000) NULL,
    PRP_IsEnabled   bit NOT NULL CONSTRAINT df_PRP_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_PRP_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_PRP_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_PRP_TK FOREIGN KEY (PRP_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_PRP_Code ON Meta.Purpose(PJ_ID, PRP_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.ConsentPolicy','U') IS NULL
BEGIN
  CREATE TABLE Meta.ConsentPolicy (
    CP_ID           uniqueidentifier NOT NULL CONSTRAINT pk_CP PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    CP_Code         nvarchar(120) NOT NULL,
    CP_ObjectType   nvarchar(30) NOT NULL, -- Table/Field/Document
    CP_ObjectID     uniqueidentifier NULL,
    CP_PurposeID    uniqueidentifier NULL,
    CP_RuleDSL      nvarchar(max) NOT NULL, -- portable rule
    CP_TextKeyID    uniqueidentifier NULL,
    CP_IsEnabled    bit NOT NULL CONSTRAINT df_CP_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_CP_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_CP_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_CP_PRP FOREIGN KEY (CP_PurposeID) REFERENCES Meta.Purpose(PRP_ID),
    CONSTRAINT fk_CP_TK FOREIGN KEY (CP_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_CP_Code ON Meta.ConsentPolicy(PJ_ID, CP_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.ResidencyPolicy','U') IS NULL
BEGIN
  CREATE TABLE Meta.ResidencyPolicy (
    RDP_ID          uniqueidentifier NOT NULL CONSTRAINT pk_RDP PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    RDP_Code        nvarchar(120) NOT NULL,
    RDP_Region      nvarchar(30) NOT NULL, -- Azure region / country code
    RDP_ObjectType  nvarchar(30) NOT NULL, -- Table/Document/Semantic
    RDP_ObjectID    uniqueidentifier NULL,
    RDP_RuleDSL     nvarchar(max) NULL,
    RDP_TextKeyID   uniqueidentifier NULL,
    RDP_IsEnabled   bit NOT NULL CONSTRAINT df_RDP_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_RDP_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_RDP_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_RDP_TK FOREIGN KEY (RDP_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_RDP_Code ON Meta.ResidencyPolicy(PJ_ID, RDP_Code) WHERE _DeleteDate IS NULL;
END
GO

/* =====================================================================
   Outbox/Inbox + Idempotency (event-driven reliability)
   ===================================================================== */
IF OBJECT_ID('Meta.OutboxSpec','U') IS NULL
BEGIN
  CREATE TABLE Meta.OutboxSpec (
    OB_ID           uniqueidentifier NOT NULL CONSTRAINT pk_OB PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    OB_Code         nvarchar(120) NOT NULL,
    OB_SourceTB_ID  uniqueidentifier NULL,
    OB_ChannelID    uniqueidentifier NOT NULL,
    OB_IdempotencyKeySpec nvarchar(300) NULL,
    OB_Serializer   nvarchar(30) NULL,      -- JSON/Avro/Protobuf
    OB_ConfigJSON   nvarchar(max) NULL,
    OB_IsEnabled    bit NOT NULL CONSTRAINT df_OB_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_OB_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_OB_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_OB_TB FOREIGN KEY (OB_SourceTB_ID) REFERENCES Meta.Table(TB_ID),
    CONSTRAINT fk_OB_EC FOREIGN KEY (OB_ChannelID) REFERENCES Meta.EventChannel(EC_ID)
  );
  CREATE UNIQUE INDEX ix_OB_Code ON Meta.OutboxSpec(PJ_ID, OB_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.InboxSpec','U') IS NULL
BEGIN
  CREATE TABLE Meta.InboxSpec (
    IB_ID           uniqueidentifier NOT NULL CONSTRAINT pk_IB PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    IB_Code         nvarchar(120) NOT NULL,
    IB_ChannelID    uniqueidentifier NOT NULL,
    IB_DedupeKeySpec nvarchar(300) NULL,
    IB_RetrySpecJSON nvarchar(max) NULL,
    IB_ConfigJSON   nvarchar(max) NULL,
    IB_IsEnabled    bit NOT NULL CONSTRAINT df_IB_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_IB_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_IB_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_IB_EC FOREIGN KEY (IB_ChannelID) REFERENCES Meta.EventChannel(EC_ID)
  );
  CREATE UNIQUE INDEX ix_IB_Code ON Meta.InboxSpec(PJ_ID, IB_Code) WHERE _DeleteDate IS NULL;
END
GO


/* =====================================================================
   AI / ML Governance (features, models) - Enterprise control plane
   ===================================================================== */
IF OBJECT_ID('Meta.FeatureDef','U') IS NULL
BEGIN
  CREATE TABLE Meta.FeatureDef (
    FT_ID           uniqueidentifier NOT NULL CONSTRAINT pk_FT PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    FT_Code         nvarchar(200) NOT NULL,
    FT_EntityType   nvarchar(80) NULL,
    FT_ExpressionDSL nvarchar(max) NOT NULL,
    FT_FreshnessMin int NULL,
    FT_TextKeyID    uniqueidentifier NULL,
    FT_Notes        nvarchar(1000) NULL,
    FT_IsEnabled    bit NOT NULL CONSTRAINT df_FT_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_FT_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_FT_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_FT_TK FOREIGN KEY (FT_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_FT_Code ON Meta.FeatureDef(PJ_ID, FT_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.ModelRegistry','U') IS NULL
BEGIN
  CREATE TABLE Meta.ModelRegistry (
    ML_ID           uniqueidentifier NOT NULL CONSTRAINT pk_ML PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    ML_Code         nvarchar(200) NOT NULL,
    ML_Type         nvarchar(50) NOT NULL,
    ML_Version      nvarchar(80) NOT NULL,
    ML_TextKeyID    uniqueidentifier NULL,
    ML_LineageJSON  nvarchar(max) NULL,
    ML_RiskControlsJSON nvarchar(max) NULL,
    ML_Notes        nvarchar(1000) NULL,
    ML_IsEnabled    bit NOT NULL CONSTRAINT df_ML_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_ML_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_ML_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_ML_TK FOREIGN KEY (ML_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_ML_CodeVer ON Meta.ModelRegistry(PJ_ID, ML_Code, ML_Version) WHERE _DeleteDate IS NULL;
END
GO


/* =====================================================================
   Identity / Admin / Personalization (Meta OS console)
   ===================================================================== */
IF OBJECT_ID('Meta.UserAccount','U') IS NULL
BEGIN
  CREATE TABLE Meta.UserAccount (
    US_ID           uniqueidentifier NOT NULL CONSTRAINT pk_US PRIMARY KEY,
    US_ExternalID   nvarchar(200) NULL,
    US_Email        nvarchar(256) NULL,
    US_DisplayName  nvarchar(200) NULL,
    US_Status       nvarchar(30) NOT NULL CONSTRAINT df_US_Status DEFAULT ('Active'),
    US_LastLoginUTC datetime2(3) NULL,
    US_ProfileJSON  nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_US_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL
  );
  CREATE UNIQUE INDEX ix_US_External ON Meta.UserAccount(US_ExternalID) WHERE US_ExternalID IS NOT NULL AND _DeleteDate IS NULL;
  CREATE UNIQUE INDEX ix_US_Email ON Meta.UserAccount(US_Email) WHERE US_Email IS NOT NULL AND _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.UserProjectRole','U') IS NULL
BEGIN
  CREATE TABLE Meta.UserProjectRole (
    UPR_ID          uniqueidentifier NOT NULL CONSTRAINT pk_UPR PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    US_ID           uniqueidentifier NOT NULL,
    RO_ID           uniqueidentifier NOT NULL,
    UPR_Notes       nvarchar(1000) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_UPR_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_UPR_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_UPR_US FOREIGN KEY (US_ID) REFERENCES Meta.UserAccount(US_ID),
    CONSTRAINT fk_UPR_RO FOREIGN KEY (RO_ID) REFERENCES Meta.Role(RO_ID)
  );
  CREATE UNIQUE INDEX ix_UPR_Unique ON Meta.UserProjectRole(PJ_ID, US_ID, RO_ID) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.UiTheme','U') IS NULL
BEGIN
  CREATE TABLE Meta.UiTheme (
    UT_ID           uniqueidentifier NOT NULL CONSTRAINT pk_UT PRIMARY KEY,
    PJ_ID           uniqueidentifier NOT NULL,
    UT_Code         nvarchar(120) NOT NULL,
    UT_TokensJSON   nvarchar(max) NOT NULL,
    UT_TextKeyID    uniqueidentifier NULL,
    UT_IsEnabled    bit NOT NULL CONSTRAINT df_UT_IsEnabled DEFAULT (1),
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_UT_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_UT_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_UT_TK FOREIGN KEY (UT_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_UT_Code ON Meta.UiTheme(PJ_ID, UT_Code) WHERE _DeleteDate IS NULL;
END
GO

IF OBJECT_ID('Meta.UserPreference','U') IS NULL
BEGIN
  CREATE TABLE Meta.UserPreference (
    UPRF_ID         uniqueidentifier NOT NULL CONSTRAINT pk_UPRF PRIMARY KEY,
    US_ID           uniqueidentifier NOT NULL,
    PJ_ID           uniqueidentifier NULL,
    UPRF_Key        nvarchar(120) NOT NULL,
    UPRF_ValueJSON  nvarchar(max) NULL,
    _CreateDate     datetime2(3) NOT NULL CONSTRAINT df_UPRF_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy      nvarchar(128) NULL,
    _UpdateDate     datetime2(3) NULL,
    _UpdatedBy      nvarchar(128) NULL,
    _DeleteDate     datetime2(3) NULL,
    _DeletedBy      nvarchar(128) NULL,
    CONSTRAINT fk_UPRF_US FOREIGN KEY (US_ID) REFERENCES Meta.UserAccount(US_ID),
    CONSTRAINT fk_UPRF_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID)
  );
  CREATE INDEX ix_UPRF_User ON Meta.UserPreference(US_ID, PJ_ID, UPRF_Key) WHERE _DeleteDate IS NULL;
END
GO


/* =====================================================================
   Constraint Profile (naming + enforcement)
   ===================================================================== */
IF OBJECT_ID('Meta.ConstraintProfile','U') IS NULL
BEGIN
  CREATE TABLE Meta.ConstraintProfile (
    CPFL_ID          uniqueidentifier NOT NULL CONSTRAINT pk_CPFL PRIMARY KEY,
    PJ_ID            uniqueidentifier NOT NULL,
    CPFL_Code        nvarchar(120) NOT NULL,
    CPFL_ProfileJSON nvarchar(max) NOT NULL,
    CPFL_TextKeyID   uniqueidentifier NULL,
    CPFL_IsEnabled   bit NOT NULL CONSTRAINT df_CPFL_IsEnabled DEFAULT (1),
    _CreateDate      datetime2(3) NOT NULL CONSTRAINT df_CPFL_CreateDate DEFAULT (sysutcdatetime()),
    _CreatedBy       nvarchar(128) NULL,
    _DeleteDate      datetime2(3) NULL,
    _DeletedBy       nvarchar(128) NULL,
    CONSTRAINT fk_CPFL_PJ FOREIGN KEY (PJ_ID) REFERENCES Meta.Project(PJ_ID),
    CONSTRAINT fk_CPFL_TK FOREIGN KEY (CPFL_TextKeyID) REFERENCES Meta.TextKey(TK_ID)
  );
  CREATE UNIQUE INDEX ix_CPFL_Code ON Meta.ConstraintProfile(PJ_ID, CPFL_Code) WHERE _DeleteDate IS NULL;
END
GO
