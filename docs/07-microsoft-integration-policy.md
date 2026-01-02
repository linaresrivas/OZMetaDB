# Microsoft Integration Policy (Azure/Fabric/Power BI)

## Principle
Microsoft standards and constraints are respected at the edge, not adopted as canonical truth.

## What we respect
- Azure resource naming constraints (lowercase, length limits, etc.)
- Fabric workspace/lakehouse/warehouse constraints
- Power BI semantic model patterns (facts/dims, measures, RLS)

## What we do NOT adopt as canonical
- Vendor-specific naming as canonical identity
- Platform-driven table/field naming conventions
- Tool-specific shortcuts that break portability

## How we integrate
MetaDB stores:
- CanonicalName
- PhysicalName per platform
- Semantic aliases (friendly names) where required

Thus, Fabric/Power BI can present user-friendly names while canonical remains consistent.
