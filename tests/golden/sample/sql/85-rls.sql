/* Generated RLS/FLS Scaffolding (SQL Server) */
/* Uses SESSION_CONTEXT('TenantID') and optional policy DSL */
CREATE SCHEMA sec;
GO

IF OBJECT_ID('sec.fn_rls_tenant','IF') IS NULL
BEGIN
  EXEC('CREATE FUNCTION sec.fn_rls_tenant(@TenantID uniqueidentifier) RETURNS TABLE WITH SCHEMABINDING AS RETURN SELECT 1 AS fn_result WHERE @TenantID = CAST(SESSION_CONTEXT(N''TenantID'') as uniqueidentifier);');
END
GO

IF OBJECT_ID('dp.Transaction','U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.security_policies WHERE name = 'rls_dp_Transaction')
BEGIN
  CREATE SECURITY POLICY [rls_dp_Transaction] ADD FILTER PREDICATE sec.fn_rls_tenant(_TenantID) ON [dp].[Transaction] WITH (STATE = ON);
END
GO
