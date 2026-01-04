/**
 * OZMetaDB Dimension Schemas
 * Pre-built business entity definitions with international standards
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
 * - BR = Branding (non-destructive regeneration)
 * - BA = BrandingAsset (generated assets)
 * - BO = BrandingOverride (custom overrides preserved on regeneration)
 */

// ============================================================================
// ADDRESS DIMENSION (AD)
// ============================================================================
export interface Address {
  AD_ID: string;                    // PK
  AD_Type: AddressType;
  AD_Line1: string;
  AD_Line2?: string;
  AD_Line3?: string;
  AD_City: string;
  AD_State?: string;                // ISO 3166-2 subdivision
  AD_PostalCode?: string;
  AD_Country: string;               // ISO 3166-1 alpha-2
  AD_Latitude?: number;             // WGS84
  AD_Longitude?: number;            // WGS84
  AD_Timezone?: string;             // IANA timezone
  AD_IsVerified?: boolean;
  AD_IsPrimary?: boolean;
  AD_ValidFrom?: string;            // ISO 8601
  AD_ValidTo?: string;              // ISO 8601

  // Foreign Keys
  ADCU_ID?: string;                 // FK: Address → Customer
  ADCO_ID?: string;                 // FK: Address → Contact
  ADOR_ID?: string;                 // FK: Address → Organization

  AD_CreatedAt: string;
  AD_UpdatedAt: string;
}

export type AddressType = "billing" | "shipping" | "home" | "work" | "headquarters" | "branch" | "warehouse" | "other";

// ============================================================================
// CONTACT DIMENSION (CO)
// ============================================================================
export interface Contact {
  CO_ID: string;                    // PK
  CO_Type: ContactType;
  CO_Prefix?: string;               // Mr., Ms., Dr., etc.
  CO_FirstName: string;
  CO_MiddleName?: string;
  CO_LastName: string;
  CO_Suffix?: string;               // Jr., Sr., III, PhD, etc.
  CO_Nickname?: string;
  CO_JobTitle?: string;
  CO_Department?: string;
  CO_Email?: string;
  CO_EmailSecondary?: string;
  CO_Phone?: string;                // E.164 format
  CO_PhoneSecondary?: string;
  CO_Mobile?: string;
  CO_Fax?: string;
  CO_Language?: string;             // ISO 639-1
  CO_Timezone?: string;             // IANA timezone
  CO_Birthday?: string;             // ISO 8601 date
  CO_Gender?: Gender;               // ISO 5218
  CO_PhotoUrl?: string;
  CO_LinkedInUrl?: string;
  CO_TwitterHandle?: string;
  CO_Notes?: string;
  CO_IsPrimary?: boolean;
  CO_IsActive: boolean;
  CO_Tags?: string[];
  CO_CustomFields?: Record<string, unknown>;

  // Foreign Keys
  COCU_ID?: string;                 // FK: Contact → Customer
  COOR_ID?: string;                 // FK: Contact → Organization

  CO_CreatedAt: string;
  CO_UpdatedAt: string;
}

export type ContactType = "primary" | "billing" | "technical" | "support" | "sales" | "legal" | "executive" | "other";
export type Gender = "0" | "1" | "2" | "9"; // ISO 5218: 0=unknown, 1=male, 2=female, 9=not applicable

// ============================================================================
// CUSTOMER DIMENSION (CU)
// ============================================================================
export interface Customer {
  CU_ID: string;                    // PK
  CU_Type: CustomerType;
  CU_Status: CustomerStatus;

  // Identification
  CU_Code?: string;                 // Internal customer code
  CU_ExternalId?: string;           // External system ID
  CU_TaxId?: string;                // VAT/Tax ID
  CU_DunsNumber?: string;           // D-U-N-S Number
  CU_LeiCode?: string;              // Legal Entity Identifier (ISO 17442)

  // For individuals
  CU_Prefix?: string;
  CU_FirstName?: string;
  CU_MiddleName?: string;
  CU_LastName?: string;
  CU_Suffix?: string;

  // For organizations
  CU_LegalName?: string;
  CU_TradingName?: string;

  // Common fields
  CU_DisplayName: string;
  CU_Email?: string;
  CU_Website?: string;
  CU_Phone?: string;                // E.164 format

  // Financial
  CU_Currency?: string;             // ISO 4217 - preferred currency
  CU_PaymentTerms?: number;         // Days
  CU_CreditLimit?: number;

  // Classification
  CU_Industry?: string;             // NAICS/ISIC code
  CU_Segment?: string;
  CU_Tier?: string;

  // Locale
  CU_Language?: string;             // ISO 639-1
  CU_Timezone?: string;             // IANA timezone
  CU_Country?: string;              // ISO 3166-1 alpha-2

