/**
 * OZMetaDB Internationalization System
 *
 * Multilingual message support following the TREM_ID naming convention.
 *
 * TABLE: MS (Message)
 * - MS_ID: Primary key
 * - MS_Key: Unique message key (e.g., "welcome.title", "wizard.customer.intro")
 * - MS_Category: Message category for grouping
 *
 * TABLE: MT (Message Translation)
 * - MT_ID: Primary key
 * - MTMS_ID: FK to Message
 * - MT_Language: ISO 639-1 language code
 * - MT_Text: Translated text
 *
 * SUPPORTED LANGUAGES:
 * - EN: English (default)
 * - ES: Spanish (Español)
 * - FR: French (Français)
 * - DE: German (Deutsch)
 * - ZH: Chinese (中文)
 */

// ============================================================================
// TYPES
// ============================================================================

export type SupportedLanguage = "en" | "es" | "fr" | "de" | "zh";

export interface Message {
  MS_ID: string;
  MS_Key: string;
  MS_Category: MessageCategory;
  MS_Description?: string;
  MS_CreatedAt: string;
  MS_UpdatedAt: string;
}

export interface MessageTranslation {
  MT_ID: string;
  MTMS_ID: string;  // FK: Translation → Message
  MT_Language: SupportedLanguage;
  MT_Text: string;
  MT_CreatedAt: string;
  MT_UpdatedAt: string;
}

export type MessageCategory =
  | "common"
  | "navigation"
  | "wizard"
  | "validation"
  | "chat"
  | "settings"
  | "model"
  | "security"
  | "error";

// ============================================================================
// LANGUAGE METADATA
// ============================================================================

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, {
  name: string;
  nativeName: string;
  flag: string;
  direction: "ltr" | "rtl";
}> = {
  en: { name: "English", nativeName: "English", flag: "🇺🇸", direction: "ltr" },
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸", direction: "ltr" },
  fr: { name: "French", nativeName: "Français", flag: "🇫🇷", direction: "ltr" },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪", direction: "ltr" },
  zh: { name: "Chinese", nativeName: "中文", flag: "🇨🇳", direction: "ltr" },
};

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

// ============================================================================
// MESSAGE TRANSLATIONS
// ============================================================================

type TranslationRecord = Record<SupportedLanguage, string>;

