/*
  OZMetaDB Bootstrap Seed Data

  Steps:
    1.1 Insert Platforms (Fabric, Synapse, Databricks, SQLServer)
    1.2 Insert Environments (Dev, Test, ProdA, ProdB)
    2.1 Insert sample Client (SFO)
    2.2 Insert sample Project (CaseMgmt)
    3.1 Insert Languages
    3.2 Insert Table Codes (2-letter prefixes)
*/

SET NOCOUNT ON;
GO

-- ============================================
-- 1.1 Platforms
-- ============================================
PRINT '1.1 Inserting Platforms...';

IF NOT EXISTS (SELECT 1 FROM Meta.Platform WHERE PF_Code = 'Fabric')
  INSERT INTO Meta.Platform (PF_ID, PF_Code, PF_Name, PF_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'Fabric', 'Microsoft Fabric', 'Unified analytics platform', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.Platform WHERE PF_Code = 'Synapse')
  INSERT INTO Meta.Platform (PF_ID, PF_Code, PF_Name, PF_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'Synapse', 'Azure Synapse', 'Synapse Analytics', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.Platform WHERE PF_Code = 'Databricks')
  INSERT INTO Meta.Platform (PF_ID, PF_Code, PF_Name, PF_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'Databricks', 'Azure Databricks', 'Databricks on Azure', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.Platform WHERE PF_Code = 'SQLServer')
  INSERT INTO Meta.Platform (PF_ID, PF_Code, PF_Name, PF_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'SQLServer', 'SQL Server', 'Azure SQL or SQL Server', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.Platform WHERE PF_Code = 'LocalDB')
  INSERT INTO Meta.Platform (PF_ID, PF_Code, PF_Name, PF_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'LocalDB', 'SQL Server LocalDB', 'Local development database', SYSUTCDATETIME(), 'seed');
GO

-- ============================================
-- 1.2 Environments
-- ============================================
PRINT '1.2 Inserting Environments...';

IF NOT EXISTS (SELECT 1 FROM Meta.Environment WHERE EN_Code = 'Dev')
  INSERT INTO Meta.Environment (EN_ID, EN_Code, EN_Name, EN_SortOrder, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'Dev', 'Development', 10, SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.Environment WHERE EN_Code = 'Test')
  INSERT INTO Meta.Environment (EN_ID, EN_Code, EN_Name, EN_SortOrder, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'Test', 'Test/QA', 20, SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.Environment WHERE EN_Code = 'ProdA')
  INSERT INTO Meta.Environment (EN_ID, EN_Code, EN_Name, EN_SortOrder, EN_IsProduction, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'ProdA', 'Production Slot A', 30, 1, SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.Environment WHERE EN_Code = 'ProdB')
  INSERT INTO Meta.Environment (EN_ID, EN_Code, EN_Name, EN_SortOrder, EN_IsProduction, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'ProdB', 'Production Slot B', 31, 1, SYSUTCDATETIME(), 'seed');
GO

-- ============================================
-- 2.1 Sample Client
-- ============================================
PRINT '2.1 Inserting sample Client (SFO)...';

DECLARE @CL_ID uniqueidentifier;
IF NOT EXISTS (SELECT 1 FROM Meta.Client WHERE CL_Code = 'SFO')
BEGIN
  SET @CL_ID = NEWID();
  INSERT INTO Meta.Client (CL_ID, CL_Code, CL_Name, CL_Description, _CreateDate, _CreatedBy)
  VALUES (@CL_ID, 'SFO', 'Sample Organization', 'Sample client for development', SYSUTCDATETIME(), 'seed');
END
ELSE
  SELECT @CL_ID = CL_ID FROM Meta.Client WHERE CL_Code = 'SFO';

-- ============================================
-- 2.2 Sample Project
-- ============================================
PRINT '2.2 Inserting sample Project (CaseMgmt)...';

