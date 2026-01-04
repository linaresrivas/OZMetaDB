/**
 * OZMetaDB Meta-Schema
 *
 * This defines the core metadata structure for OZMetaDB itself.
 * OZMetaDB is self-referential - it uses these tables to define
 * all other tables in user projects.
 *
 * NAMING CONVENTION:
 * - PK: {XX}_ID where XX is 2-char table prefix
 * - FK: {XXYY}_ID where XX is source table, YY is target table
 * - Columns: {XX}_{ColumnName}
 *
 * TABLE PREFIXES:
 * - PJ = Project
 * - TB = Table
 * - CL = Column
 * - CU = Customer
 * - CO = Contact
 * - AD = Address
 * - OR = Organization
 */

// ============================================================================
// PROJECT TABLE (PJ)
// The root entity - each project contains tables
// ============================================================================
export interface Project {
  PJ_ID: string;                    // Primary Key
  PJ_Code: string;                  // Short unique code (e.g., "OZMETADB", "MYPROJ")
  PJ_Name: string;                  // Display name
  PJ_Description?: string;
  PJ_Status: ProjectStatus;
  PJ_IsSystem: boolean;             // true = OZMetaDB default, cannot delete

  // Ownership
  PJCU_ID?: string;                 // FK: Project → Customer (owner)
  PJCO_ID?: string;                 // FK: Project → Contact (primary contact)

  // Settings
  PJ_DefaultCurrency?: string;      // ISO 4217
  PJ_DefaultLanguage?: string;      // ISO 639-1
  PJ_DefaultTimezone?: string;      // IANA
  PJ_DefaultCountry?: string;       // ISO 3166-1 alpha-2

  // Metadata
  PJ_Version?: string;
  PJ_Tags?: string[];

  // Timestamps
  PJ_CreatedAt: string;
  PJ_UpdatedAt: string;
  PJ_CreatedBy?: string;
}

export type ProjectStatus = "active" | "archived" | "draft" | "locked";

// ============================================================================
// TABLE DEFINITION (TB)
// Defines tables within a project
// ============================================================================
export interface TableDef {
  TB_ID: string;                    // Primary Key
  TBPJ_ID: string;                  // FK: Table → Project

  TB_Code: string;                  // 2-char prefix (e.g., "CU", "CO", "AD")
  TB_Name: string;                  // Display name (e.g., "Customer", "Contact")
  TB_PluralName?: string;           // Plural form (e.g., "Customers", "Contacts")
  TB_Description?: string;

  TB_IsSystem: boolean;             // true = core OZMetaDB table, cannot delete
  TB_IsActive: boolean;
  TB_SortOrder: number;             // Display order in UI

  // UI Settings
  TB_Icon?: string;                 // Lucide icon name
  TB_Color?: string;                // Theme color
  TB_HasWizard: boolean;            // Show in AI assistant
  TB_HasGrid: boolean;              // Show data grid
  TB_HasForm: boolean;              // Show edit form

  // Timestamps
  TB_CreatedAt: string;
  TB_UpdatedAt: string;
}

// ============================================================================
// COLUMN DEFINITION (CL)
// Defines columns within a table
// ============================================================================
export interface ColumnDef {
  CL_ID: string;                    // Primary Key
  CLTB_ID: string;                  // FK: Column → Table

  CL_Code: string;                  // Column name (e.g., "DisplayName", "Email")
  CL_FullCode: string;              // Full TREM format (e.g., "CU_DisplayName")
  CL_Label: string;                 // Display label
  CL_Description?: string;

  CL_DataType: ColumnDataType;
  CL_IsRequired: boolean;
  CL_IsUnique: boolean;
  CL_IsPrimaryKey: boolean;
  CL_IsForeignKey: boolean;

  // FK Reference (if IsForeignKey)
  CLTB_RefID?: string;              // FK: Column → Referenced Table
  CL_FKCode?: string;               // FK column name (e.g., "CUOR_ID")

  // Validation
  CL_MinLength?: number;
  CL_MaxLength?: number;
  CL_MinValue?: number;
  CL_MaxValue?: number;
  CL_Pattern?: string;              // Regex pattern
  CL_DefaultValue?: string;