export const TRANSLATIONS: Record<string, TranslationRecord> = {
  // ============================================================================
  // COMMON
  // ============================================================================
  "common.save": {
    en: "Save",
    es: "Guardar",
    fr: "Enregistrer",
    de: "Speichern",
    zh: "保存",
  },
  "common.cancel": {
    en: "Cancel",
    es: "Cancelar",
    fr: "Annuler",
    de: "Abbrechen",
    zh: "取消",
  },
  "common.delete": {
    en: "Delete",
    es: "Eliminar",
    fr: "Supprimer",
    de: "Löschen",
    zh: "删除",
  },
  "common.edit": {
    en: "Edit",
    es: "Editar",
    fr: "Modifier",
    de: "Bearbeiten",
    zh: "编辑",
  },
  "common.add": {
    en: "Add",
    es: "Agregar",
    fr: "Ajouter",
    de: "Hinzufügen",
    zh: "添加",
  },
  "common.create": {
    en: "Create",
    es: "Crear",
    fr: "Créer",
    de: "Erstellen",
    zh: "创建",
  },
  "common.back": {
    en: "Back",
    es: "Atrás",
    fr: "Retour",
    de: "Zurück",
    zh: "返回",
  },
  "common.next": {
    en: "Next",
    es: "Siguiente",
    fr: "Suivant",
    de: "Weiter",
    zh: "下一步",
  },
  "common.complete": {
    en: "Complete",
    es: "Completar",
    fr: "Terminer",
    de: "Abschließen",
    zh: "完成",
  },
  "common.loading": {
    en: "Loading...",
    es: "Cargando...",
    fr: "Chargement...",
    de: "Laden...",
    zh: "加载中...",
  },
  "common.search": {
    en: "Search",
    es: "Buscar",
    fr: "Rechercher",
    de: "Suchen",
    zh: "搜索",
  },
  "common.filter": {
    en: "Filter",
    es: "Filtrar",
    fr: "Filtrer",
    de: "Filtern",
    zh: "筛选",
  },
  "common.required": {
    en: "Required",
    es: "Requerido",
    fr: "Requis",
    de: "Erforderlich",
    zh: "必填",
  },
  "common.optional": {
    en: "Optional",
    es: "Opcional",
    fr: "Optionnel",
    de: "Optional",
    zh: "可选",
  },
  "common.yes": {
    en: "Yes",
    es: "Sí",
    fr: "Oui",
    de: "Ja",
    zh: "是",
  },
  "common.no": {
    en: "No",
    es: "No",
    fr: "Non",
    de: "Nein",
    zh: "否",
  },
  "common.autoDetected": {
    en: "Auto-detected",
    es: "Auto-detectado",
    fr: "Auto-détecté",
    de: "Automatisch erkannt",
    zh: "自动检测",
  },

  // ============================================================================
  // NAVIGATION
  // ============================================================================
  "nav.dashboard": {
    en: "Dashboard",
    es: "Panel de control",
    fr: "Tableau de bord",
    de: "Dashboard",
    zh: "仪表板",
  },
  "nav.model": {
    en: "Data Model",
    es: "Modelo de datos",
    fr: "Modèle de données",
    de: "Datenmodell",
    zh: "数据模型",
  },
  "nav.workflows": {
    en: "Workflows",
    es: "Flujos de trabajo",
    fr: "Flux de travail",
    de: "Arbeitsabläufe",
    zh: "工作流",
  },
  "nav.security": {
    en: "Security",
    es: "Seguridad",
    fr: "Sécurité",
    de: "Sicherheit",
    zh: "安全",
  },
  "nav.governance": {
    en: "Governance",
    es: "Gobernanza",
    fr: "Gouvernance",
    de: "Governance",
    zh: "治理",
  },
  "nav.settings": {
    en: "Settings",
    es: "Configuración",
    fr: "Paramètres",
    de: "Einstellungen",
    zh: "设置",
  },
  "nav.projects": {
    en: "Projects",
    es: "Proyectos",
    fr: "Projets",
    de: "Projekte",
    zh: "项目",
  },

  // ============================================================================
  // CHAT / AI ASSISTANT
  // ============================================================================
  "chat.welcome.title": {
    en: "Hello! I'm your OZMetaDB assistant.",
    es: "¡Hola! Soy tu asistente de OZMetaDB.",
    fr: "Bonjour ! Je suis votre assistant OZMetaDB.",
    de: "Hallo! Ich bin Ihr OZMetaDB-Assistent.",
    zh: "您好！我是您的 OZMetaDB 助手。",
  },
  "chat.welcome.quickStart": {
    en: "Quick Start:",
    es: "Inicio rápido:",
    fr: "Démarrage rapide :",
    de: "Schnellstart:",
    zh: "快速开始：",
  },
  "chat.welcome.addCustomer": {
    en: 'Say "add a customer" to create a customer record',
    es: 'Di "agregar un cliente" para crear un registro de cliente',
    fr: 'Dites "ajouter un client" pour créer un enregistrement client',
    de: 'Sagen Sie "Kunde hinzufügen" um einen Kundendatensatz zu erstellen',
    zh: '说"添加客户"来创建客户记录',
  },
  "chat.welcome.addContact": {
    en: 'Say "add a contact" to add a contact',
    es: 'Di "agregar un contacto" para agregar un contacto',
    fr: 'Dites "ajouter un contact" pour ajouter un contact',
    de: 'Sagen Sie "Kontakt hinzufügen" um einen Kontakt hinzuzufügen',
    zh: '说"添加联系人"来添加联系人',
  },
  "chat.welcome.addProject": {
    en: 'Say "add a project" to start a new project',
    es: 'Di "agregar un proyecto" para iniciar un nuevo proyecto',
    fr: 'Dites "ajouter un projet" pour démarrer un nouveau projet',
    de: 'Sagen Sie "Projekt hinzufügen" um ein neues Projekt zu starten',
    zh: '说"添加项目"来开始新项目',
  },
  "chat.welcome.showAll": {
    en: 'Say "add" to see all available record types',
    es: 'Di "agregar" para ver todos los tipos de registros disponibles',
    fr: 'Dites "ajouter" pour voir tous les types d\'enregistrements disponibles',
    de: 'Sagen Sie "hinzufügen" um alle verfügbaren Datensatztypen zu sehen',
    zh: '说"添加"查看所有可用记录类型',
  },
  "chat.welcome.namingConvention": {
    en: "All data uses the **TREM_ID naming convention** with 2-char prefixes (CU_, CO_, PJ_) and ISO international standards.",
    es: "Todos los datos usan la **convención de nombres TREM_ID** con prefijos de 2 caracteres (CU_, CO_, PJ_) y estándares internacionales ISO.",
    fr: "Toutes les données utilisent la **convention de nommage TREM_ID** avec des préfixes de 2 caractères (CU_, CO_, PJ_) et les normes internationales ISO.",
    de: "Alle Daten verwenden die **TREM_ID-Namenskonvention** mit 2-Zeichen-Präfixen (CU_, CO_, PJ_) und internationalen ISO-Standards.",
    zh: "所有数据使用 **TREM_ID 命名约定**，采用2字符前缀（CU_、CO_、PJ_）和 ISO 国际标准。",
  },
  "chat.welcome.help": {
    en: 'Type "help" for all commands!',
    es: '¡Escribe "ayuda" para ver todos los comandos!',
    fr: 'Tapez "aide" pour toutes les commandes !',
    de: 'Geben Sie "Hilfe" ein für alle Befehle!',
    zh: '输入"帮助"查看所有命令！',
  },
  "chat.placeholder.default": {
    en: "Try 'add a customer', 'help', or 'go to settings'...",
    es: "Prueba 'agregar un cliente', 'ayuda', o 'ir a configuración'...",
    fr: "Essayez 'ajouter un client', 'aide', ou 'aller aux paramètres'...",
    de: "Versuchen Sie 'Kunde hinzufügen', 'Hilfe', oder 'zu Einstellungen gehen'...",
    zh: "尝试'添加客户'、'帮助'或'转到设置'...",
  },
  "chat.placeholder.wizard": {
    en: "Complete the form above...",
    es: "Complete el formulario de arriba...",
    fr: "Complétez le formulaire ci-dessus...",
    de: "Füllen Sie das Formular oben aus...",
    zh: "请填写上面的表单...",
  },
  "chat.placeholder.selector": {
    en: "Select a record type above...",
    es: "Seleccione un tipo de registro arriba...",
    fr: "Sélectionnez un type d'enregistrement ci-dessus...",
    de: "Wählen Sie oben einen Datensatztyp...",
    zh: "请在上方选择记录类型...",
  },
  "chat.wizardCancelled": {
    en: "No problem! The wizard was cancelled. Let me know if you need anything else.",
    es: "¡Sin problema! El asistente fue cancelado. Avísame si necesitas algo más.",
    fr: "Pas de problème ! L'assistant a été annulé. Dites-moi si vous avez besoin d'autre chose.",
    de: "Kein Problem! Der Assistent wurde abgebrochen. Lassen Sie mich wissen, wenn Sie etwas anderes brauchen.",
    zh: "没问题！向导已取消。如果您需要其他帮助，请告诉我。",
  },
  "chat.recordCreated": {
    en: "Record created successfully! Here's a summary:",
    es: "¡Registro creado exitosamente! Aquí está el resumen:",
    fr: "Enregistrement créé avec succès ! Voici le résumé :",
    de: "Datensatz erfolgreich erstellt! Hier ist die Zusammenfassung:",
    zh: "记录创建成功！以下是摘要：",
  },
  "chat.selectRecordType": {
    en: "What would you like to create? Select from the available record types below:",
    es: "¿Qué te gustaría crear? Selecciona de los tipos de registros disponibles a continuación:",
    fr: "Que souhaitez-vous créer ? Sélectionnez parmi les types d'enregistrements disponibles ci-dessous :",
    de: "Was möchten Sie erstellen? Wählen Sie aus den verfügbaren Datensatztypen unten:",
    zh: "您想创建什么？请从下面的可用记录类型中选择：",
  },

  // ============================================================================
  // WIZARD - CUSTOMER
  // ============================================================================
  "wizard.customer.title": {
    en: "Add New Customer",
    es: "Agregar Nuevo Cliente",
    fr: "Ajouter un Nouveau Client",
    de: "Neuen Kunden Hinzufügen",
    zh: "添加新客户",
  },
  "wizard.customer.intro": {
    en: "Let's add a new customer! I'll guide you through the process step by step.",
    es: "¡Agreguemos un nuevo cliente! Te guiaré a través del proceso paso a paso.",
    fr: "Ajoutons un nouveau client ! Je vais vous guider étape par étape.",
    de: "Fügen wir einen neuen Kunden hinzu! Ich werde Sie Schritt für Schritt durch den Prozess führen.",
    zh: "让我们添加一个新客户！我将一步步指导您完成整个过程。",
  },
  "wizard.customer.schema": {
    en: `**Customer table (CU prefix) - TREM_ID naming:**
- PK: **CU_ID**
- FKs: **CUCU_ID** (parent), **CUOR_ID** (organization)
- Fields: CU_Type, CU_Status, CU_DisplayName
- Locale: CU_Country (ISO 3166), CU_Currency (ISO 4217)

Fill in the form below:`,
    es: `**Tabla Cliente (prefijo CU) - Nomenclatura TREM_ID:**
- PK: **CU_ID**
- FKs: **CUCU_ID** (padre), **CUOR_ID** (organización)
- Campos: CU_Type, CU_Status, CU_DisplayName
- Localización: CU_Country (ISO 3166), CU_Currency (ISO 4217)

Complete el formulario a continuación:`,
    fr: `**Table Client (préfixe CU) - Nommage TREM_ID :**
- PK : **CU_ID**
- FKs : **CUCU_ID** (parent), **CUOR_ID** (organisation)
- Champs : CU_Type, CU_Status, CU_DisplayName
- Locale : CU_Country (ISO 3166), CU_Currency (ISO 4217)

Remplissez le formulaire ci-dessous :`,
    de: `**Kundentabelle (Präfix CU) - TREM_ID-Benennung:**
- PK: **CU_ID**
- FKs: **CUCU_ID** (Eltern), **CUOR_ID** (Organisation)
- Felder: CU_Type, CU_Status, CU_DisplayName
- Locale: CU_Country (ISO 3166), CU_Currency (ISO 4217)

Füllen Sie das Formular unten aus:`,
    zh: `**客户表（CU 前缀）- TREM_ID 命名：**
- 主键：**CU_ID**
- 外键：**CUCU_ID**（父级），**CUOR_ID**（组织）
- 字段：CU_Type、CU_Status、CU_DisplayName
- 地区设置：CU_Country（ISO 3166）、CU_Currency（ISO 4217）

请填写下面的表单：`,
  },

  // ============================================================================
  // WIZARD - CONTACT
  // ============================================================================
  "wizard.contact.title": {
    en: "Add New Contact",
    es: "Agregar Nuevo Contacto",
    fr: "Ajouter un Nouveau Contact",
    de: "Neuen Kontakt Hinzufügen",
    zh: "添加新联系人",
  },
  "wizard.contact.intro": {
    en: "Let's add a new contact! I'll guide you through each field.",
    es: "¡Agreguemos un nuevo contacto! Te guiaré a través de cada campo.",
    fr: "Ajoutons un nouveau contact ! Je vais vous guider champ par champ.",
    de: "Fügen wir einen neuen Kontakt hinzu! Ich werde Sie durch jedes Feld führen.",
    zh: "让我们添加一个新联系人！我将指导您填写每个字段。",
  },
  "wizard.contact.schema": {
    en: `**Contact table (CO prefix) - TREM_ID naming:**
- PK: **CO_ID**
- FKs: **COCU_ID** (customer), **COOR_ID** (organization)
- Fields: CO_FirstName, CO_LastName, CO_Email
- E.164: CO_Phone, CO_Mobile
- Locale: CO_Language (ISO 639-1), CO_Timezone (IANA)

Fill in the form below:`,
    es: `**Tabla Contacto (prefijo CO) - Nomenclatura TREM_ID:**
- PK: **CO_ID**
- FKs: **COCU_ID** (cliente), **COOR_ID** (organización)
- Campos: CO_FirstName, CO_LastName, CO_Email
- E.164: CO_Phone, CO_Mobile
- Localización: CO_Language (ISO 639-1), CO_Timezone (IANA)

Complete el formulario a continuación:`,
    fr: `**Table Contact (préfixe CO) - Nommage TREM_ID :**
- PK : **CO_ID**
- FKs : **COCU_ID** (client), **COOR_ID** (organisation)
- Champs : CO_FirstName, CO_LastName, CO_Email
- E.164 : CO_Phone, CO_Mobile
- Locale : CO_Language (ISO 639-1), CO_Timezone (IANA)

Remplissez le formulaire ci-dessous :`,
    de: `**Kontakttabelle (Präfix CO) - TREM_ID-Benennung:**
- PK: **CO_ID**
- FKs: **COCU_ID** (Kunde), **COOR_ID** (Organisation)
- Felder: CO_FirstName, CO_LastName, CO_Email
- E.164: CO_Phone, CO_Mobile
- Locale: CO_Language (ISO 639-1), CO_Timezone (IANA)

Füllen Sie das Formular unten aus:`,
    zh: `**联系人表（CO 前缀）- TREM_ID 命名：**
- 主键：**CO_ID**
- 外键：**COCU_ID**（客户），**COOR_ID**（组织）
- 字段：CO_FirstName、CO_LastName、CO_Email
- E.164：CO_Phone、CO_Mobile
- 地区设置：CO_Language（ISO 639-1）、CO_Timezone（IANA）

请填写下面的表单：`,
  },

  // ============================================================================
  // WIZARD - PROJECT
  // ============================================================================
  "wizard.project.title": {
    en: "Add New Project",
    es: "Agregar Nuevo Proyecto",
    fr: "Ajouter un Nouveau Projet",
    de: "Neues Projekt Hinzufügen",
    zh: "添加新项目",
  },
  "wizard.project.intro": {
    en: "Let's create a new project! I'll walk you through the setup.",
    es: "¡Creemos un nuevo proyecto! Te guiaré a través de la configuración.",
    fr: "Créons un nouveau projet ! Je vais vous guider dans la configuration.",
    de: "Erstellen wir ein neues Projekt! Ich werde Sie durch die Einrichtung führen.",
    zh: "让我们创建一个新项目！我将指导您完成设置。",
  },
  "wizard.project.schema": {
    en: `**Project table (PJ prefix) - TREM_ID naming:**
- PK: **PJ_ID**
- FKs: **PJCU_ID** (owner), **PJCO_ID** (contact), **PJOR_ID** (org)
- Fields: PJ_Code, PJ_Name, PJ_Status
- Locale: PJ_Currency (ISO 4217), PJ_Timezone (IANA)

Fill in the form below:`,
    es: `**Tabla Proyecto (prefijo PJ) - Nomenclatura TREM_ID:**
- PK: **PJ_ID**
- FKs: **PJCU_ID** (propietario), **PJCO_ID** (contacto), **PJOR_ID** (org)
- Campos: PJ_Code, PJ_Name, PJ_Status
- Localización: PJ_Currency (ISO 4217), PJ_Timezone (IANA)

Complete el formulario a continuación:`,
    fr: `**Table Projet (préfixe PJ) - Nommage TREM_ID :**
- PK : **PJ_ID**
- FKs : **PJCU_ID** (propriétaire), **PJCO_ID** (contact), **PJOR_ID** (org)
- Champs : PJ_Code, PJ_Name, PJ_Status
- Locale : PJ_Currency (ISO 4217), PJ_Timezone (IANA)

Remplissez le formulaire ci-dessous :`,
    de: `**Projekttabelle (Präfix PJ) - TREM_ID-Benennung:**
- PK: **PJ_ID**
- FKs: **PJCU_ID** (Eigentümer), **PJCO_ID** (Kontakt), **PJOR_ID** (Org)
- Felder: PJ_Code, PJ_Name, PJ_Status
- Locale: PJ_Currency (ISO 4217), PJ_Timezone (IANA)

Füllen Sie das Formular unten aus:`,
    zh: `**项目表（PJ 前缀）- TREM_ID 命名：**
- 主键：**PJ_ID**
- 外键：**PJCU_ID**（所有者），**PJCO_ID**（联系人），**PJOR_ID**（组织）
- 字段：PJ_Code、PJ_Name、PJ_Status
- 地区设置：PJ_Currency（ISO 4217）、PJ_Timezone（IANA）

请填写下面的表单：`,
  },

  // ============================================================================
  // WIZARD - ADDRESS
  // ============================================================================
  "wizard.address.title": {
    en: "Add New Address",
    es: "Agregar Nueva Dirección",
    fr: "Ajouter une Nouvelle Adresse",
    de: "Neue Adresse Hinzufügen",
    zh: "添加新地址",
  },
  "wizard.address.intro": {
    en: "Let's add a new address! ISO 3166 compliant.",
    es: "¡Agreguemos una nueva dirección! Compatible con ISO 3166.",
    fr: "Ajoutons une nouvelle adresse ! Conforme à ISO 3166.",
    de: "Fügen wir eine neue Adresse hinzu! ISO 3166 konform.",
    zh: "让我们添加一个新地址！符合 ISO 3166 标准。",
  },
  "wizard.address.schema": {
    en: `**Address table (AD prefix) - TREM_ID naming:**
- PK: **AD_ID**
- FKs: **ADCU_ID** (customer), **ADCO_ID** (contact), **ADOR_ID** (org)
- Fields: AD_Line1, AD_City, AD_PostalCode
- Standards: AD_Country (ISO 3166-1), AD_State (ISO 3166-2)

Fill in the form below:`,
    es: `**Tabla Dirección (prefijo AD) - Nomenclatura TREM_ID:**
- PK: **AD_ID**
- FKs: **ADCU_ID** (cliente), **ADCO_ID** (contacto), **ADOR_ID** (org)
- Campos: AD_Line1, AD_City, AD_PostalCode
- Estándares: AD_Country (ISO 3166-1), AD_State (ISO 3166-2)

Complete el formulario a continuación:`,
    fr: `**Table Adresse (préfixe AD) - Nommage TREM_ID :**
- PK : **AD_ID**
- FKs : **ADCU_ID** (client), **ADCO_ID** (contact), **ADOR_ID** (org)
- Champs : AD_Line1, AD_City, AD_PostalCode
- Normes : AD_Country (ISO 3166-1), AD_State (ISO 3166-2)

Remplissez le formulaire ci-dessous :`,
    de: `**Adresstabelle (Präfix AD) - TREM_ID-Benennung:**
- PK: **AD_ID**
- FKs: **ADCU_ID** (Kunde), **ADCO_ID** (Kontakt), **ADOR_ID** (Org)
- Felder: AD_Line1, AD_City, AD_PostalCode
- Standards: AD_Country (ISO 3166-1), AD_State (ISO 3166-2)

Füllen Sie das Formular unten aus:`,
    zh: `**地址表（AD 前缀）- TREM_ID 命名：**
- 主键：**AD_ID**
- 外键：**ADCU_ID**（客户），**ADCO_ID**（联系人），**ADOR_ID**（组织）
- 字段：AD_Line1、AD_City、AD_PostalCode
- 标准：AD_Country（ISO 3166-1）、AD_State（ISO 3166-2）

请填写下面的表单：`,
  },

  // ============================================================================
  // WIZARD - ORGANIZATION
  // ============================================================================
  "wizard.organization.title": {
    en: "Add New Organization",
    es: "Agregar Nueva Organización",
    fr: "Ajouter une Nouvelle Organisation",
    de: "Neue Organisation Hinzufügen",
    zh: "添加新组织",
  },
  "wizard.organization.intro": {
    en: "Let's add a new organization!",
    es: "¡Agreguemos una nueva organización!",
    fr: "Ajoutons une nouvelle organisation !",
    de: "Fügen wir eine neue Organisation hinzu!",
    zh: "让我们添加一个新组织！",
  },
  "wizard.organization.schema": {
    en: `**Organization table (OR prefix) - TREM_ID naming:**
- PK: **OR_ID**
- FKs: **OROR_ID** (parent organization)
- Fields: OR_LegalName, OR_TradingName, OR_Status
- Locale: OR_Country (ISO 3166), OR_Currency (ISO 4217)

Fill in the form below:`,
    es: `**Tabla Organización (prefijo OR) - Nomenclatura TREM_ID:**
- PK: **OR_ID**
- FKs: **OROR_ID** (organización padre)
- Campos: OR_LegalName, OR_TradingName, OR_Status
- Localización: OR_Country (ISO 3166), OR_Currency (ISO 4217)

Complete el formulario a continuación:`,
    fr: `**Table Organisation (préfixe OR) - Nommage TREM_ID :**
- PK : **OR_ID**
- FKs : **OROR_ID** (organisation parente)
- Champs : OR_LegalName, OR_TradingName, OR_Status
- Locale : OR_Country (ISO 3166), OR_Currency (ISO 4217)

Remplissez le formulaire ci-dessous :`,
    de: `**Organisationstabelle (Präfix OR) - TREM_ID-Benennung:**
- PK: **OR_ID**
- FKs: **OROR_ID** (Elternorganisation)
- Felder: OR_LegalName, OR_TradingName, OR_Status
- Locale: OR_Country (ISO 3166), OR_Currency (ISO 4217)

Füllen Sie das Formular unten aus:`,
    zh: `**组织表（OR 前缀）- TREM_ID 命名：**
- 主键：**OR_ID**
- 外键：**OROR_ID**（父组织）
- 字段：OR_LegalName、OR_TradingName、OR_Status
- 地区设置：OR_Country（ISO 3166）、OR_Currency（ISO 4217）

请填写下面的表单：`,
  },

  // ============================================================================
  // WIZARD SELECTOR
  // ============================================================================
  "wizard.selector.title": {
    en: "Select a record type to create:",
    es: "Seleccione un tipo de registro para crear:",
    fr: "Sélectionnez un type d'enregistrement à créer :",
    de: "Wählen Sie einen Datensatztyp zum Erstellen:",
    zh: "选择要创建的记录类型：",
  },
  "wizard.selector.prefix": {
    en: "prefix",
    es: "prefijo",
    fr: "préfixe",
    de: "Präfix",
    zh: "前缀",
  },

  // ============================================================================
  // TABLE NAMES
  // ============================================================================
  "table.customer": {
    en: "Customer",
    es: "Cliente",
    fr: "Client",
    de: "Kunde",
    zh: "客户",
  },
  "table.contact": {
    en: "Contact",
    es: "Contacto",
    fr: "Contact",
    de: "Kontakt",
    zh: "联系人",
  },
  "table.address": {
    en: "Address",
    es: "Dirección",
    fr: "Adresse",
    de: "Adresse",
    zh: "地址",
  },
  "table.organization": {
    en: "Organization",
    es: "Organización",
    fr: "Organisation",
    de: "Organisation",
    zh: "组织",
  },
  "table.project": {
    en: "Project",
    es: "Proyecto",
    fr: "Projet",
    de: "Projekt",
    zh: "项目",
  },
  "table.table": {
    en: "Table",
    es: "Tabla",
    fr: "Table",
    de: "Tabelle",
    zh: "表",
  },
  "table.column": {
    en: "Column",
    es: "Columna",
    fr: "Colonne",
    de: "Spalte",
    zh: "列",
  },

  // ============================================================================
  // FIELD LABELS
  // ============================================================================
  "field.type": {
    en: "Type",
    es: "Tipo",
    fr: "Type",
    de: "Typ",
    zh: "类型",
  },
  "field.status": {
    en: "Status",
    es: "Estado",
    fr: "Statut",
    de: "Status",
    zh: "状态",
  },
  "field.name": {
    en: "Name",
    es: "Nombre",
    fr: "Nom",
    de: "Name",
    zh: "名称",
  },
  "field.email": {
    en: "Email",
    es: "Correo electrónico",
    fr: "E-mail",
    de: "E-Mail",
    zh: "电子邮件",
  },
  "field.phone": {
    en: "Phone",
    es: "Teléfono",
    fr: "Téléphone",
    de: "Telefon",
    zh: "电话",
  },
  "field.country": {
    en: "Country",
    es: "País",
    fr: "Pays",
    de: "Land",
    zh: "国家",
  },
  "field.currency": {
    en: "Currency",
    es: "Moneda",
    fr: "Devise",
    de: "Währung",
    zh: "货币",
  },
  "field.language": {
    en: "Language",
    es: "Idioma",
    fr: "Langue",
    de: "Sprache",
    zh: "语言",
  },
  "field.timezone": {
    en: "Timezone",
    es: "Zona horaria",
    fr: "Fuseau horaire",
    de: "Zeitzone",
    zh: "时区",
  },
  "field.firstName": {
    en: "First Name",
    es: "Nombre",
    fr: "Prénom",
    de: "Vorname",
    zh: "名",
  },
  "field.lastName": {
    en: "Last Name",
    es: "Apellido",
    fr: "Nom",
    de: "Nachname",
    zh: "姓",
  },
  "field.displayName": {
    en: "Display Name",
    es: "Nombre para mostrar",
    fr: "Nom d'affichage",
    de: "Anzeigename",
    zh: "显示名称",
  },
  "field.description": {
    en: "Description",
    es: "Descripción",
    fr: "Description",
    de: "Beschreibung",
    zh: "描述",
  },
  "field.code": {
    en: "Code",
    es: "Código",
    fr: "Code",
    de: "Code",
    zh: "代码",
  },

  // ============================================================================
  // SETTINGS
  // ============================================================================
  "settings.title": {
    en: "Settings",
    es: "Configuración",
    fr: "Paramètres",
    de: "Einstellungen",
    zh: "设置",
  },
  "settings.language": {
    en: "Language",
    es: "Idioma",
    fr: "Langue",
    de: "Sprache",
    zh: "语言",
  },
  "settings.theme": {
    en: "Theme",
    es: "Tema",
    fr: "Thème",
    de: "Thema",
    zh: "主题",
  },
  "settings.appearance": {
    en: "Appearance",
    es: "Apariencia",
    fr: "Apparence",
    de: "Erscheinungsbild",
    zh: "外观",
  },
  "settings.system": {
    en: "System",
    es: "Sistema",
    fr: "Système",
    de: "System",
    zh: "系统",
  },
  "settings.user": {
    en: "User",
    es: "Usuario",
    fr: "Utilisateur",
    de: "Benutzer",
    zh: "用户",
  },

  // ============================================================================
  // VALIDATION MESSAGES
  // ============================================================================
  "validation.required": {
    en: "{field} is required",
    es: "{field} es requerido",
    fr: "{field} est requis",
    de: "{field} ist erforderlich",
    zh: "{field} 是必填项",
  },
  "validation.minLength": {
    en: "Minimum {min} characters",
    es: "Mínimo {min} caracteres",
    fr: "Minimum {min} caractères",
    de: "Mindestens {min} Zeichen",
    zh: "最少 {min} 个字符",
  },
  "validation.maxLength": {
    en: "Maximum {max} characters",
    es: "Máximo {max} caracteres",
    fr: "Maximum {max} caractères",
    de: "Maximal {max} Zeichen",
    zh: "最多 {max} 个字符",
  },
  "validation.invalidEmail": {
    en: "Invalid email address",
    es: "Dirección de correo electrónico inválida",
    fr: "Adresse e-mail invalide",
    de: "Ungültige E-Mail-Adresse",
    zh: "无效的电子邮件地址",
  },
  "validation.invalidPhone": {
    en: "Invalid phone number (E.164 format)",
    es: "Número de teléfono inválido (formato E.164)",
    fr: "Numéro de téléphone invalide (format E.164)",
    de: "Ungültige Telefonnummer (E.164-Format)",
    zh: "无效的电话号码（E.164 格式）",
  },

  // ============================================================================
  // ERRORS
  // ============================================================================
  "error.generic": {
    en: "An error occurred. Please try again.",
    es: "Ocurrió un error. Por favor, inténtelo de nuevo.",
    fr: "Une erreur s'est produite. Veuillez réessayer.",
    de: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
    zh: "发生错误。请重试。",
  },
  "error.notFound": {
    en: "Not found",
    es: "No encontrado",
    fr: "Non trouvé",
    de: "Nicht gefunden",
    zh: "未找到",
  },
  "error.noWizard": {
    en: "No wizard configuration found for table: {table}",
    es: "No se encontró configuración de asistente para la tabla: {table}",
    fr: "Aucune configuration d'assistant trouvée pour la table : {table}",
    de: "Keine Assistentenkonfiguration für Tabelle gefunden: {table}",
    zh: "未找到表 {table} 的向导配置",
  },

  // ============================================================================
  // HELP
  // ============================================================================
  "help.title": {
    en: "OZMetaDB Assistant",
    es: "Asistente OZMetaDB",
    fr: "Assistant OZMetaDB",
    de: "OZMetaDB-Assistent",
    zh: "OZMetaDB 助手",
  },
  "help.intro": {
    en: "I can help you with:",
    es: "Puedo ayudarte con:",
    fr: "Je peux vous aider avec :",
    de: "Ich kann Ihnen helfen mit:",
    zh: "我可以帮助您：",
  },
  "help.addData": {
    en: "Add Data (with guided wizards!)",
    es: "Agregar datos (¡con asistentes guiados!)",
    fr: "Ajouter des données (avec des assistants guidés !)",
    de: "Daten hinzufügen (mit geführten Assistenten!)",
    zh: "添加数据（带有引导向导！）",
  },
  "help.navigation": {
    en: "Navigation",
    es: "Navegación",
    fr: "Navigation",
    de: "Navigation",
    zh: "导航",
  },
  "help.information": {
    en: "Information",
    es: "Información",
    fr: "Informations",
    de: "Informationen",
    zh: "信息",
  },
  "help.themes": {
    en: "Themes",
    es: "Temas",
    fr: "Thèmes",
    de: "Themen",
    zh: "主题",
  },
};