  // Foreign Keys
  CUCU_ID?: string;                 // FK: Customer → Parent Customer (self-ref)
  CUOR_ID?: string;                 // FK: Customer → Organization

  // Metadata
  CU_Source?: string;
  CU_Tags?: string[];
  CU_CustomFields?: Record<string, unknown>;

  // Timestamps
  CU_FirstContactDate?: string;
  CU_CustomerSince?: string;
  CU_LastActivityDate?: string;
  CU_CreatedAt: string;
  CU_UpdatedAt: string;
}

export type CustomerType = "individual" | "business" | "government" | "nonprofit" | "partner" | "reseller";
export type CustomerStatus = "prospect" | "lead" | "active" | "inactive" | "suspended" | "churned";

// ============================================================================
// ORGANIZATION DIMENSION (OR)
// ============================================================================
export interface Organization {
  OR_ID: string;                    // PK
  OR_Type: OrganizationType;
  OR_Status: OrganizationStatus;

  // Legal identity
  OR_LegalName: string;
  OR_TradingName?: string;
  OR_Abbreviation?: string;

  // Registration
  OR_RegistrationNumber?: string;
  OR_TaxId?: string;
  OR_VatNumber?: string;
  OR_DunsNumber?: string;
  OR_LeiCode?: string;              // Legal Entity Identifier

  // Classification
  OR_LegalForm?: string;            // LLC, Corp, Ltd, GmbH, etc.
  OR_Industry?: string;             // NAICS/ISIC
  OR_SicCode?: string;              // SIC code
  OR_NaicsCode?: string;            // NAICS code

  // Size
  OR_EmployeeCount?: number;
  OR_AnnualRevenue?: number;
  OR_RevenueCurrency?: string;      // ISO 4217

  // Location
  OR_Country?: string;              // ISO 3166-1 alpha-2
  OR_OperatingCountries?: string[]; // ISO 3166-1 alpha-2
  OR_Timezone?: string;             // IANA timezone

  // Contact
  OR_Website?: string;
  OR_Email?: string;
  OR_Phone?: string;                // E.164 format

  // Locale
  OR_Language?: string;             // ISO 639-1
  OR_SupportedLanguages?: string[]; // ISO 639-1

  // Foreign Keys
  OROR_ID?: string;                 // FK: Organization → Parent Organization (self-ref)
  ORCU_ID?: string;                 // FK: Organization → Ultimate Parent Customer

  // Dates
  OR_FoundedDate?: string;          // ISO 8601
  OR_IncorporatedDate?: string;     // ISO 8601
  OR_FiscalYearEnd?: string;        // MM-DD format

  // Metadata
  OR_LogoUrl?: string;
  OR_Description?: string;
  OR_Tags?: string[];
  OR_CustomFields?: Record<string, unknown>;

  OR_CreatedAt: string;
  OR_UpdatedAt: string;
}

export type OrganizationType = "corporation" | "subsidiary" | "branch" | "division" | "department" | "joint_venture" | "partnership" | "nonprofit" | "government" | "other";
export type OrganizationStatus = "active" | "inactive" | "pending" | "dissolved" | "merged" | "acquired";

// ============================================================================
// PROJECT DIMENSION (PJ)
// ============================================================================
export interface Project {
  PJ_ID: string;                    // PK
  PJ_Code: string;                  // Short unique code
  PJ_Name: string;
  PJ_Description?: string;
  PJ_Status: ProjectStatus;
  PJ_Type?: ProjectType;
  PJ_IsSystem: boolean;             // true = OZMetaDB core, cannot delete

  // Foreign Keys
  PJCU_ID?: string;                 // FK: Project → Customer (owner)
  PJCO_ID?: string;                 // FK: Project → Contact (primary contact)
  PJOR_ID?: string;                 // FK: Project → Organization

  // Dates
  PJ_StartDate?: string;            // ISO 8601
  PJ_EndDate?: string;              // ISO 8601
  PJ_DueDate?: string;              // ISO 8601

  // Financial
  PJ_Budget?: number;
  PJ_BudgetCurrency?: string;       // ISO 4217
  PJ_ActualCost?: number;

  // Classification
  PJ_Priority?: "low" | "medium" | "high" | "critical";
  PJ_Category?: string;
  PJ_Tags?: string[];

  // Settings
  PJ_Timezone?: string;             // IANA timezone
  PJ_Language?: string;             // ISO 639-1
  PJ_Country?: string;              // ISO 3166-1 alpha-2
  PJ_Currency?: string;             // ISO 4217 default

  // Metadata
  PJ_CustomFields?: Record<string, unknown>;
  PJ_Notes?: string;
  PJ_Version?: string;

  // Timestamps
  PJ_CreatedAt: string;
  PJ_UpdatedAt: string;
  PJ_CreatedBy?: string;
}