  // Picker/Standard
  CL_PickerType?: PickerType;       // For ISO standard pickers
  CL_Options?: ColumnOption[];      // For enum/select types

  // UI
  CL_Group?: string;                // Field group in forms
  CL_SortOrder: number;
  CL_IsVisible: boolean;
  CL_IsEditable: boolean;
  CL_HelpText?: string;
  CL_Placeholder?: string;

  // Grid settings
  CL_GridWidth?: number;
  CL_GridVisible: boolean;
  CL_GridSortable: boolean;
  CL_GridFilterable: boolean;

  // Timestamps
  CL_CreatedAt: string;
  CL_UpdatedAt: string;
}

export type ColumnDataType =
  | "string"
  | "text"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "time"
  | "email"
  | "url"
  | "phone"
  | "currency"
  | "uuid"
  | "json"
  | "enum";

export type PickerType =
  | "country"
  | "currency"
  | "timezone"
  | "language"
  | "phone";

export interface ColumnOption {
  value: string;
  label: string;
  description?: string;
  color?: string;
}

// ============================================================================
// CUSTOMER TABLE (CU)
// ============================================================================
export interface Customer {
  CU_ID: string;                    // PK
  CU_Type: CustomerType;
  CU_Status: CustomerStatus;
  CU_Code?: string;
  CU_DisplayName: string;
  CU_LegalName?: string;
  CU_Email?: string;
  CU_Phone?: string;
  CU_Website?: string;
  CU_Currency?: string;             // ISO 4217
  CU_Language?: string;             // ISO 639-1
  CU_Timezone?: string;             // IANA
  CU_Country?: string;              // ISO 3166-1
  CUCU_ID?: string;                 // FK: Customer → Parent Customer
  CU_Tags?: string[];
  CU_CreatedAt: string;
  CU_UpdatedAt: string;
}

export type CustomerType = "individual" | "business" | "government" | "nonprofit";
export type CustomerStatus = "prospect" | "lead" | "active" | "inactive" | "churned";

// ============================================================================
// CONTACT TABLE (CO)
// ============================================================================
export interface Contact {
  CO_ID: string;                    // PK
  CO_Type: ContactType;
  CO_FirstName: string;
  CO_LastName: string;
  CO_Email?: string;
  CO_Phone?: string;
  CO_Mobile?: string;
  CO_JobTitle?: string;
  CO_Department?: string;
  CO_Language?: string;             // ISO 639-1
  CO_Timezone?: string;             // IANA
  CO_IsPrimary: boolean;
  CO_IsActive: boolean;
  COCU_ID?: string;                 // FK: Contact → Customer
  COOR_ID?: string;                 // FK: Contact → Organization
  CO_CreatedAt: string;
  CO_UpdatedAt: string;
}

export type ContactType = "primary" | "billing" | "technical" | "support" | "sales" | "legal";

// ============================================================================
// ADDRESS TABLE (AD)
// ============================================================================
export interface Address {
  AD_ID: string;                    // PK
  AD_Type: AddressType;
  AD_Line1: string;
  AD_Line2?: string;
  AD_City: string;
  AD_State?: string;                // ISO 3166-2
  AD_PostalCode?: string;
  AD_Country: string;               // ISO 3166-1
  AD_Timezone?: string;             // IANA
  AD_IsPrimary: boolean;
  ADCU_ID?: string;                 // FK: Address → Customer
  ADCO_ID?: string;                 // FK: Address → Contact
  ADOR_ID?: string;                 // FK: Address → Organization
  AD_CreatedAt: string;
  AD_UpdatedAt: string;
}

export type AddressType = "billing" | "shipping" | "home" | "work" | "headquarters";

// ============================================================================
// ORGANIZATION TABLE (OR)
// ============================================================================
export interface Organization {
  OR_ID: string;                    // PK
  OR_Type: OrganizationType;
  OR_Status: OrganizationStatus;
  OR_LegalName: string;
  OR_TradingName?: string;
  OR_TaxId?: string;
  OR_Industry?: string;
  OR_Website?: string;
  OR_Email?: string;
  OR_Phone?: string;
  OR_Country?: string;              // ISO 3166-1
  OR_Currency?: string;             // ISO 4217
  OR_Language?: string;             // ISO 639-1
  OROR_ID?: string;                 // FK: Organization → Parent Organization
  OR_CreatedAt: string;
  OR_UpdatedAt: string;
}