// ============================================================================
// TRANSLATION FUNCTION
// ============================================================================

/**
 * Get a translated message by key
 * @param key - Message key (e.g., "common.save")
 * @param language - Target language (defaults to "en")
 * @param params - Optional parameters for interpolation (e.g., {field: "Name"})
 */
export function t(
  key: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE,
  params?: Record<string, string | number>
): string {
  const translations = TRANSLATIONS[key];
  if (!translations) {
    console.warn(`Missing translation for key: ${key}`);
    return key;
  }

  let text = translations[language] || translations[DEFAULT_LANGUAGE] || key;

  // Interpolate parameters
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
    }
  }

  return text;
}

/**
 * Get all translations for a key
 */
export function getAllTranslations(key: string): TranslationRecord | undefined {
  return TRANSLATIONS[key];
}

/**
 * Check if a translation exists
 */
export function hasTranslation(key: string, language?: SupportedLanguage): boolean {
  const translations = TRANSLATIONS[key];
  if (!translations) return false;
  if (language) return !!translations[language];
  return true;
}

/**
 * Get browser language and map to supported language
 */
export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;

  const browserLang = navigator.language.split("-")[0].toLowerCase();
  if (browserLang in SUPPORTED_LANGUAGES) {
    return browserLang as SupportedLanguage;
  }

  return DEFAULT_LANGUAGE;
}