export type ProjectStatus = "draft" | "planning" | "active" | "on_hold" | "completed" | "cancelled" | "archived";
export type ProjectType = "internal" | "client" | "consulting" | "development" | "research" | "maintenance" | "other";

// ============================================================================
// ENTITY RELATIONSHIP (RL)
// Generic relationship table for many-to-many
// ============================================================================
export interface EntityRelationship {
  RL_ID: string;                    // PK
  RL_SourceType: EntityType;
  RL_SourceId: string;
  RL_TargetType: EntityType;
  RL_TargetId: string;
  RL_RelationshipType: string;      // e.g., "works_at", "reports_to", "manages", "located_at"
  RL_IsPrimary?: boolean;
  RL_ValidFrom?: string;
  RL_ValidTo?: string;
  RL_CreatedAt: string;
  RL_UpdatedAt: string;
}

export type EntityType = "customer" | "contact" | "organization" | "address" | "project";

// ============================================================================
// FIELD DEFINITIONS FOR FORM GENERATION
// ============================================================================

export interface FieldDefinition {
  name: string;                     // Full column name (e.g., "CU_DisplayName")
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  pickerType?: "country" | "currency" | "timezone" | "language" | "phone";
  helpText?: string;
  group?: string;
  isForeignKey?: boolean;
  fkTable?: string;                 // Target table code for FK
}

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "url"
  | "number"
  | "currency"
  | "date"
  | "datetime"
  | "select"
  | "multiselect"
  | "checkbox"
  | "textarea"
  | "picker"
  | "fk";

// ============================================================================
// FIELD DEFINITIONS (using correct naming)
// ============================================================================

export const addressFields: FieldDefinition[] = [
  { name: "AD_Type", label: "Address Type", type: "select", required: true, options: [
    { value: "billing", label: "Billing" },
    { value: "shipping", label: "Shipping" },
    { value: "home", label: "Home" },
    { value: "work", label: "Work" },
    { value: "headquarters", label: "Headquarters" },
    { value: "branch", label: "Branch" },
    { value: "warehouse", label: "Warehouse" },
    { value: "other", label: "Other" },
  ]},
  { name: "AD_Line1", label: "Address Line 1", type: "text", required: true, placeholder: "Street address" },
  { name: "AD_Line2", label: "Address Line 2", type: "text", placeholder: "Apartment, suite, etc." },
  { name: "AD_City", label: "City", type: "text", required: true },
  { name: "AD_State", label: "State/Province", type: "text", helpText: "ISO 3166-2" },
  { name: "AD_PostalCode", label: "Postal Code", type: "text" },
  { name: "AD_Country", label: "Country", type: "picker", required: true, pickerType: "country", helpText: "ISO 3166-1" },
  { name: "AD_Timezone", label: "Timezone", type: "picker", pickerType: "timezone", helpText: "IANA" },
  { name: "AD_IsPrimary", label: "Primary Address", type: "checkbox" },
  { name: "ADCU_ID", label: "Customer", type: "fk", isForeignKey: true, fkTable: "CU", group: "Relationships" },
  { name: "ADCO_ID", label: "Contact", type: "fk", isForeignKey: true, fkTable: "CO", group: "Relationships" },
  { name: "ADOR_ID", label: "Organization", type: "fk", isForeignKey: true, fkTable: "OR", group: "Relationships" },
];

export const contactFields: FieldDefinition[] = [
  { name: "CO_Type", label: "Contact Type", type: "select", required: true, options: [
    { value: "primary", label: "Primary" },
    { value: "billing", label: "Billing" },
    { value: "technical", label: "Technical" },
    { value: "support", label: "Support" },
    { value: "sales", label: "Sales" },
    { value: "legal", label: "Legal" },
    { value: "executive", label: "Executive" },
    { value: "other", label: "Other" },
  ], group: "Basic" },
  { name: "CO_Prefix", label: "Prefix", type: "select", options: [
    { value: "Mr.", label: "Mr." },
    { value: "Ms.", label: "Ms." },
    { value: "Mrs.", label: "Mrs." },
    { value: "Dr.", label: "Dr." },
    { value: "Prof.", label: "Prof." },
  ], group: "Basic" },
  { name: "CO_FirstName", label: "First Name", type: "text", required: true, group: "Basic" },
  { name: "CO_MiddleName", label: "Middle Name", type: "text", group: "Basic" },
  { name: "CO_LastName", label: "Last Name", type: "text", required: true, group: "Basic" },
  { name: "CO_Suffix", label: "Suffix", type: "text", placeholder: "Jr., Sr., III, PhD", group: "Basic" },
  { name: "CO_JobTitle", label: "Job Title", type: "text", group: "Work" },
  { name: "CO_Department", label: "Department", type: "text", group: "Work" },
  { name: "CO_Email", label: "Email", type: "email", group: "Contact" },
  { name: "CO_Phone", label: "Phone", type: "picker", pickerType: "phone", group: "Contact", helpText: "E.164" },
  { name: "CO_Mobile", label: "Mobile", type: "picker", pickerType: "phone", group: "Contact" },
  { name: "CO_Language", label: "Language", type: "picker", pickerType: "language", group: "Locale", helpText: "ISO 639-1" },
  { name: "CO_Timezone", label: "Timezone", type: "picker", pickerType: "timezone", group: "Locale", helpText: "IANA" },
  { name: "CO_IsPrimary", label: "Primary Contact", type: "checkbox", group: "Status" },
  { name: "CO_IsActive", label: "Active", type: "checkbox", group: "Status", defaultValue: true },
  { name: "COCU_ID", label: "Customer", type: "fk", isForeignKey: true, fkTable: "CU", group: "Relationships" },
  { name: "COOR_ID", label: "Organization", type: "fk", isForeignKey: true, fkTable: "OR", group: "Relationships" },
];

