"use client";

import * as React from "react";
import { X, Maximize2, Minimize2, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChatMessage, type Message } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { DynamicWizard, WizardSummary, WizardSelector, getWizardEnabledTables } from "./DynamicWizard";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { t as translate, type SupportedLanguage } from "@/lib/i18n/messages";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// Table code mapping for dynamic wizards (e.g., "cu", "co", "ad", "or", "pj")
type TableCode = string;

type ResponseResult = {
  content: string;
  contentKey?: string;  // Translation key for the content
  metadata?: Message["metadata"];
  navigate?: string;
  startWizard?: TableCode;
  showWizardSelector?: boolean;
};

/**
 * Generate response based on user message
 * Returns translation keys where possible for multilingual support
 */
function generateResponse(userMessage: string, language: SupportedLanguage): ResponseResult {
  const lower = userMessage.toLowerCase();

  // ============================================================================
  // DATA ENTRY COMMANDS - Start dynamic wizards using table codes
  // ============================================================================

  // Helper to get translated content
  const t = (key: string, params?: Record<string, string | number>) => translate(key, language, params);

  // Add Customer (CU)
  if (
    (lower.includes("add") || lower.includes("create") || lower.includes("new") ||
     lower.includes("agregar") || lower.includes("crear") || lower.includes("nuevo") ||
     lower.includes("ajouter") || lower.includes("hinzufügen") || lower.includes("添加")) &&
    (lower.includes("customer") || lower.includes("cliente") || lower.includes("client") ||
     lower.includes("kunde") || lower.includes("客户"))
  ) {
    return {
      content: `${t("wizard.customer.intro")}

${t("wizard.customer.schema")}`,
      startWizard: "cu",
    };
  }

  // Add Contact (CO)
  if (
    (lower.includes("add") || lower.includes("create") || lower.includes("new") ||
     lower.includes("agregar") || lower.includes("crear") || lower.includes("nuevo") ||
     lower.includes("ajouter") || lower.includes("hinzufügen") || lower.includes("添加")) &&
    (lower.includes("contact") || lower.includes("contacto") || lower.includes("kontakt") || lower.includes("联系"))
  ) {
    return {
      content: `${t("wizard.contact.intro")}

${t("wizard.contact.schema")}`,
      startWizard: "co",
    };
  }

  // Add Project (PJ)
  if (
    (lower.includes("add") || lower.includes("create") || lower.includes("new") ||
     lower.includes("agregar") || lower.includes("crear") || lower.includes("nuevo") ||
     lower.includes("ajouter") || lower.includes("hinzufügen") || lower.includes("添加")) &&
    (lower.includes("project") || lower.includes("proyecto") || lower.includes("projet") ||
     lower.includes("projekt") || lower.includes("项目"))
  ) {
    return {
      content: `${t("wizard.project.intro")}

${t("wizard.project.schema")}`,
      startWizard: "pj",
    };
  }

  // Add Address (AD)
  if (
    (lower.includes("add") || lower.includes("create") || lower.includes("new") ||
     lower.includes("agregar") || lower.includes("crear") || lower.includes("nuevo") ||
     lower.includes("ajouter") || lower.includes("hinzufügen") || lower.includes("添加")) &&
    (lower.includes("address") || lower.includes("dirección") || lower.includes("direccion") ||
     lower.includes("adresse") || lower.includes("地址"))
  ) {
    return {
      content: `${t("wizard.address.intro")}

${t("wizard.address.schema")}`,
      startWizard: "ad",
    };
  }

  // Add Organization (OR)
  if (
    (lower.includes("add") || lower.includes("create") || lower.includes("new") ||
     lower.includes("agregar") || lower.includes("crear") || lower.includes("nuevo") ||
     lower.includes("ajouter") || lower.includes("hinzufügen") || lower.includes("添加")) &&
    (lower.includes("organization") || lower.includes("organización") || lower.includes("organizacion") ||
     lower.includes("organisation") || lower.includes("组织"))
  ) {
    return {
      content: `${t("wizard.organization.intro")}

${t("wizard.organization.schema")}`,
      startWizard: "or",
    };
  }

  // Generic "add" or "create" - show wizard selector
  if (
    (lower === "add" || lower === "create" || lower === "new" ||
     lower === "agregar" || lower === "crear" || lower === "nuevo" ||
     lower === "ajouter" || lower === "hinzufügen" || lower === "添加" ||
     lower.includes("add new") || lower.includes("create new") ||
     lower.includes("agregar nuevo") || lower.includes("crear nuevo")) &&
    !lower.includes("customer") && !lower.includes("cliente") && !lower.includes("client") && !lower.includes("客户") &&
    !lower.includes("contact") && !lower.includes("contacto") && !lower.includes("联系") &&
    !lower.includes("project") && !lower.includes("proyecto") && !lower.includes("项目") &&
    !lower.includes("address") && !lower.includes("dirección") && !lower.includes("地址") &&
    !lower.includes("organization") && !lower.includes("organización") && !lower.includes("组织")
  ) {
    return {
      content: t("chat.selectRecordType"),
      showWizardSelector: true,
    };
  }

  // ============================================================================
  // NAVIGATION COMMANDS
  // ============================================================================

  if (lower.includes("go to settings") || lower.includes("open settings") || lower === "settings") {
    return {
      content: `Opening Settings page where you can customize themes...`,
      navigate: "/settings",
      metadata: {
        suggestions: ["Change to dark mode", "Try Modern theme", "Back to dashboard"],
      },
    };
  }

  if (
    lower.includes("go to model") ||
    lower.includes("data model") ||
    lower.includes("show model") ||
    lower.includes("show tables") ||
    lower === "model"
  ) {
    return {
      content: `Opening the Data Model page. Here you can browse tables, fields, and relationships.`,
      navigate: "/model",
      metadata: {
        suggestions: ["Add a customer", "Add a contact", "View relationships"],
      },
    };
  }

  if (
    lower.includes("go to workflow") ||
    lower.includes("workflow") ||
    lower.includes("state machine")
  ) {
    return {
      content: `Opening the Workflows page. You can visualize and edit state machines here.`,
      navigate: "/workflows",
      metadata: {
        suggestions: ["Open designer", "Add new state", "View transitions"],
      },
    };
  }

  if (
    lower.includes("go to security") ||
    lower.includes("security") ||
    lower.includes("roles") ||
    lower.includes("permissions")
  ) {
    return {
      content: `Opening Security page. Manage roles, permissions, and access policies.`,
      navigate: "/security",
      metadata: {
        suggestions: ["Add new role", "Edit permissions", "Policy editor"],
      },
    };
  }

  if (
    lower.includes("go to governance") ||
    lower.includes("governance") ||
    lower.includes("policies") ||
    lower.includes("compliance")
  ) {
    return {
      content: `Opening Governance page for data quality rules and compliance policies.`,
      navigate: "/governance",
      metadata: {
        suggestions: ["View change requests", "Add policy", "Check compliance"],
      },
    };
  }

  if (lower.includes("go to project") || lower.includes("projects") || lower.includes("my projects")) {
    return {
      content: `Opening Projects page. View and manage your metadata projects.`,
      navigate: "/projects",
      metadata: {
        suggestions: ["Create new project", "Import project", "View recent"],
      },
    };
  }

  if (lower.includes("dashboard") || lower.includes("home") || lower.includes("back to")) {
    return {
      content: `Taking you back to the Dashboard.`,
      navigate: "/",
      metadata: {
        suggestions: ["View stats", "Quick actions", "System status"],
      },
    };
  }

  // ============================================================================
  // TREM_ID / NAMING CONVENTION INFO
  // ============================================================================

  if (lower.includes("trem") || lower.includes("naming") || lower.includes("convention")) {
    return {
      content: `**TREM_ID Naming Convention**

OZMetaDB uses 2-char table prefix + underscore + field name:

**Primary Keys:** \`{XX}_ID\`
- **CU_ID** - Customer primary key
- **CO_ID** - Contact primary key
- **AD_ID** - Address primary key
- **OR_ID** - Organization primary key
- **PJ_ID** - Project primary key

**Foreign Keys:** \`{XXYY}_ID\` (source → target)
- **COCU_ID** - Contact → Customer
- **ADCU_ID** - Address → Customer
- **PJCU_ID** - Project → Customer (owner)
- **CUOR_ID** - Customer → Organization
- **OROR_ID** - Organization → Parent Org

**Columns:** \`{XX}_{ColumnName}\`
- CU_DisplayName, CU_Status, CU_Email
- CO_FirstName, CO_LastName, CO_Phone
- AD_Line1, AD_City, AD_Country

This ensures clear ownership and enables self-documenting relationships.`,
      metadata: {
        suggestions: ["Add a customer", "Add a contact", "Show standards"],
      },
    };
  }

  // ============================================================================
  // INTERNATIONAL STANDARDS INFO
  // ============================================================================

  if (lower.includes("standard") || lower.includes("iso") || lower.includes("international")) {
    return {
      content: `**International Standards in OZMetaDB**

We support these ISO/IANA standards:

**Geographic**
- ISO 3166-1 - Country codes (alpha-2, alpha-3)
- ISO 3166-2 - State/province codes

**Communication**
- E.164 - Phone number format
- RFC 5322 - Email validation

**Financial**
- ISO 4217 - Currency codes

**Localization**
- IANA - Timezone database
- ISO 639-1 - Language codes
- RTL language support

All picker components enforce these standards automatically.`,
      metadata: {
        suggestions: ["Add a customer", "Show naming convention", "Go to model"],
      },
    };
  }

  // ============================================================================
  // DIMENSION INFO (without starting wizard)
  // ============================================================================

  if (lower.includes("customer") && (lower.includes("info") || lower.includes("what") || lower.includes("show"))) {
    return {
      content: `**Customer Dimension (CU prefix)**

Core fields with TREM_ID naming:
- **CU_ID** - UUID primary key
- **CU_Type** - individual/business/government
- **CU_Status** - prospect/lead/active/inactive
- **CU_DisplayName** - Full name (required)
- **CU_Email** - RFC 5322 validated
- **CU_Country** - ISO 3166-1 alpha-2
- **CU_Currency** - ISO 4217
- **CU_Timezone** - IANA timezone
- **CU_Language** - ISO 639-1

Foreign Keys:
- **CUCU_ID** - Parent customer (self-reference)
- **CUOR_ID** - Organization link

Would you like to add a new customer?`,
      metadata: {
        actions: [
          { label: "Add Customer", action: "add customer" },
          { label: "Go to Model", action: "go to model" },
        ],
      },
    };
  }

  if (lower.includes("contact") && (lower.includes("info") || lower.includes("what") || lower.includes("show"))) {
    return {
      content: `**Contact Dimension (CO prefix)**

Core fields with TREM_ID naming:
- **CO_ID** - UUID primary key
- **CO_Type** - primary/billing/technical/support
- **CO_FirstName** - First name (required)
- **CO_LastName** - Last name (required)
- **CO_Email** - RFC 5322 validated
- **CO_Phone** - E.164 format
- **CO_Language** - ISO 639-1
- **CO_Timezone** - IANA timezone

Foreign Keys:
- **COCU_ID** - Customer link
- **COOR_ID** - Organization link

Would you like to add a new contact?`,
      metadata: {
        actions: [
          { label: "Add Contact", action: "add contact" },
          { label: "Go to Model", action: "go to model" },
        ],
      },
    };
  }

  if (lower.includes("project") && (lower.includes("info") || lower.includes("what") || lower.includes("show"))) {
    return {
      content: `**Project Dimension (PJ prefix)**

Core fields with TREM_ID naming:
- **PJ_ID** - UUID primary key
- **PJ_Code** - Short identifier (required)
- **PJ_Name** - Project name (required)
- **PJ_Status** - draft/planning/active/completed
- **PJ_Timezone** - IANA timezone
- **PJ_Currency** - ISO 4217

Foreign Keys:
- **PJCU_ID** - Owner (customer)
- **PJCO_ID** - Primary contact
- **PJOR_ID** - Organization

Would you like to create a new project?`,
      metadata: {
        actions: [
          { label: "Create Project", action: "add project" },
          { label: "Go to Projects", action: "go to projects" },
        ],
      },
    };
  }

  // ============================================================================
  // THEME COMMANDS
  // ============================================================================

  if (lower.includes("dark mode") || lower.includes("dark theme")) {
    return {
      content: `To enable dark mode, go to Settings and select "Dark" in the Appearance Mode section.`,
      metadata: {
        actions: [{ label: "Open Settings", action: "go to settings" }],
      },
    };
  }

  if (lower.includes("modern theme") || lower.includes("change theme") || lower.includes("theme")) {
    return {
      content: `Go to Settings to choose from 6 pre-built themes:
- **Classic** - Traditional blue with professional feel
- **Modern** - Clean violet with rounded corners
- **Compact** - Dense layout with monospace font
- **High Contrast** - Accessibility-focused dark theme
- **Dark Pro** - Professional dark mode
- **Warm Light** - Soft orange tones`,
      navigate: "/settings",
    };
  }

  // ============================================================================
  // HELP
  // ============================================================================

  if (lower.includes("help") || lower.includes("what can you") || lower === "?" || lower.includes("what do you")) {
    return {
      content: `**OZMetaDB Assistant**

I can help you with:

**Add Data** (with guided wizards!)
- "Add a customer" - Create new customer record
- "Add a contact" - Create new contact
- "Add a project" - Create new project
- "Add an address" - Create new address

**Navigation**
- "Go to settings", "Open model", "Show workflows"

**Information**
- "Show naming convention" - TREM_ID format
- "Show international standards" - ISO codes
- "What is customer dimension?"

**Themes**
- "Enable dark mode"
- "Change to modern theme"

Just type naturally and I'll help!`,
      metadata: {
        suggestions: ["Add a customer", "Add a project", "Go to settings", "Show standards"],
      },
    };
  }

  // ============================================================================
  // DEFAULT RESPONSE
  // ============================================================================

  return {
    content: `I'm not sure what you mean by "${userMessage}".

**Quick Actions:**
- "Add a customer" - Start customer wizard
- "Add a contact" - Start contact wizard
- "Add a project" - Start project wizard
- "Go to [page]" - Navigate
- "Help" - See all commands`,
    metadata: {
      suggestions: ["Help", "Add a customer", "Go to dashboard"],
    },
  };
}