IF NOT EXISTS (SELECT 1 FROM Meta.Project WHERE PJ_Code = 'CaseMgmt' AND CL_ID = @CL_ID)
  INSERT INTO Meta.Project (PJ_ID, CL_ID, PJ_Code, PJ_Name, PJ_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), @CL_ID, 'CaseMgmt', 'Case Management', 'Sample case management project', SYSUTCDATETIME(), 'seed');
GO

-- ============================================
-- 3.1 Languages
-- ============================================
PRINT '3.1 Inserting Languages...';

IF NOT EXISTS (SELECT 1 FROM Meta.Language WHERE LG_Code = 'en-US')
  INSERT INTO Meta.Language (LG_ID, LG_Code, LG_Name, LG_SortOrder, LG_IsDefault, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'en-US', 'English (US)', 10, 1, SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.Language WHERE LG_Code = 'es-MX')
  INSERT INTO Meta.Language (LG_ID, LG_Code, LG_Name, LG_SortOrder, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'es-MX', 'Spanish (Mexico)', 20, SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.Language WHERE LG_Code = 'fr-CA')
  INSERT INTO Meta.Language (LG_ID, LG_Code, LG_Name, LG_SortOrder, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'fr-CA', 'French (Canada)', 30, SYSUTCDATETIME(), 'seed');
GO

-- ============================================
-- 3.2 Common Table Codes (2-letter prefixes)
-- ============================================
PRINT '3.2 Inserting Table Codes...';

-- These are the standard 2-letter prefixes for table naming
IF NOT EXISTS (SELECT 1 FROM Meta.TableCode WHERE CD_Code = 'CL')
  INSERT INTO Meta.TableCode (CD_ID, CD_Code, CD_Name, CD_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'CL', 'Client', 'Client/Tenant entity', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.TableCode WHERE CD_Code = 'PJ')
  INSERT INTO Meta.TableCode (CD_ID, CD_Code, CD_Name, CD_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'PJ', 'Project', 'Project entity', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.TableCode WHERE CD_Code = 'TB')
  INSERT INTO Meta.TableCode (CD_ID, CD_Code, CD_Name, CD_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'TB', 'Table', 'Table metadata', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.TableCode WHERE CD_Code = 'FD')
  INSERT INTO Meta.TableCode (CD_ID, CD_Code, CD_Name, CD_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'FD', 'Field', 'Field/Column metadata', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.TableCode WHERE CD_Code = 'WF')
  INSERT INTO Meta.TableCode (CD_ID, CD_Code, CD_Name, CD_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'WF', 'Workflow', 'Workflow definition', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.TableCode WHERE CD_Code = 'ST')
  INSERT INTO Meta.TableCode (CD_ID, CD_Code, CD_Name, CD_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'ST', 'State', 'Workflow state', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.TableCode WHERE CD_Code = 'TR')
  INSERT INTO Meta.TableCode (CD_ID, CD_Code, CD_Name, CD_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'TR', 'Transition', 'Workflow transition', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.TableCode WHERE CD_Code = 'CS')
  INSERT INTO Meta.TableCode (CD_ID, CD_Code, CD_Name, CD_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'CS', 'Case', 'Case entity (domain)', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.TableCode WHERE CD_Code = 'EV')
  INSERT INTO Meta.TableCode (CD_ID, CD_Code, CD_Name, CD_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'EV', 'Evidence', 'Evidence/Document entity', SYSUTCDATETIME(), 'seed');

IF NOT EXISTS (SELECT 1 FROM Meta.TableCode WHERE CD_Code = 'AU')
  INSERT INTO Meta.TableCode (CD_ID, CD_Code, CD_Name, CD_Description, _CreateDate, _CreatedBy)
  VALUES (NEWID(), 'AU', 'Audit', 'Audit log entity', SYSUTCDATETIME(), 'seed');
GO

PRINT 'Bootstrap seed complete.';
GO