export const customerFields: FieldDefinition[] = [
  { name: "CU_Type", label: "Customer Type", type: "select", required: true, options: [
    { value: "individual", label: "Individual" },
    { value: "business", label: "Business" },
    { value: "government", label: "Government" },
    { value: "nonprofit", label: "Non-Profit" },
    { value: "partner", label: "Partner" },
    { value: "reseller", label: "Reseller" },
  ], group: "Classification" },
  { name: "CU_Status", label: "Status", type: "select", required: true, options: [
    { value: "prospect", label: "Prospect" },
    { value: "lead", label: "Lead" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
    { value: "churned", label: "Churned" },
  ], group: "Classification" },
  { name: "CU_DisplayName", label: "Display Name", type: "text", required: true, group: "Identity" },
  { name: "CU_Code", label: "Customer Code", type: "text", group: "Identity" },
  { name: "CU_TaxId", label: "Tax ID / VAT", type: "text", group: "Identity" },
  { name: "CU_Email", label: "Email", type: "email", group: "Contact" },
  { name: "CU_Phone", label: "Phone", type: "picker", pickerType: "phone", group: "Contact", helpText: "E.164" },
  { name: "CU_Website", label: "Website", type: "url", group: "Contact" },
  { name: "CU_Currency", label: "Currency", type: "picker", pickerType: "currency", group: "Locale", helpText: "ISO 4217" },
  { name: "CU_Language", label: "Language", type: "picker", pickerType: "language", group: "Locale", helpText: "ISO 639-1" },
  { name: "CU_Timezone", label: "Timezone", type: "picker", pickerType: "timezone", group: "Locale", helpText: "IANA" },
  { name: "CU_Country", label: "Country", type: "picker", pickerType: "country", group: "Locale", helpText: "ISO 3166-1" },
  { name: "CUCU_ID", label: "Parent Customer", type: "fk", isForeignKey: true, fkTable: "CU", group: "Relationships" },
  { name: "CUOR_ID", label: "Organization", type: "fk", isForeignKey: true, fkTable: "OR", group: "Relationships" },
];

export const organizationFields: FieldDefinition[] = [
  { name: "OR_Type", label: "Organization Type", type: "select", required: true, options: [
    { value: "corporation", label: "Corporation" },
    { value: "subsidiary", label: "Subsidiary" },
    { value: "branch", label: "Branch" },
    { value: "division", label: "Division" },
    { value: "partnership", label: "Partnership" },
    { value: "nonprofit", label: "Non-Profit" },
    { value: "government", label: "Government" },
    { value: "other", label: "Other" },
  ], group: "Classification" },
  { name: "OR_Status", label: "Status", type: "select", required: true, options: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" },
    { value: "dissolved", label: "Dissolved" },
    { value: "merged", label: "Merged" },
    { value: "acquired", label: "Acquired" },
  ], group: "Classification" },
  { name: "OR_LegalName", label: "Legal Name", type: "text", required: true, group: "Identity" },
  { name: "OR_TradingName", label: "Trading Name", type: "text", group: "Identity" },
  { name: "OR_Abbreviation", label: "Abbreviation", type: "text", group: "Identity" },
  { name: "OR_RegistrationNumber", label: "Registration Number", type: "text", group: "Registration" },
  { name: "OR_TaxId", label: "Tax ID", type: "text", group: "Registration" },
  { name: "OR_VatNumber", label: "VAT Number", type: "text", group: "Registration" },
  { name: "OR_DunsNumber", label: "D-U-N-S Number", type: "text", group: "Registration" },
  { name: "OR_LeiCode", label: "LEI Code", type: "text", group: "Registration", helpText: "ISO 17442" },
  { name: "OR_LegalForm", label: "Legal Form", type: "text", placeholder: "LLC, Corp, Ltd, GmbH", group: "Classification" },
  { name: "OR_Industry", label: "Industry (NAICS)", type: "text", group: "Classification" },
  { name: "OR_EmployeeCount", label: "Employee Count", type: "number", group: "Size" },
  { name: "OR_AnnualRevenue", label: "Annual Revenue", type: "currency", group: "Size" },
  { name: "OR_RevenueCurrency", label: "Revenue Currency", type: "picker", pickerType: "currency", group: "Size" },
  { name: "OR_Country", label: "Country", type: "picker", pickerType: "country", group: "Location", helpText: "ISO 3166-1" },
  { name: "OR_Timezone", label: "Timezone", type: "picker", pickerType: "timezone", group: "Location", helpText: "IANA" },
  { name: "OR_Website", label: "Website", type: "url", group: "Contact" },
  { name: "OR_Email", label: "Email", type: "email", group: "Contact" },
  { name: "OR_Phone", label: "Phone", type: "picker", pickerType: "phone", group: "Contact", helpText: "E.164" },
  { name: "OR_Language", label: "Language", type: "picker", pickerType: "language", group: "Locale", helpText: "ISO 639-1" },
  { name: "OR_FoundedDate", label: "Founded Date", type: "date", group: "Dates" },
  { name: "OR_Description", label: "Description", type: "textarea", group: "Details" },
  { name: "OROR_ID", label: "Parent Organization", type: "fk", isForeignKey: true, fkTable: "OR", group: "Relationships" },
];