export type OrganizationType = "corporation" | "subsidiary" | "branch" | "partnership" | "nonprofit" | "government";
export type OrganizationStatus = "active" | "inactive" | "dissolved" | "merged";

// ============================================================================
// DEFAULT OZMETADB PROJECT SEED DATA
// ============================================================================

export const DEFAULT_PROJECT: Project = {
  PJ_ID: "pj-ozmetadb-001",
  PJ_Code: "OZMETADB",
  PJ_Name: "OZMetaDB System",
  PJ_Description: "Core metadata management system - this project cannot be deleted",
  PJ_Status: "active",
  PJ_IsSystem: true,
  PJ_DefaultCurrency: "USD",
  PJ_DefaultLanguage: "en",
  PJ_DefaultTimezone: "UTC",
  PJ_DefaultCountry: "US",
  PJ_Version: "1.0.0",
  PJ_CreatedAt: new Date().toISOString(),
  PJ_UpdatedAt: new Date().toISOString(),
};

export const SYSTEM_TABLES: TableDef[] = [
  {
    TB_ID: "tb-project-001",
    TBPJ_ID: DEFAULT_PROJECT.PJ_ID,
    TB_Code: "PJ",
    TB_Name: "Project",
    TB_PluralName: "Projects",
    TB_Description: "Project definitions - containers for tables and data",
    TB_IsSystem: true,
    TB_IsActive: true,
    TB_SortOrder: 1,
    TB_Icon: "FolderKanban",
    TB_Color: "blue",
    TB_HasWizard: true,
    TB_HasGrid: true,
    TB_HasForm: true,
    TB_CreatedAt: new Date().toISOString(),
    TB_UpdatedAt: new Date().toISOString(),
  },
  {
    TB_ID: "tb-table-001",
    TBPJ_ID: DEFAULT_PROJECT.PJ_ID,
    TB_Code: "TB",
    TB_Name: "Table",
    TB_PluralName: "Tables",
    TB_Description: "Table definitions within projects",
    TB_IsSystem: true,
    TB_IsActive: true,
    TB_SortOrder: 2,
    TB_Icon: "Table",
    TB_Color: "green",
    TB_HasWizard: true,
    TB_HasGrid: true,
    TB_HasForm: true,
    TB_CreatedAt: new Date().toISOString(),
    TB_UpdatedAt: new Date().toISOString(),
  },
  {
    TB_ID: "tb-column-001",
    TBPJ_ID: DEFAULT_PROJECT.PJ_ID,
    TB_Code: "CL",
    TB_Name: "Column",
    TB_PluralName: "Columns",
    TB_Description: "Column definitions for tables",
    TB_IsSystem: true,
    TB_IsActive: true,
    TB_SortOrder: 3,
    TB_Icon: "Columns",
    TB_Color: "purple",
    TB_HasWizard: true,
    TB_HasGrid: true,
    TB_HasForm: true,
    TB_CreatedAt: new Date().toISOString(),
    TB_UpdatedAt: new Date().toISOString(),
  },
  {
    TB_ID: "tb-customer-001",
    TBPJ_ID: DEFAULT_PROJECT.PJ_ID,
    TB_Code: "CU",
    TB_Name: "Customer",
    TB_PluralName: "Customers",
    TB_Description: "Customer records - individuals or organizations",
    TB_IsSystem: true,
    TB_IsActive: true,
    TB_SortOrder: 10,
    TB_Icon: "Users",
    TB_Color: "orange",
    TB_HasWizard: true,
    TB_HasGrid: true,
    TB_HasForm: true,
    TB_CreatedAt: new Date().toISOString(),
    TB_UpdatedAt: new Date().toISOString(),
  },
  {
    TB_ID: "tb-contact-001",
    TBPJ_ID: DEFAULT_PROJECT.PJ_ID,
    TB_Code: "CO",
    TB_Name: "Contact",
    TB_PluralName: "Contacts",
    TB_Description: "Contact persons linked to customers or organizations",
    TB_IsSystem: true,
    TB_IsActive: true,
    TB_SortOrder: 11,
    TB_Icon: "UserCircle",
    TB_Color: "cyan",
    TB_HasWizard: true,
    TB_HasGrid: true,
    TB_HasForm: true,
    TB_CreatedAt: new Date().toISOString(),
    TB_UpdatedAt: new Date().toISOString(),
  },
  {
    TB_ID: "tb-address-001",
    TBPJ_ID: DEFAULT_PROJECT.PJ_ID,
    TB_Code: "AD",
    TB_Name: "Address",
    TB_PluralName: "Addresses",
    TB_Description: "Physical addresses (ISO 3166 compliant)",
    TB_IsSystem: true,
    TB_IsActive: true,
    TB_SortOrder: 12,
    TB_Icon: "MapPin",
    TB_Color: "red",
    TB_HasWizard: true,
    TB_HasGrid: true,
    TB_HasForm: true,
    TB_CreatedAt: new Date().toISOString(),
    TB_UpdatedAt: new Date().toISOString(),
  },
  {
    TB_ID: "tb-organization-001",
    TBPJ_ID: DEFAULT_PROJECT.PJ_ID,
    TB_Code: "OR",
    TB_Name: "Organization",
    TB_PluralName: "Organizations",
    TB_Description: "Business entities and legal organizations",
    TB_IsSystem: true,
    TB_IsActive: true,
    TB_SortOrder: 13,
    TB_Icon: "Building2",
    TB_Color: "slate",
    TB_HasWizard: true,
    TB_HasGrid: true,
    TB_HasForm: true,
    TB_CreatedAt: new Date().toISOString(),
    TB_UpdatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// COLUMN DEFINITIONS FOR CUSTOMER TABLE
// ============================================================================
export const CUSTOMER_COLUMNS: ColumnDef[] = [
  {
    CL_ID: "cl-cu-id",
    CLTB_ID: "tb-customer-001",
    CL_Code: "ID",
    CL_FullCode: "CU_ID",
    CL_Label: "Customer ID",
    CL_DataType: "uuid",
    CL_IsRequired: true,
    CL_IsUnique: true,
    CL_IsPrimaryKey: true,
    CL_IsForeignKey: false,
    CL_SortOrder: 1,
    CL_IsVisible: true,
    CL_IsEditable: false,
    CL_GridVisible: true,
    CL_GridSortable: true,
    CL_GridFilterable: true,
    CL_GridWidth: 100,
    CL_CreatedAt: new Date().toISOString(),
    CL_UpdatedAt: new Date().toISOString(),
  },
  {
    CL_ID: "cl-cu-type",
    CLTB_ID: "tb-customer-001",
    CL_Code: "Type",
    CL_FullCode: "CU_Type",
    CL_Label: "Customer Type",
    CL_DataType: "enum",
    CL_IsRequired: true,
    CL_IsUnique: false,
    CL_IsPrimaryKey: false,
    CL_IsForeignKey: false,
    CL_DefaultValue: "business",
    CL_Options: [
      { value: "individual", label: "Individual" },
      { value: "business", label: "Business" },
      { value: "government", label: "Government" },
      { value: "nonprofit", label: "Non-Profit" },
    ],
    CL_Group: "Classification",
    CL_SortOrder: 2,
    CL_IsVisible: true,
    CL_IsEditable: true,
    CL_GridVisible: true,
    CL_GridSortable: true,
    CL_GridFilterable: true,
    CL_GridWidth: 120,
    CL_CreatedAt: new Date().toISOString(),
    CL_UpdatedAt: new Date().toISOString(),
  },
  {
    CL_ID: "cl-cu-status",
    CLTB_ID: "tb-customer-001",
    CL_Code: "Status",
    CL_FullCode: "CU_Status",
    CL_Label: "Status",
    CL_DataType: "enum",
    CL_IsRequired: true,
    CL_IsUnique: false,
    CL_IsPrimaryKey: false,
    CL_IsForeignKey: false,
    CL_DefaultValue: "prospect",
    CL_Options: [
      { value: "prospect", label: "Prospect" },
      { value: "lead", label: "Lead" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "churned", label: "Churned" },
    ],
    CL_Group: "Classification",
    CL_SortOrder: 3,
    CL_IsVisible: true,
    CL_IsEditable: true,
    CL_GridVisible: true,
    CL_GridSortable: true,
    CL_GridFilterable: true,
    CL_GridWidth: 100,
    CL_CreatedAt: new Date().toISOString(),
    CL_UpdatedAt: new Date().toISOString(),
  },
  {
    CL_ID: "cl-cu-displayname",
    CLTB_ID: "tb-customer-001",
    CL_Code: "DisplayName",
    CL_FullCode: "CU_DisplayName",
    CL_Label: "Display Name",
    CL_DataType: "string",
    CL_IsRequired: true,
    CL_IsUnique: false,
    CL_IsPrimaryKey: false,
    CL_IsForeignKey: false,
    CL_MinLength: 1,
    CL_MaxLength: 200,
    CL_Group: "Identity",
    CL_SortOrder: 4,
    CL_IsVisible: true,
    CL_IsEditable: true,
    CL_Placeholder: "Customer name",
    CL_GridVisible: true,
    CL_GridSortable: true,
    CL_GridFilterable: true,
    CL_CreatedAt: new Date().toISOString(),
    CL_UpdatedAt: new Date().toISOString(),
  },
  {
    CL_ID: "cl-cu-email",
    CLTB_ID: "tb-customer-001",
    CL_Code: "Email",
    CL_FullCode: "CU_Email",
    CL_Label: "Email",
    CL_DataType: "email",
    CL_IsRequired: false,
    CL_IsUnique: false,
    CL_IsPrimaryKey: false,
    CL_IsForeignKey: false,
    CL_Group: "Contact",
    CL_SortOrder: 5,
    CL_IsVisible: true,
    CL_IsEditable: true,
    CL_Placeholder: "email@example.com",
    CL_GridVisible: true,
    CL_GridSortable: true,
    CL_GridFilterable: true,
    CL_CreatedAt: new Date().toISOString(),
    CL_UpdatedAt: new Date().toISOString(),
  },
  {
    CL_ID: "cl-cu-phone",
    CLTB_ID: "tb-customer-001",
    CL_Code: "Phone",
    CL_FullCode: "CU_Phone",
    CL_Label: "Phone",
    CL_DataType: "phone",
    CL_IsRequired: false,
    CL_IsUnique: false,
    CL_IsPrimaryKey: false,
    CL_IsForeignKey: false,
    CL_PickerType: "phone",
    CL_Group: "Contact",
    CL_SortOrder: 6,
    CL_IsVisible: true,
    CL_IsEditable: true,
    CL_HelpText: "E.164 format",
    CL_GridVisible: false,
    CL_GridSortable: false,
    CL_GridFilterable: false,
    CL_CreatedAt: new Date().toISOString(),
    CL_UpdatedAt: new Date().toISOString(),
  },
  {
    CL_ID: "cl-cu-country",
    CLTB_ID: "tb-customer-001",
    CL_Code: "Country",
    CL_FullCode: "CU_Country",
    CL_Label: "Country",
    CL_DataType: "string",
    CL_IsRequired: false,
    CL_IsUnique: false,
    CL_IsPrimaryKey: false,
    CL_IsForeignKey: false,
    CL_PickerType: "country",
    CL_Group: "Locale",
    CL_SortOrder: 7,
    CL_IsVisible: true,
    CL_IsEditable: true,
    CL_HelpText: "ISO 3166-1 alpha-2",
    CL_GridVisible: true,
    CL_GridSortable: true,
    CL_GridFilterable: true,
    CL_GridWidth: 80,
    CL_CreatedAt: new Date().toISOString(),
    CL_UpdatedAt: new Date().toISOString(),
  },
  {
    CL_ID: "cl-cu-currency",
    CLTB_ID: "tb-customer-001",
    CL_Code: "Currency",
    CL_FullCode: "CU_Currency",
    CL_Label: "Currency",
    CL_DataType: "string",
    CL_IsRequired: false,
    CL_IsUnique: false,
    CL_IsPrimaryKey: false,
    CL_IsForeignKey: false,
    CL_PickerType: "currency",
    CL_Group: "Locale",
    CL_SortOrder: 8,
    CL_IsVisible: true,
    CL_IsEditable: true,
    CL_HelpText: "ISO 4217",
    CL_GridVisible: false,
    CL_GridSortable: false,
    CL_GridFilterable: true,
    CL_GridWidth: 80,
    CL_CreatedAt: new Date().toISOString(),
    CL_UpdatedAt: new Date().toISOString(),
  },
  {
    CL_ID: "cl-cu-language",
    CLTB_ID: "tb-customer-001",
    CL_Code: "Language",
    CL_FullCode: "CU_Language",
    CL_Label: "Language",
    CL_DataType: "string",
    CL_IsRequired: false,
    CL_IsUnique: false,
    CL_IsPrimaryKey: false,
    CL_IsForeignKey: false,
    CL_PickerType: "language",
    CL_Group: "Locale",
    CL_SortOrder: 9,
    CL_IsVisible: true,
    CL_IsEditable: true,
    CL_HelpText: "ISO 639-1",
    CL_GridVisible: false,
    CL_GridSortable: false,
    CL_GridFilterable: true,
    CL_GridWidth: 80,
    CL_CreatedAt: new Date().toISOString(),
    CL_UpdatedAt: new Date().toISOString(),
  },
  {
    CL_ID: "cl-cu-timezone",
    CLTB_ID: "tb-customer-001",
    CL_Code: "Timezone",
    CL_FullCode: "CU_Timezone",
    CL_Label: "Timezone",
    CL_DataType: "string",
    CL_IsRequired: false,
    CL_IsUnique: false,
    CL_IsPrimaryKey: false,
    CL_IsForeignKey: false,
    CL_PickerType: "timezone",
    CL_Group: "Locale",
    CL_SortOrder: 10,
    CL_IsVisible: true,
    CL_IsEditable: true,
    CL_HelpText: "IANA timezone",
    CL_GridVisible: false,
    CL_GridSortable: false,
    CL_GridFilterable: false,
    CL_CreatedAt: new Date().toISOString(),
    CL_UpdatedAt: new Date().toISOString(),
  },
  {
    CL_ID: "cl-cu-parent",
    CLTB_ID: "tb-customer-001",
    CL_Code: "ParentID",
    CL_FullCode: "CUCU_ID",
    CL_Label: "Parent Customer",
    CL_Description: "Parent customer for hierarchical structures",
    CL_DataType: "uuid",
    CL_IsRequired: false,
    CL_IsUnique: false,
    CL_IsPrimaryKey: false,
    CL_IsForeignKey: true,
    CLTB_RefID: "tb-customer-001",
    CL_FKCode: "CUCU_ID",
    CL_Group: "Relationships",
    CL_SortOrder: 20,
    CL_IsVisible: true,
    CL_IsEditable: true,
    CL_GridVisible: false,
    CL_GridSortable: false,
    CL_GridFilterable: false,
    CL_CreatedAt: new Date().toISOString(),
    CL_UpdatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate FK column name from source and target table codes
 * @example getFKName("CU", "OR") => "CUOR_ID"
 */
export function getFKName(sourceCode: string, targetCode: string): string {
  return `${sourceCode}${targetCode}_ID`;
}

/**
 * Generate full column name from table code and column name
 * @example getColumnName("CU", "DisplayName") => "CU_DisplayName"
 */
export function getColumnName(tableCode: string, columnName: string): string {
  return `${tableCode}_${columnName}`;
}

/**
 * Get all columns for a table
 */
export function getTableColumns(tableId: string, allColumns: ColumnDef[]): ColumnDef[] {
  return allColumns
    .filter(col => col.CLTB_ID === tableId)
    .sort((a, b) => a.CL_SortOrder - b.CL_SortOrder);
}

/**
 * Get columns grouped by their CL_Group
 */
export function getColumnsByGroup(columns: ColumnDef[]): Map<string, ColumnDef[]> {
  const groups = new Map<string, ColumnDef[]>();
  for (const col of columns) {
    const group = col.CL_Group || "General";
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(col);
  }
  return groups;
}
