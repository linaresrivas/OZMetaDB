---
title: Data Lineage
---
flowchart LR

    subgraph Canonical_Model["Canonical Model"]
        tbl_None[["dp.Transaction"]]
    end

    subgraph Canonical_Fields["Canonical Fields"]
        fld_None("Transaction._TenantID")
    end

    %% Edges
    tbl_None --> fld_None
    tbl_None --> fld_None
    tbl_None --> fld_None
    tbl_None --> fld_None

    %% Styling
    classDef source fill:#e1f5fe,stroke:#01579b
    classDef canonical fill:#e8f5e9,stroke:#1b5e20
    classDef metric fill:#fff3e0,stroke:#e65100
    classDef report fill:#fce4ec,stroke:#880e4f
    class tbl_None canonical
    class fld_None canonical