export const projectFields: FieldDefinition[] = [
  { name: "PJ_Code", label: "Project Code", type: "text", required: true, placeholder: "Short identifier", group: "Basic" },
  { name: "PJ_Name", label: "Project Name", type: "text", required: true, group: "Basic" },
  { name: "PJ_Description", label: "Description", type: "textarea", group: "Basic" },
  { name: "PJ_Status", label: "Status", type: "select", required: true, options: [
    { value: "draft", label: "Draft" },
    { value: "planning", label: "Planning" },
    { value: "active", label: "Active" },
    { value: "on_hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "archived", label: "Archived" },
  ], group: "Basic" },
  { name: "PJ_Type", label: "Project Type", type: "select", options: [
    { value: "internal", label: "Internal" },
    { value: "client", label: "Client" },
    { value: "consulting", label: "Consulting" },
    { value: "development", label: "Development" },
    { value: "research", label: "Research" },
    { value: "maintenance", label: "Maintenance" },
    { value: "other", label: "Other" },
  ], group: "Basic" },
  { name: "PJ_Priority", label: "Priority", type: "select", options: [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ], group: "Basic" },
  { name: "PJ_StartDate", label: "Start Date", type: "date", group: "Dates" },
  { name: "PJ_EndDate", label: "End Date", type: "date", group: "Dates" },
  { name: "PJ_DueDate", label: "Due Date", type: "date", group: "Dates" },
  { name: "PJ_Budget", label: "Budget", type: "currency", group: "Financial" },
  { name: "PJ_BudgetCurrency", label: "Budget Currency", type: "picker", pickerType: "currency", group: "Financial", helpText: "ISO 4217" },
  { name: "PJ_Timezone", label: "Timezone", type: "picker", pickerType: "timezone", group: "Settings", helpText: "IANA" },
  { name: "PJ_Language", label: "Language", type: "picker", pickerType: "language", group: "Settings", helpText: "ISO 639-1" },
  { name: "PJ_Country", label: "Country", type: "picker", pickerType: "country", group: "Settings", helpText: "ISO 3166-1" },
  { name: "PJ_Notes", label: "Notes", type: "textarea", group: "Details" },
  { name: "PJCU_ID", label: "Owner (Customer)", type: "fk", isForeignKey: true, fkTable: "CU", group: "Relationships" },
  { name: "PJCO_ID", label: "Primary Contact", type: "fk", isForeignKey: true, fkTable: "CO", group: "Relationships" },
  { name: "PJOR_ID", label: "Organization", type: "fk", isForeignKey: true, fkTable: "OR", group: "Relationships" },
];

// ============================================================================
// BRANDING DIMENSION (BR)
// Non-destructive branding system for generated applications
// ============================================================================
export interface Branding {
  BR_ID: string;                      // PK
  BR_Name: string;                    // Brand name (e.g., "Acme Corp Brand")
  BR_Status: BrandingStatus;
  BR_Version: number;                 // Increment on each regeneration

  // Core Identity
  BR_LogoUrl?: string;                // Primary logo URL/path
  BR_LogoUrlDark?: string;            // Logo for dark mode
  BR_IconUrl?: string;                // Favicon/app icon
  BR_IconUrlDark?: string;
  BR_LogoWidth?: number;              // Preferred logo width (px)
  BR_LogoHeight?: number;             // Preferred logo height (px)

  // Colors
  BR_PrimaryColor: string;            // Hex color (e.g., "#4A154B")
  BR_SecondaryColor?: string;
  BR_AccentColor?: string;
  BR_SuccessColor?: string;
  BR_WarningColor?: string;
  BR_ErrorColor?: string;
  BR_BackgroundColor?: string;
  BR_BackgroundColorDark?: string;
  BR_TextColor?: string;
  BR_TextColorDark?: string;

  // Typography
  BR_FontFamily?: string;             // Primary font family
  BR_FontFamilyHeading?: string;      // Heading font family
  BR_FontFamilyMono?: string;         // Monospace font family
  BR_FontSizeBase?: string;           // Base font size (e.g., "16px")

  // Layout
  BR_BorderRadius?: string;           // Default border radius
  BR_Spacing?: string;                // Base spacing unit

  // Application
  BR_AppName: string;                 // Application display name
  BR_AppTagline?: string;             // Short tagline
  BR_AppDescription?: string;         // Longer description
  BR_CopyrightText?: string;          // Footer copyright
  BR_SupportEmail?: string;
  BR_SupportUrl?: string;

  // Social/Links
  BR_WebsiteUrl?: string;
  BR_PrivacyUrl?: string;
  BR_TermsUrl?: string;
  BR_LinkedInUrl?: string;
  BR_TwitterUrl?: string;
  BR_GitHubUrl?: string;

  // Foreign Keys
  BRPJ_ID: string;                    // FK: Branding → Project (required)
  BROR_ID?: string;                   // FK: Branding → Organization

  // Metadata
  BR_GeneratedAt?: string;            // Last regeneration timestamp
  BR_GeneratedBy?: string;            // Who triggered regeneration
  BR_CustomFields?: Record<string, unknown>;

  BR_CreatedAt: string;
  BR_UpdatedAt: string;
}

export type BrandingStatus = "draft" | "active" | "archived";

// ============================================================================
// BRANDING ASSET (BA)
// Generated assets - can be regenerated without losing overrides
// ============================================================================
export interface BrandingAsset {
  BA_ID: string;                      // PK
  BA_Type: BrandingAssetType;
  BA_Key: string;                     // Unique key (e.g., "logo-header", "css-variables")
  BA_Name: string;                    // Display name
  BA_Category: BrandingAssetCategory;

  // Content
  BA_Content?: string;                // For text-based assets (CSS, JSON)
  BA_ContentType?: string;            // MIME type
  BA_Url?: string;                    // For file-based assets
  BA_FilePath?: string;               // Local file path
  BA_FileSize?: number;               // Bytes

  // Generation
  BA_IsGenerated: boolean;            // true = auto-generated, false = uploaded
  BA_GeneratedFrom?: string;          // Source template/config
  BA_GenerationVersion: number;       // Matches BR_Version when generated

  // Foreign Keys
  BABR_ID: string;                    // FK: BrandingAsset → Branding (required)

  BA_CreatedAt: string;
  BA_UpdatedAt: string;
}

export type BrandingAssetType =
  | "logo"
  | "icon"
  | "favicon"
  | "css"
  | "css_variables"
  | "theme_config"
  | "font"
  | "image"
  | "manifest"
  | "meta_tags"
  | "email_template"
  | "other";

export type BrandingAssetCategory =
  | "identity"        // Logos, icons
  | "styling"         // CSS, themes
  | "typography"      // Fonts
  | "templates"       // Email, document templates
  | "configuration"   // JSON configs, manifests
  | "media";          // Images, videos

// ============================================================================
// BRANDING OVERRIDE (BO)
// Custom overrides that persist through regeneration
// ============================================================================
export interface BrandingOverride {
  BO_ID: string;                      // PK
  BO_Key: string;                     // What is being overridden (matches BA_Key or property path)
  BO_Type: BrandingOverrideType;
  BO_Name: string;                    // Display name
  BO_Description?: string;            // Why this override exists

  // Override content
  BO_Value?: string;                  // Override value (for simple values)
  BO_Content?: string;                // Override content (for complex/file content)
  BO_Url?: string;                    // Override file URL
  BO_FilePath?: string;               // Override file path

  // Override behavior
  BO_Priority: number;                // Higher priority wins (default 100)
  BO_IsActive: boolean;               // Can temporarily disable
  BO_ApplyCondition?: string;         // Conditional application (e.g., "mode === 'dark'")

  // Foreign Keys
  BOBR_ID: string;                    // FK: BrandingOverride → Branding (required)
  BOBA_ID?: string;                   // FK: BrandingOverride → BrandingAsset (if overriding specific asset)

  // Audit
  BO_Reason?: string;                 // Why this override was created
  BO_CreatedBy?: string;

  BO_CreatedAt: string;
  BO_UpdatedAt: string;
}

export type BrandingOverrideType =
  | "replace"         // Completely replace the generated value
  | "merge"           // Merge with generated value (for objects/CSS)
  | "append"          // Append to generated value
  | "prepend"         // Prepend to generated value
  | "disable";        // Disable the generated asset entirely

// ============================================================================
// BRANDING FIELD DEFINITIONS
// ============================================================================

export const brandingFields: FieldDefinition[] = [
  // Core
  { name: "BR_Name", label: "Brand Name", type: "text", required: true, group: "Core" },
  { name: "BR_Status", label: "Status", type: "select", required: true, options: [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ], group: "Core" },
  { name: "BR_AppName", label: "Application Name", type: "text", required: true, group: "Core" },
  { name: "BR_AppTagline", label: "Tagline", type: "text", placeholder: "Short catchy phrase", group: "Core" },
  { name: "BR_AppDescription", label: "Description", type: "textarea", group: "Core" },

  // Logo & Icons
  { name: "BR_LogoUrl", label: "Logo URL", type: "url", group: "Identity", helpText: "Primary logo for light mode" },
  { name: "BR_LogoUrlDark", label: "Logo URL (Dark)", type: "url", group: "Identity", helpText: "Logo for dark mode" },
  { name: "BR_IconUrl", label: "Icon URL", type: "url", group: "Identity", helpText: "Favicon/app icon" },
  { name: "BR_LogoWidth", label: "Logo Width (px)", type: "number", group: "Identity" },
  { name: "BR_LogoHeight", label: "Logo Height (px)", type: "number", group: "Identity" },

  // Colors
  { name: "BR_PrimaryColor", label: "Primary Color", type: "text", required: true, placeholder: "#4A154B", group: "Colors" },
  { name: "BR_SecondaryColor", label: "Secondary Color", type: "text", placeholder: "#36C5F0", group: "Colors" },
  { name: "BR_AccentColor", label: "Accent Color", type: "text", group: "Colors" },
  { name: "BR_SuccessColor", label: "Success Color", type: "text", placeholder: "#2EB67D", group: "Colors" },
  { name: "BR_WarningColor", label: "Warning Color", type: "text", placeholder: "#ECB22E", group: "Colors" },
  { name: "BR_ErrorColor", label: "Error Color", type: "text", placeholder: "#E01E5A", group: "Colors" },
  { name: "BR_BackgroundColor", label: "Background Color", type: "text", group: "Colors" },
  { name: "BR_BackgroundColorDark", label: "Background Color (Dark)", type: "text", group: "Colors" },

  // Typography
  { name: "BR_FontFamily", label: "Font Family", type: "text", placeholder: "Inter, system-ui, sans-serif", group: "Typography" },
  { name: "BR_FontFamilyHeading", label: "Heading Font", type: "text", group: "Typography" },
  { name: "BR_FontFamilyMono", label: "Monospace Font", type: "text", placeholder: "JetBrains Mono, monospace", group: "Typography" },
  { name: "BR_FontSizeBase", label: "Base Font Size", type: "text", placeholder: "16px", group: "Typography" },
  { name: "BR_BorderRadius", label: "Border Radius", type: "text", placeholder: "0.5rem", group: "Layout" },

  // Links
  { name: "BR_WebsiteUrl", label: "Website URL", type: "url", group: "Links" },
  { name: "BR_SupportEmail", label: "Support Email", type: "email", group: "Links" },
  { name: "BR_SupportUrl", label: "Support URL", type: "url", group: "Links" },
  { name: "BR_PrivacyUrl", label: "Privacy Policy URL", type: "url", group: "Links" },
  { name: "BR_TermsUrl", label: "Terms of Service URL", type: "url", group: "Links" },

  // Footer
  { name: "BR_CopyrightText", label: "Copyright Text", type: "text", placeholder: "© 2024 Company Name", group: "Footer" },

  // Relationships
  { name: "BRPJ_ID", label: "Project", type: "fk", required: true, isForeignKey: true, fkTable: "PJ", group: "Relationships" },
  { name: "BROR_ID", label: "Organization", type: "fk", isForeignKey: true, fkTable: "OR", group: "Relationships" },
];

export const brandingAssetFields: FieldDefinition[] = [
  { name: "BA_Key", label: "Asset Key", type: "text", required: true, placeholder: "logo-header", group: "Identity" },
  { name: "BA_Name", label: "Asset Name", type: "text", required: true, group: "Identity" },
  { name: "BA_Type", label: "Asset Type", type: "select", required: true, options: [
    { value: "logo", label: "Logo" },
    { value: "icon", label: "Icon" },
    { value: "favicon", label: "Favicon" },
    { value: "css", label: "CSS" },
    { value: "css_variables", label: "CSS Variables" },
    { value: "theme_config", label: "Theme Config" },
    { value: "font", label: "Font" },
    { value: "image", label: "Image" },
    { value: "manifest", label: "Manifest" },
    { value: "email_template", label: "Email Template" },
    { value: "other", label: "Other" },
  ], group: "Identity" },
  { name: "BA_Category", label: "Category", type: "select", required: true, options: [
    { value: "identity", label: "Identity" },
    { value: "styling", label: "Styling" },
    { value: "typography", label: "Typography" },
    { value: "templates", label: "Templates" },
    { value: "configuration", label: "Configuration" },
    { value: "media", label: "Media" },
  ], group: "Identity" },
  { name: "BA_Content", label: "Content", type: "textarea", group: "Content" },
  { name: "BA_Url", label: "File URL", type: "url", group: "Content" },
  { name: "BA_IsGenerated", label: "Is Generated", type: "checkbox", group: "Generation" },
  { name: "BABR_ID", label: "Branding", type: "fk", required: true, isForeignKey: true, fkTable: "BR", group: "Relationships" },
];

export const brandingOverrideFields: FieldDefinition[] = [
  { name: "BO_Key", label: "Override Key", type: "text", required: true, placeholder: "logo-header", group: "Identity" },
  { name: "BO_Name", label: "Override Name", type: "text", required: true, group: "Identity" },
  { name: "BO_Type", label: "Override Type", type: "select", required: true, options: [
    { value: "replace", label: "Replace" },
    { value: "merge", label: "Merge" },
    { value: "append", label: "Append" },
    { value: "prepend", label: "Prepend" },
    { value: "disable", label: "Disable" },
  ], group: "Identity" },
  { name: "BO_Description", label: "Description", type: "textarea", group: "Details" },
  { name: "BO_Value", label: "Override Value", type: "text", group: "Content" },
  { name: "BO_Content", label: "Override Content", type: "textarea", group: "Content" },
  { name: "BO_Url", label: "Override File URL", type: "url", group: "Content" },
  { name: "BO_Priority", label: "Priority", type: "number", defaultValue: 100, group: "Behavior", helpText: "Higher wins" },
  { name: "BO_IsActive", label: "Active", type: "checkbox", defaultValue: true, group: "Behavior" },
  { name: "BO_Reason", label: "Reason for Override", type: "textarea", group: "Audit" },
  { name: "BOBR_ID", label: "Branding", type: "fk", required: true, isForeignKey: true, fkTable: "BR", group: "Relationships" },
  { name: "BOBA_ID", label: "Asset (optional)", type: "fk", isForeignKey: true, fkTable: "BA", group: "Relationships" },
];

// ============================================================================
// SAMPLE DATA
// ============================================================================

export const sampleCustomers: Customer[] = [
  {
    CU_ID: "cu-001",
    CU_Type: "business",
    CU_Status: "active",
    CU_Code: "ACME-001",
    CU_DisplayName: "ACME Corporation",
    CU_LegalName: "ACME Corporation Inc.",
    CU_Email: "contact@acme.com",
    CU_Website: "https://acme.com",
    CU_Currency: "USD",
    CU_Country: "US",
    CU_Language: "en",
    CU_Timezone: "America/New_York",
    CU_Industry: "541512",
    CU_Tier: "enterprise",
    CU_CreatedAt: new Date().toISOString(),
    CU_UpdatedAt: new Date().toISOString(),
  },
];

export const sampleContacts: Contact[] = [
  {
    CO_ID: "co-001",
    CO_Type: "primary",
    CO_FirstName: "John",
    CO_LastName: "Doe",
    CO_Email: "john.doe@acme.com",
    CO_JobTitle: "CTO",
    CO_Department: "Technology",
    CO_Language: "en",
    CO_Timezone: "America/New_York",
    CO_IsPrimary: true,
    CO_IsActive: true,
    COCU_ID: "cu-001",
    CO_CreatedAt: new Date().toISOString(),
    CO_UpdatedAt: new Date().toISOString(),
  },
];

export const sampleProjects: Project[] = [
  {
    PJ_ID: "pj-ozmetadb",
    PJ_Code: "OZMETADB",
    PJ_Name: "OZMetaDB System",
    PJ_Description: "Core metadata management system",
    PJ_Status: "active",
    PJ_Type: "internal",
    PJ_IsSystem: true,
    PJ_Priority: "critical",
    PJ_Currency: "USD",
    PJ_Timezone: "UTC",
    PJ_Language: "en",
    PJ_Country: "US",
    PJ_Version: "1.0.0",
    PJ_CreatedAt: new Date().toISOString(),
    PJ_UpdatedAt: new Date().toISOString(),
  },
];
