import type { PermissionAccess, PermissionGrant, Severity } from "../../core/types";

export type { PermissionAccess, PermissionGrant, Severity };

export interface Org {
  login: string;
  role: string | null;
}

export interface PermissionDefinition {
  name: string;
  title: string;
  description: string;
  category: string;
  access: PermissionAccess[];
  readCapabilities: string[];
  writeCapabilities: string[];
}

export interface ScopeDefinition {
  name: string;
  description: string;
  severity: Severity;
  category: string;
  capabilities: string[];
}

export interface CapabilityDefinition {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: string;
  scopes: string[];
  permissions: string[];
}

export interface Capability {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: string;
  /** The scopes or permissions that produced this capability. */
  matchedScopes: string[];
}