export function AIChatPanel({ isOpen, onClose, className }: AIChatPanelProps) {
  const router = useRouter();
  const { t, language } = useTranslation();

  // Generate welcome message based on current language
  const getWelcomeMessage = React.useCallback((): Message => ({
    id: "welcome",
    role: "assistant",
    content: `${t("chat.welcome.title")}

**${t("chat.welcome.quickStart")}**
- ${t("chat.welcome.addCustomer")}
- ${t("chat.welcome.addContact")}
- ${t("chat.welcome.addProject")}
- ${t("chat.welcome.showAll")}

${t("chat.welcome.namingConvention")}

${t("chat.welcome.help")}`,
    timestamp: new Date(),
    status: "complete",
    metadata: {
      suggestions: [
        t("table.customer"),
        t("table.project"),
        t("common.add"),
        "Help",
      ],
    },
  }), [t]);

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activeWizard, setActiveWizard] = React.useState<TableCode | null>(null);
  const [showWizardSelector, setShowWizardSelector] = React.useState(false);
  const [wizardMessageId, setWizardMessageId] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Initialize welcome message on mount and language change
  React.useEffect(() => {
    setMessages([getWelcomeMessage()]);
  }, [getWelcomeMessage]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeWizard, showWizardSelector]);

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
      status: "complete",
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Generate response with current language
    const assistantId = `assistant-${Date.now()}`;
    const response = generateResponse(content, language);

    // Add placeholder message
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        status: "streaming",
      },
    ]);

    // Simulate streaming
    const isNavigating = !!response.navigate;
    const delay = isNavigating ? 15 : 25;

    let currentContent = "";
    const words = response.content.split(" ");

    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      currentContent += (i === 0 ? "" : " ") + words[i];
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: currentContent } : m))
      );
    }

    // Finalize message
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId ? { ...m, status: "complete", metadata: response.metadata } : m
      )
    );
    setIsLoading(false);

    // Start wizard if requested
    if (response.startWizard) {
      setActiveWizard(response.startWizard);
      setWizardMessageId(assistantId);
      setShowWizardSelector(false);
    }

    // Show wizard selector if requested
    if (response.showWizardSelector) {
      setShowWizardSelector(true);
      setActiveWizard(null);
    }

    // Navigate if requested
    if (response.navigate) {
      setTimeout(() => {
        router.push(response.navigate!);
      }, 300);
    }
  };

  const handleWizardSelect = (tableCode: string) => {
    setShowWizardSelector(false);
    setActiveWizard(tableCode);
  };

  const handleStop = () => {
    setIsLoading(false);
    setMessages((prev) =>
      prev.map((m) => (m.status === "streaming" ? { ...m, status: "complete" } : m))
    );
  };

  const handleAction = (action: string) => {
    handleSend(action);
  };

  const handleWizardComplete = (data: Record<string, unknown>) => {
    const tableCode = activeWizard!;
    setActiveWizard(null);

    // Map table code to translation key
    const tableNameKeys: Record<string, string> = {
      cu: "table.customer",
      co: "table.contact",
      ad: "table.address",
      or: "table.organization",
      pj: "table.project",
    };
    const typeNameKey = tableNameKeys[tableCode.toLowerCase()];
    const typeName = typeNameKey ? t(typeNameKey) : tableCode;

    // Add completion message with summary
    const summaryMessage: Message = {
      id: `summary-${Date.now()}`,
      role: "assistant",
      content: t("chat.recordCreated"),
      timestamp: new Date(),
      status: "complete",
      metadata: {
        wizardComplete: { type: tableCode, data },
        suggestions: [
          `${t("common.add")} ${typeName}`,
          tableCode === "cu" ? `${t("common.add")} ${t("table.contact")}` : `${t("common.add")} ${t("table.customer")}`,
          t("nav.model"),
        ],
      },
    };
    setMessages((prev) => [...prev, summaryMessage]);
  };

  const handleWizardCancel = () => {
    setActiveWizard(null);
    setShowWizardSelector(false);
    const cancelMessage: Message = {
      id: `cancel-${Date.now()}`,
      role: "assistant",
      content: t("chat.wizardCancelled"),
      timestamp: new Date(),
      status: "complete",
      metadata: {
        suggestions: ["Help", `${t("common.add")} ${t("table.customer")}`, t("nav.dashboard")],
      },
    };
    setMessages((prev) => [...prev, cancelMessage]);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col bg-background border shadow-2xl rounded-xl overflow-hidden transition-all duration-300",
        isExpanded ? "inset-4" : "bottom-4 right-4 w-[420px] h-[600px] max-h-[80vh]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">OZMeta Assistant</h3>
            <p className="text-xs text-muted-foreground">AI-powered help</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.map((message) => (
          <React.Fragment key={message.id}>
            <ChatMessage
              message={message}
              isStreaming={message.status === "streaming"}
              onAction={handleAction}
            />
            {/* Show wizard summary if present */}
            {message.metadata?.wizardComplete && (
              <div className="px-4 py-2">
                <WizardSummary
                  tableCode={message.metadata.wizardComplete.type as string}
                  data={message.metadata.wizardComplete.data as Record<string, unknown>}
                />
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Wizard Selector */}
        {showWizardSelector && (
          <div className="px-4 py-2">
            <WizardSelector onSelect={handleWizardSelect} />
          </div>
        )}

        {/* Active Dynamic Wizard */}
        {activeWizard && (
          <div className="px-4 py-2">
            <DynamicWizard
              tableCode={activeWizard}
              onComplete={handleWizardComplete}
              onCancel={handleWizardCancel}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isLoading={isLoading}
        disabled={!!activeWizard || showWizardSelector}
        placeholder={
          activeWizard
            ? t("chat.placeholder.wizard")
            : showWizardSelector
              ? t("chat.placeholder.selector")
              : t("chat.placeholder.default")
        }
        suggestions={messages.length === 1 ? [
          `${t("common.add")} ${t("table.customer")}`,
          `${t("common.add")} ${t("table.project")}`,
          t("common.add"),
          "Help"
        ] : []}
      />
    </div>
  );
}

// Floating trigger button
export function AIChatTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
      title="Open AI Assistant"
    >
      <MessageSquare className="h-6 w-6" />
    </button>
  );
}
